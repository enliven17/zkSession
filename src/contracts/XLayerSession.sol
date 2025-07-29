// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title XLayerSession
 * @dev Manages secure trading sessions on XLayer with spending limits and time constraints
 */
contract XLayerSession {
    struct Session {
        address user;
        uint256 expiry;
        uint256 spendLimit;
        uint256 spent;
        bool isActive;
    }
    
    mapping(address => Session) public sessions;
    mapping(address => bool) public authorizedTraders;
    
    event SessionCreated(address indexed user, uint256 expiry, uint256 spendLimit);
    event TradeExecuted(address indexed user, uint256 amount, uint256 remaining);
    event SessionExpired(address indexed user);
    event TraderAuthorized(address indexed trader);
    event TraderRevoked(address indexed trader);
    
    modifier onlyAuthorized() {
        require(authorizedTraders[msg.sender], "Not authorized to execute trades");
        _;
    }
    
    modifier sessionExists(address user) {
        require(sessions[user].isActive, "Session does not exist");
        _;
    }
    
    modifier sessionNotExpired(address user) {
        require(block.timestamp < sessions[user].expiry, "Session has expired");
        _;
    }
    
    /**
     * @dev Create a new trading session
     * @param _expiry Session expiry time in seconds from now
     * @param _limit Maximum spending limit in wei
     */
    function createSession(uint256 _expiry, uint256 _limit) external {
        require(_expiry > 0, "Expiry must be greater than 0");
        require(_limit > 0, "Spend limit must be greater than 0");
        require(!sessions[msg.sender].isActive, "Session already exists");
        
        sessions[msg.sender] = Session({
            user: msg.sender,
            expiry: block.timestamp + _expiry,
            spendLimit: _limit,
            spent: 0,
            isActive: true
        });
        
        emit SessionCreated(msg.sender, block.timestamp + _expiry, _limit);
    }
    
    /**
     * @dev Execute a trade within session limits
     * @param _user User address
     * @param _amount Trade amount in wei
     */
    function executeTrade(address _user, uint256 _amount) external onlyAuthorized sessionExists(_user) sessionNotExpired(_user) {
        Session storage session = sessions[_user];
        require(session.spent + _amount <= session.spendLimit, "Trade would exceed spending limit");
        
        session.spent += _amount;
        
        emit TradeExecuted(_user, _amount, session.spendLimit - session.spent);
    }
    
    /**
     * @dev Get session information
     * @param _user User address
     * @return Session information
     */
    function getSession(address _user) external view returns (Session memory) {
        return sessions[_user];
    }
    
    /**
     * @dev Check if session is active and not expired
     * @param _user User address
     * @return True if session is valid
     */
    function isSessionValid(address _user) external view returns (bool) {
        Session storage session = sessions[_user];
        return session.isActive && block.timestamp < session.expiry;
    }
    
    /**
     * @dev Get remaining spending limit
     * @param _user User address
     * @return Remaining amount in wei
     */
    function getRemainingLimit(address _user) external view returns (uint256) {
        Session storage session = sessions[_user];
        if (!session.isActive || block.timestamp >= session.expiry) {
            return 0;
        }
        return session.spendLimit - session.spent;
    }
    
    /**
     * @dev Authorize a trader to execute trades
     * @param _trader Trader address to authorize
     */
    function authorizeTrader(address _trader) external {
        // In production, this should be restricted to contract owner
        authorizedTraders[_trader] = true;
        emit TraderAuthorized(_trader);
    }
    
    /**
     * @dev Revoke trader authorization
     * @param _trader Trader address to revoke
     */
    function revokeTrader(address _trader) external {
        // In production, this should be restricted to contract owner
        authorizedTraders[_trader] = false;
        emit TraderRevoked(_trader);
    }
    
    /**
     * @dev Emergency function to expire a session
     * @param _user User address
     */
    function emergencyExpireSession(address _user) external {
        // In production, this should be restricted to contract owner
        require(sessions[_user].isActive, "Session does not exist");
        sessions[_user].isActive = false;
        emit SessionExpired(_user);
    }
} 