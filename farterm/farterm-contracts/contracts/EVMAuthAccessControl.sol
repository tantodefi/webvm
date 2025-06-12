// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EVMAuthAccessControl
 * @dev Base access control contract with role management and blacklisting
 * 
 * Adapted from EVMAuth (https://evmauth.io) architecture for WebVM session management.
 * Original EVMAuth Core: https://github.com/evmauth/evmauth-core
 */
contract EVMAuthAccessControl is AccessControl {
    bytes32 public constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
    bytes32 public constant FINANCE_ROLE = keccak256("FINANCE_ROLE");
    bytes32 public constant TOKEN_MANAGER_ROLE = keccak256("TOKEN_MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    mapping(address => bool) private _blacklisted;

    event AccountBlacklisted(address indexed account);
    event AccountUnblacklisted(address indexed account);

    constructor(address initialAdmin) {
        // Grant initial roles to the admin
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(BLACKLIST_ROLE, initialAdmin);
        _grantRole(FINANCE_ROLE, initialAdmin);
        _grantRole(TOKEN_MANAGER_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
        _grantRole(BURNER_ROLE, initialAdmin);
    }

    /**
     * @dev Modifier to check if an account is not blacklisted
     */
    modifier notBlacklisted(address account) {
        require(!_blacklisted[account], "EVMAuth: account is blacklisted");
        _;
    }

    /**
     * @dev Blacklist an account
     */
    function blacklistAccount(address account) external onlyRole(BLACKLIST_ROLE) {
        _blacklisted[account] = true;
        emit AccountBlacklisted(account);
    }

    /**
     * @dev Remove an account from blacklist
     */
    function unblacklistAccount(address account) external onlyRole(BLACKLIST_ROLE) {
        _blacklisted[account] = false;
        emit AccountUnblacklisted(account);
    }

    /**
     * @dev Check if an account is blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    /**
     * @dev Grant multiple roles to an account in a single transaction
     */
    function grantRoles(bytes32[] calldata roles, address account) external {
        for (uint256 i = 0; i < roles.length; i++) {
            grantRole(roles[i], account);
        }
    }

    /**
     * @dev Revoke multiple roles from an account in a single transaction
     */
    function revokeRoles(bytes32[] calldata roles, address account) external {
        for (uint256 i = 0; i < roles.length; i++) {
            revokeRole(roles[i], account);
        }
    }
} 