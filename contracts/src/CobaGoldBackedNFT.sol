// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CobaGoldBackedNFT
 * @notice ERC-721 where each token costs USDT computed as (usdtMicroPerGram * 96 / 10) = 9.6 × micro-USDT per gram.
 * @dev Physical gold backing and compliance are off-chain/legal — this contract enforces USDT payment + mint, and optional on-chain redeem.
 *      USDT uses 6 decimals. usdtMicroPerGram is whole micro-USDT units per gram (e.g. 150_000_000 = $150 per gram).
 */
contract CobaGoldBackedNFT is ERC721, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdt;
    address public treasury;

    /// @notice Micro-USDT (6-decimal units) charged per gram of gold represented by one NFT.
    uint256 public usdtMicroPerGram;

    uint256 public totalMinted;

    uint256 public constant MAX_SUPPLY = 9_000_000_000;

    uint256 private _nextTokenId = 1;

    string private _baseTokenURI;

    /// @dev 9.6 grams as rational 96 / 10
    uint256 private constant GRAMS_NUM = 96;
    uint256 private constant GRAMS_DEN = 10;

    event TreasuryUpdated(address indexed treasury);
    event UsdtMicroPerGramUpdated(uint256 value);
    event BaseURIUpdated(string baseURI);
    event Minted(address indexed to, uint256 quantity, uint256 firstId, uint256 lastId);
    event Redeemed(address indexed from, uint256 indexed tokenId, uint256 usdtPaid);

    constructor(
        address usdt_,
        address treasury_,
        string memory name_,
        string memory symbol_,
        uint256 usdtMicroPerGram_,
        string memory baseURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        require(usdt_ != address(0) && treasury_ != address(0), "zero addr");
        require(usdtMicroPerGram_ > 0, "price");
        usdt = IERC20(usdt_);
        treasury = treasury_;
        usdtMicroPerGram = usdtMicroPerGram_;
        _baseTokenURI = baseURI_;
    }

    function setTreasury(address t) external onlyOwner {
        require(t != address(0), "zero");
        treasury = t;
        emit TreasuryUpdated(t);
    }

    function setUsdtMicroPerGram(uint256 v) external onlyOwner {
        require(v > 0, "price");
        usdtMicroPerGram = v;
        emit UsdtMicroPerGramUpdated(v);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice Total USDT (micro units) required for one NFT at current price.
    function usdtForOneNft() public view returns (uint256) {
        return (usdtMicroPerGram * GRAMS_NUM) / GRAMS_DEN;
    }

    /**
     * @param quantity Number of NFTs to mint (must be > 0).
     */
    function mint(uint256 quantity) external {
        require(quantity > 0, "qty");
        require(totalMinted + quantity <= MAX_SUPPLY, "cap");

        uint256 unit = usdtForOneNft();
        uint256 totalUsdt = unit * quantity;

        usdt.safeTransferFrom(msg.sender, treasury, totalUsdt);

        uint256 first = _nextTokenId;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 id = _nextTokenId++;
            totalMinted++;
            _safeMint(msg.sender, id);
        }
        emit Minted(msg.sender, quantity, first, _nextTokenId - 1);
    }

    /**
     * @notice Sell/redeem one NFT back for USDT at the current on-chain gold price.
     * @dev Pays `usdtForOneNft()` at execution time (tracks live `usdtMicroPerGram`).
     *      Requires `treasury` to have funded USDT and approved this contract to spend it.
     */
    function redeem(uint256 tokenId) external {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "no token");
        require(owner == msg.sender, "not owner");
        require(
            _isAuthorized(owner, msg.sender, tokenId),
            "nft approval"
        );

        uint256 payout = usdtForOneNft();
        require(payout > 0, "price");

        _burn(tokenId);

        usdt.safeTransferFrom(treasury, msg.sender, payout);

        emit Redeemed(msg.sender, tokenId, payout);
    }

    /// @notice USDT allowance from treasury → this contract (must be >= payout for redeems).
    function treasuryUsdtAllowance() external view returns (uint256) {
        return usdt.allowance(treasury, address(this));
    }

    /// @notice True if `spender` is approved to operate `tokenId` for `owner` (or operator for all).
    function isNftTransferAllowed(address owner, address spender, uint256 tokenId) external view returns (bool) {
        return _isAuthorized(owner, spender, tokenId);
    }
}
