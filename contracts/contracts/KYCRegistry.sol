// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KYCRegistry
 * @notice Core KYC smart contract matching the requested interface.
 */
contract KYCRegistry {
    struct KYCRecord {
        string docHash;
        string ipfsCID;
        bool isRegistered;
        address owner;
    }

    // Mapping from userId to KYCRecord
    mapping(string => KYCRecord) public kycRecords;
    
    // Mapping from userId to company address to access status
    mapping(string => mapping(address => bool)) public accessPermissions;
    

    // Events
    event KYCRegistered(string userId, string docHash, string ipfsCID, address indexed owner);
    event AccessRequested(string userId, address indexed companyAddress);
    event AccessApproved(string userId, address indexed companyAddress);

    /**
     * @notice Register a new KYC document hash and IPFS CID for a user.
     * @param _hash The hash of the KYC document.
     * @param _ipfsCID The IPFS content identifier.
     * @param _userId The unique identifier for the user.
     */
    function registerKYC(string memory _hash, string memory _ipfsCID, string memory _userId) external {
        require(!kycRecords[_userId].isRegistered, "KYC already registered for this user ID");
        require(bytes(_userId).length > 0, "User ID cannot be empty");
        require(bytes(_hash).length > 0, "Hash cannot be empty");
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");

        kycRecords[_userId] = KYCRecord({
            docHash: _hash,
            ipfsCID: _ipfsCID,
            isRegistered: true,
            owner: msg.sender
        });

        emit KYCRegistered(_userId, _hash, _ipfsCID, msg.sender);
    }

    /**
     * @notice A company requests access to a user's KYC data.
     * @param _companyAddress The address of the company requesting access.
     * @param _userId The unique identifier for the user.
     */
    function requestAccess(address _companyAddress, string memory _userId) external {
        require(kycRecords[_userId].isRegistered, "KYC not registered for this user ID");
        
        emit AccessRequested(_userId, _companyAddress);
    }

    /**
     * @notice Approve a company to access the user's KYC.
     * @param _userId The unique identifier of the user (Citizen).
     * @param _companyAddress The address of the company.
     */
    function approveAccess(string memory _userId, address _companyAddress) external {
        require(kycRecords[_userId].isRegistered, "KYC not registered for this user ID");
        require(kycRecords[_userId].owner == msg.sender, "Only owner can approve access");
        // For MVP backend relayer, the backend is approving.
        accessPermissions[_userId][_companyAddress] = true;
        emit AccessApproved(_userId, _companyAddress);
    }

    /**
     * @notice Check the KYC registration status for a user.
     * @param _userId The unique identifier for the user.
     * @return bool True if registered, false otherwise.
     */
    function checkKYCStatus(string memory _userId) external view returns (bool) {
        return kycRecords[_userId].isRegistered;
    }

    /**
     * @notice Check if a company has access to a user's KYC.
     * @param _userId The unique identifier for the user.
     * @param _companyAddress The address of the company.
     * @return bool True if access is granted, false otherwise.
     */
    function hasAccess(string memory _userId, address _companyAddress) external view returns (bool) {
        return accessPermissions[_userId][_companyAddress];
    }
}
