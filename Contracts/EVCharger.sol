// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ITokenBridgeable.sol";

contract EVCharger is NonblockingLzApp, AccessControl {
    ITokenBridgeable public token;

    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    struct Payment {
        address user;
        uint256 amount;
        bytes32 stationId;
        bool paid;
    }

    mapping(uint256 => Payment) public sessions; // sessionId => Payment
    mapping(bytes32 => uint256[]) public stationSessions; // stationId => sessionIds
    mapping(uint16 => mapping(uint64 => bytes)) public pendingAck;

    event ReceivedPayload(uint16 srcChainId, bytes srcAddress, uint64 nonce, bytes payload);
    event PaymentStored(uint256 indexed sessionId, address user, uint256 amount, bytes32 indexed stationId);
    event AckSent(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId, uint256 f>    event AckDeferred(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId, uint2>    event MintSuccess(address indexed user,  uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId, uint>    event MintFailed(address indexed user,  uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId, strin>    event DebugStep(string step);
    event DebugValues(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId);


    constructor(address _endpoint, address _token) NonblockingLzApp(_endpoint) {
        token = ITokenBridgeable(_token);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, address(this));
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        emit ReceivedPayload(_srcChainId, _srcAddress, _nonce, _payload);

        address user;
        uint256 amount;
        uint256 sessionId;
        bytes32 stationId;

        try this.decodePayload(_payload) returns (address u, uint256 a, uint256 s, bytes32 sid) {
            user = u;
            amount = a;
            sessionId = s;
            stationId = sid;
            emit DebugValues(user, amount, sessionId, stationId);
        } catch {
            emit DebugStep("Payload decode failed");
            revert("Payload decode failed");
        }

        try token.mint(msg.sender, amount) {
            emit MintSuccess(user, amount, sessionId, stationId, block.timestamp);
        } catch Error(string memory reason) {
            emit MintFailed(user, amount, sessionId, stationId, reason, block.timestamp);
                // Optionally reverse session storage if mint fails
        }

        _safeAck(_srcChainId, user, amount, sessionId, stationId, _nonce);
  }

    function _safeAck(
        uint16 _srcChainId,
        address to,
        uint256 amount,
        uint256 sessionId,
        bytes32 stationId,
        uint64 nonce
    ) internal {
        bytes memory ackPayload = abi.encode(to, amount, sessionId, stationId);
        bytes memory adapterParams = abi.encodePacked(uint16(1), uint256(20000000));

        (uint256 fee, ) = lzEndpoint.estimateFees(
            _srcChainId,
            address(this),
            ackPayload,
            false,
            adapterParams
        );

        sessions[sessionId] = Payment(to, amount, stationId, true);
        stationSessions[stationId].push(sessionId);

        if (address(this).balance >= fee) {
            _lzSend(_srcChainId, ackPayload, payable(address(this)), address(0), adapterParams, fee);
            emit AckSent(to, amount, sessionId, stationId, fee, block.timestamp);
        }
        else {
            pendingAck[_srcChainId][nonce] = ackPayload;
            emit AckDeferred(to, amount, sessionId, stationId, fee, nonce);
        }

    }

    // Retry sending a previously failed ACK manually
    function retryAck(uint16 _srcChainId, uint64 _nonce) external payable onlyRole(ADMIN_ROLE) {
        bytes memory ackPayload = pendingAck[_srcChainId][_nonce];
        require(ackPayload.length > 0, "No pending ACK");

        bytes memory adapterParams = abi.encodePacked(uint16(1), uint256(2000000));

        (uint256 fee, ) = lzEndpoint.estimateFees(
            _srcChainId,
            address(this),
            ackPayload,
            false,
            adapterParams
        );

        require(msg.value >= fee, "Insufficient fee");

        _lzSend(_srcChainId, ackPayload, payable(address(this)), address(0), adapterParams, fee);
         delete pendingAck[_srcChainId][_nonce];
           emit DebugStep("Manual ACK sent");
    }


    function resumeStuckMessage(uint16 _srcChainId, bytes calldata _srcAddress) external onlyRole(ADMIN_ROLE) {
    lzEndpoint.forceResumeReceive(_srcChainId, _srcAddress);
    emit DebugStep("forceResumeReceive called");
    }

    // View contract's current native balance
    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Withdraw native tokens to a designated address
    function withdrawNative(address payable to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit DebugStep("Native tokens withdrawn");
    }

    function decodePayload(bytes memory payload) external pure returns (address, uint256, uint256, bytes32) {
        return abi.decode(payload, (address, uint256, uint256, bytes32));
    }
 // Fallback to receive native tokens (e.g., BNB or ETH)
    receive() external payable {
        emit DebugStep("Native token received");
    }
}