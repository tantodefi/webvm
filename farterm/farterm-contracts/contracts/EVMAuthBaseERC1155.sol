// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./EVMAuthAccessControl.sol";

/**
 * @title EVMAuthBaseERC1155
 * @dev Base ERC1155 contract with token metadata management
 * 
 * Adapted from EVMAuth (https://evmauth.io) architecture for WebVM session management.
 * Original EVMAuth Core: https://github.com/evmauth/evmauth-core
 */
contract EVMAuthBaseERC1155 is ERC1155, EVMAuthAccessControl, ReentrancyGuard {
    struct TokenMetadata {
        bool active;
        bool burnable;
        bool transferable;
        uint256 price;
        uint256 ttl; // Time to live in seconds
    }

    mapping(uint256 => TokenMetadata) public tokenMetadata;
    uint256 private _currentTokenId;

    event TokenMetadataSet(
        uint256 indexed tokenId,
        bool active,
        bool burnable,
        bool transferable,
        uint256 price,
        uint256 ttl
    );

    constructor(
        string memory uri,
        address initialAdmin
    ) ERC1155(uri) EVMAuthAccessControl(initialAdmin) {}

    /**
     * @dev Set token metadata
     */
    function setTokenMetadata(
        uint256 tokenId,
        bool active,
        bool burnable,
        bool transferable,
        uint256 price,
        uint256 ttl
    ) external onlyRole(TOKEN_MANAGER_ROLE) {
        tokenMetadata[tokenId] = TokenMetadata({
            active: active,
            burnable: burnable,
            transferable: transferable,
            price: price,
            ttl: ttl
        });

        emit TokenMetadataSet(tokenId, active, burnable, transferable, price, ttl);
    }

    /**
     * @dev Get next available token ID
     */
    function getNextTokenId() external view returns (uint256) {
        return _currentTokenId + 1;
    }

    /**
     * @dev Increment and return new token ID
     */
    function _getNewTokenId() internal returns (uint256) {
        _currentTokenId++;
        return _currentTokenId;
    }

    /**
     * @dev Mint tokens to an account
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) notBlacklisted(to) {
        require(tokenMetadata[tokenId].active, "EVMAuth: token not active");
        _mint(to, tokenId, amount, data);
    }

    /**
     * @dev Batch mint tokens to an account
     */
    function mintBatch(
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) notBlacklisted(to) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenMetadata[tokenIds[i]].active, "EVMAuth: token not active");
        }
        _mintBatch(to, tokenIds, amounts, data);
    }

    /**
     * @dev Burn tokens from an account
     */
    function burn(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external onlyRole(BURNER_ROLE) {
        require(tokenMetadata[tokenId].burnable, "EVMAuth: token not burnable");
        _burn(from, tokenId, amount);
    }

    /**
     * @dev Batch burn tokens from an account
     */
    function burnBatch(
        address from,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyRole(BURNER_ROLE) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenMetadata[tokenIds[i]].burnable, "EVMAuth: token not burnable");
        }
        _burnBatch(from, tokenIds, amounts);
    }

    /**
     * @dev Override transfer functions to check transferability and blacklist
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override notBlacklisted(from) notBlacklisted(to) {
        require(tokenMetadata[id].transferable, "EVMAuth: token not transferable");
        super.safeTransferFrom(from, to, id, amount, data);
    }

    /**
     * @dev Override batch transfer functions to check transferability and blacklist
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override notBlacklisted(from) notBlacklisted(to) {
        for (uint256 i = 0; i < ids.length; i++) {
            require(tokenMetadata[ids[i]].transferable, "EVMAuth: token not transferable");
        }
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /**
     * @dev Check if a token is active
     */
    function isTokenActive(uint256 tokenId) external view returns (bool) {
        return tokenMetadata[tokenId].active;
    }

    /**
     * @dev Check if a token is burnable
     */
    function isTokenBurnable(uint256 tokenId) external view returns (bool) {
        return tokenMetadata[tokenId].burnable;
    }

    /**
     * @dev Check if a token is transferable
     */
    function isTokenTransferable(uint256 tokenId) external view returns (bool) {
        return tokenMetadata[tokenId].transferable;
    }

    /**
     * @dev Get token price
     */
    function getTokenPrice(uint256 tokenId) external view returns (uint256) {
        return tokenMetadata[tokenId].price;
    }

    /**
     * @dev Get token TTL
     */
    function getTokenTTL(uint256 tokenId) external view returns (uint256) {
        return tokenMetadata[tokenId].ttl;
    }

    /**
     * @dev Override supportsInterface to include all inherited interfaces
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 