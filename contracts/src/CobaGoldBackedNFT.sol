// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CobaGoldBackedNFT
 * @notice ERC-721 where each token costs USDT computed as (usdtMicroPerGram * 96 / 10) = 9.6 × micro-USDT per gram.
 * @dev Physical gold backing, redemption, and compliance are off-chain/legal — this contract only enforces USDT payment + mint.
 *      USDT uses 6 decimals. usdtMicroPerGram is whole micro-USDT units per gram (e.g. 150_000_000 = $150 per gram).
 */
contract CobaGoldBackedNFT is ERC721, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdt;
    address public treasury;

    /// @notice Micro-USDT (6-decimal units) charged per gram of gold represented by one NFT.
    uint256 public usdtMicroPerGram;

    uint256 public totalMinted;

    uint256 public constant MAX_SUPPLY = 1_000_000;

    /// @notice Max NFTs per mint transaction (gas limit safety).
    uint256 public constant MAX_MINT_PER_TX = 20;

    uint256 private _nextTokenId = 1;

    string private _baseTokenURI;

    /// @dev 9.6 grams as rational 96 / 10
    uint256 private constant GRAMS_NUM = 96;
    uint256 private constant GRAMS_DEN = 10;

    event TreasuryUpdated(address indexed treasury);
    event UsdtMicroPerGramUpdated(uint256 value);
    event BaseURIUpdated(string baseURI);
    event Minted(address indexed to, uint256 quantity, uint256 firstId, uint256 lastId);

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
     * @param quantity Number of NFTs to mint (1 .. MAX_MINT_PER_TX).
     */
    function mint(uint256 quantity) external {
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "qty");
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
}
