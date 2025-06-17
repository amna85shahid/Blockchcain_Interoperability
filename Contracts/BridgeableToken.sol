// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// events declaration before emitting
event TokensLocked(address indexed from, uint256 amount);
event TokensUnlocked(address indexed to, uint256 amount);
event TokensMinted(address indexed to, uint256 amount);
event TokensBurned(address indexed from, uint256 amount);

contract BridgeableToken is ERC20, AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address bridgeAdmin
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, bridgeAdmin);
        _grantRole(BRIDGE_ROLE, bridgeAdmin);
        _mint(bridgeAdmin, initialSupply);
        _mint(bridgeAdmin, initialSupply);
         }

    function mint(address to, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    function lock(address from, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _transfer(from, address(this), amount);
        emit TokensLocked(from, amount);
    }

    // Optional: For future refund or unlock scenarios
    function unlock(address to, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _transfer(address(this), to, amount);
        emit TokensUnlocked(to, amount);
    }