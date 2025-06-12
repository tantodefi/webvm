// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EVMAuthBaseERC1155.sol";

/**
 * @title EVMAuthPurchasableERC1155
 * @dev ERC1155 contract with direct token purchasing functionality
 * 
 * Adapted from EVMAuth (https://evmauth.io) architecture for WebVM session management.
 * Original EVMAuth Core: https://github.com/evmauth/evmauth-core
 */
contract EVMAuthPurchasableERC1155 is EVMAuthBaseERC1155 {
    mapping(address => uint256) internal _walletBalances;
    uint256 internal _totalFunds;

    event TokenPurchased(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 price,
        uint256 totalCost
    );
    event FundsWithdrawn(address indexed to, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);

    constructor(
        string memory uri,
        address initialAdmin
    ) EVMAuthBaseERC1155(uri, initialAdmin) {}

    /**
     * @dev Purchase tokens directly with ETH
     */
    function purchaseToken(uint256 tokenId) external payable nonReentrant notBlacklisted(msg.sender) {
        TokenMetadata memory metadata = tokenMetadata[tokenId];
        require(metadata.active, "EVMAuth: token not active");
        require(metadata.price > 0, "EVMAuth: token not for sale");
        require(msg.value >= metadata.price, "EVMAuth: insufficient payment");

        // Mint the token to the buyer
        _mint(msg.sender, tokenId, 1, "");

        // Handle payment
        _totalFunds += msg.value;
        _walletBalances[address(this)] += msg.value;

        // Refund excess payment
        if (msg.value > metadata.price) {
            uint256 refund = msg.value - metadata.price;
            _totalFunds -= refund;
            _walletBalances[address(this)] -= refund;
            payable(msg.sender).transfer(refund);
        }

        emit TokenPurchased(msg.sender, tokenId, 1, metadata.price, metadata.price);
    }

    /**
     * @dev Purchase multiple tokens of the same type
     */
    function purchaseTokens(uint256 tokenId, uint256 amount) 
        external 
        payable 
        nonReentrant 
        notBlacklisted(msg.sender) 
    {
        TokenMetadata memory metadata = tokenMetadata[tokenId];
        require(metadata.active, "EVMAuth: token not active");
        require(metadata.price > 0, "EVMAuth: token not for sale");
        require(amount > 0, "EVMAuth: amount must be greater than 0");

        uint256 totalCost = metadata.price * amount;
        require(msg.value >= totalCost, "EVMAuth: insufficient payment");

        // Mint the tokens to the buyer
        _mint(msg.sender, tokenId, amount, "");

        // Handle payment
        _totalFunds += totalCost;
        _walletBalances[address(this)] += totalCost;

        // Refund excess payment
        if (msg.value > totalCost) {
            uint256 refund = msg.value - totalCost;
            _totalFunds -= refund;
            _walletBalances[address(this)] -= refund;
            payable(msg.sender).transfer(refund);
        }

        emit TokenPurchased(msg.sender, tokenId, amount, metadata.price, totalCost);
    }

    /**
     * @dev Withdraw funds from the contract
     */
    function withdrawFunds(address payable to, uint256 amount) 
        external 
        onlyRole(FINANCE_ROLE) 
        nonReentrant 
    {
        require(to != address(0), "EVMAuth: cannot withdraw to zero address");
        require(amount > 0, "EVMAuth: amount must be greater than 0");
        require(amount <= address(this).balance, "EVMAuth: insufficient contract balance");
        require(amount <= _totalFunds, "EVMAuth: amount exceeds available funds");

        _totalFunds -= amount;
        _walletBalances[address(this)] -= amount;

        to.transfer(amount);
        emit FundsWithdrawn(to, amount);
    }

    /**
     * @dev Withdraw all funds from the contract
     */
    function withdrawAllFunds(address payable to) external onlyRole(FINANCE_ROLE) nonReentrant {
        require(to != address(0), "EVMAuth: cannot withdraw to zero address");
        require(_totalFunds > 0, "EVMAuth: no funds to withdraw");

        uint256 amount = _totalFunds;
        _totalFunds = 0;
        _walletBalances[address(this)] = 0;

        to.transfer(amount);
        emit FundsWithdrawn(to, amount);
    }

    /**
     * @dev Deposit funds to the contract (for testing or additional funding)
     */
    function depositFunds() external payable {
        require(msg.value > 0, "EVMAuth: must send some ETH");
        _totalFunds += msg.value;
        _walletBalances[address(this)] += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Get the total funds in the contract
     */
    function getTotalFunds() external view returns (uint256) {
        return _totalFunds;
    }

    /**
     * @dev Get the contract's ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get wallet balance for an address
     */
    function getWalletBalance(address wallet) external view returns (uint256) {
        return _walletBalances[wallet];
    }

    /**
     * @dev Calculate total cost for purchasing multiple tokens
     */
    function calculateTotalCost(uint256 tokenId, uint256 amount) external view returns (uint256) {
        return tokenMetadata[tokenId].price * amount;
    }

    /**
     * @dev Check if a token can be purchased
     */
    function canPurchaseToken(uint256 tokenId) external view returns (bool) {
        TokenMetadata memory metadata = tokenMetadata[tokenId];
        return metadata.active && metadata.price > 0;
    }

    /**
     * @dev Emergency function to recover stuck ETH (only admin)
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "EVMAuth: no balance to withdraw");
        
        payable(msg.sender).transfer(balance);
        _totalFunds = 0;
        _walletBalances[address(this)] = 0;
    }

    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {
        _totalFunds += msg.value;
        _walletBalances[address(this)] += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        _totalFunds += msg.value;
        _walletBalances[address(this)] += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
} 