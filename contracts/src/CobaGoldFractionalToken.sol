// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CobaGoldFractionalToken
 * @notice Fractional COBA token priced from 9.6g gold in micro-USDT.
 * @dev Uses ERC-20 (18 decimals), so users can buy/redeem partial amounts like 0.001.
 *      Price of 1 full token is derived as: usdtMicroPerGram * 9.6.
 */
contract CobaGoldFractionalToken is ERC20, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdt;
    address public treasury;

    /// @notice Micro-USDT (6-decimal units) per 1 gram of gold.
    uint256 public usdtMicroPerGram;

    /// @notice Minimum buy amount in token wei (18 decimals). 0.001 token = 1e15.
    uint256 public minBuyAmount;

    /// @dev 9.6 grams as rational 96 / 10
    uint256 private constant GRAMS_NUM = 96;
    uint256 private constant GRAMS_DEN = 10;
    uint256 private constant TOKEN_SCALE = 1e18;

    event TreasuryUpdated(address indexed treasury);
    event UsdtMicroPerGramUpdated(uint256 value);
    event MinBuyAmountUpdated(uint256 value);
    event Bought(address indexed buyer, uint256 tokenAmount, uint256 usdtPaid);
    event Redeemed(address indexed seller, uint256 tokenAmount, uint256 usdtPaid);

    constructor(
        address usdt_,
        address treasury_,
        string memory name_,
        string memory symbol_,
        uint256 usdtMicroPerGram_,
        uint256 minBuyAmount_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        require(usdt_ != address(0) && treasury_ != address(0), "zero addr");
        require(usdtMicroPerGram_ > 0, "price");
        require(minBuyAmount_ > 0, "min buy");

        usdt = IERC20(usdt_);
        treasury = treasury_;
        usdtMicroPerGram = usdtMicroPerGram_;
        minBuyAmount = minBuyAmount_;
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

    function setMinBuyAmount(uint256 v) external onlyOwner {
        require(v > 0, "min buy");
        minBuyAmount = v;
        emit MinBuyAmountUpdated(v);
    }

    /// @notice USDT (micro units) required for one full token (1e18 units) at current price.
    function usdtForOneToken() public view returns (uint256) {
        return (usdtMicroPerGram * GRAMS_NUM) / GRAMS_DEN;
    }

    /// @notice Quote USDT (micro units) for `tokenAmount` (18-decimal token units).
    function quoteUsdtForAmount(uint256 tokenAmount) public view returns (uint256) {
        return (tokenAmount * usdtForOneToken()) / TOKEN_SCALE;
    }

    /**
     * @notice Buy fractional COBA token amount using USDT.
     * @param tokenAmount ERC-20 amount in 18-decimal units (e.g. 0.001 token = 1e15).
     */
    function buy(uint256 tokenAmount) external {
        require(tokenAmount >= minBuyAmount, "below min");

        uint256 usdtAmount = quoteUsdtForAmount(tokenAmount);
        require(usdtAmount > 0, "amount");

        usdt.safeTransferFrom(msg.sender, treasury, usdtAmount);
        _mint(msg.sender, tokenAmount);

        emit Bought(msg.sender, tokenAmount, usdtAmount);
    }

    /**
     * @notice Redeem fractional COBA amount back to USDT at current on-chain price.
     * @dev Treasury must fund USDT and approve this contract as spender.
     */
    function redeem(uint256 tokenAmount) external {
        require(tokenAmount > 0, "amount");

        uint256 usdtAmount = quoteUsdtForAmount(tokenAmount);
        require(usdtAmount > 0, "amount");

        _burn(msg.sender, tokenAmount);
        usdt.safeTransferFrom(treasury, msg.sender, usdtAmount);

        emit Redeemed(msg.sender, tokenAmount, usdtAmount);
    }

    /// @notice USDT allowance from treasury -> this contract (must cover redeems).
    function treasuryUsdtAllowance() external view returns (uint256) {
        return usdt.allowance(treasury, address(this));
    }
}
