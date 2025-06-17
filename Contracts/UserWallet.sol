// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import "./ITokenBridgeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UserWallet is NonblockingLzApp {
    ITokenBridgeable public token;

    mapping(address => uint256) public pendingBurn;

    event TokensLocked(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId);
    event PayloadSent(uint16 dstChainId, address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 index>    event AckReceived(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId);
    event TokensBurned(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId);
    event PayloadDecodeFailed(bytes payload);

    constructor(address _endpoint, address _token) NonblockingLzApp(_endpoint) {
        token = ITokenBridgeable(_token);
    }

    function sendCrossChainToken(
        uint16 _dstChainId,
        bytes calldata _receiver,
        uint256 _amount,
        uint256 _sessionId,
        bytes32 _stationId
    ) external payable {
        require(_amount > 0, "Amount must be > 0");

        IERC20 erc20 = IERC20(address(token));

        require(erc20.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");
        require(erc20.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        require(erc20.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        pendingBurn[msg.sender] += _amount;
        emit TokensLocked(msg.sender, _amount, _sessionId, _stationId);

        bytes memory payload = abi.encode(msg.sender, _amount, _sessionId, _stationId);
        bytes memory adapterParams = abi.encodePacked(uint16(1), uint256(1500000));

        (uint256 estimatedFee, ) = lzEndpoint.estimateFees(
            _dstChainId,
            address(this),
            payload,
            false,
            adapterParams
            );

        require(msg.value >= estimatedFee, "Not enough native fee for LayerZero");

        _lzSend(
            _dstChainId,
            payload,
            payable(msg.sender),
            address(0),
            adapterParams,
            msg.value
        );

        emit PayloadSent(_dstChainId, msg.sender, _amount, _sessionId, _stationId);
    }

    function _nonblockingLzReceive(
        uint16,
        bytes memory,
        uint64,
        bytes memory _payload
    ) internal override {
        address user;
        uint256 amount;
        uint256 sessionId;
        bytes32 stationId;
        try this.decodePayload(_payload) returns (address u, uint256 a, uint256 s, bytes32 sid) {
            user = u;
            amount = a;
            sessionId = s;
            stationId = sid;
            } catch {
            emit PayloadDecodeFailed(_payload);
            revert("Payload decode failed");
        }

        require(pendingBurn[user] >= amount, "No pending balance to burn");

        token.burn(address(this), amount);
        pendingBurn[user] -= amount;

        emit AckReceived(user, amount, sessionId, stationId);
        emit TokensBurned(user, amount, sessionId, stationId);
    }

    function decodePayload(bytes memory payload) external pure returns (address, uint256, uint256, bytes32) {
        return abi.decode(payload, (address, uint256, uint256, bytes32));
    }

    function estimateSendFee(
        uint16 _dstChainId,
        uint256 _amount,
        uint256 _sessionId,
        bytes32 _stationId
    ) external view returns (uint256 nativeFee) {
        bytes memory payload = abi.encode(msg.sender, _amount, _sessionId, _stationId);
        bytes memory adapterParams = abi.encodePacked(uint16(1), uint256(1500000));

    (nativeFee, ) = lzEndpoint.estimateFees(
        _dstChainId,
        address(this),
        payload,
        false,
        adapterParams
        );
    }

}
