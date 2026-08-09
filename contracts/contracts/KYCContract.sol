// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KYCContract
 * @notice Decentralized KYC verification contract.
 *         Stores document hashes and IPFS CIDs on-chain, manages KYC verification
 *         status, and handles consent-based access control between citizens and companies.
 * @dev No raw documents are ever stored on-chain — only SHA-256 hashes and IPFS content
 *      identifiers. Actual encrypted documents reside on IPFS via Pinata.
 */
contract KYCContract {
    // ──────────────────────────────────────────────
    //  State Variables
    // ──────────────────────────────────────────────

    address public owner;

    struct Document {
        bytes32 docHash;       // SHA-256 hash of the original (unencrypted) document
        string  ipfsCID;       // IPFS content identifier for the encrypted document
        bool    isVerified;    // Whether a verifier has approved this KYC
        bool    isRejected;    // Whether a verifier has rejected this KYC
        bool    exists;        // Whether a document has been registered
        string  kycId;         // Unique KYC identifier assigned upon verification
    }

    /// @notice Citizen address → their submitted document record
    mapping(address => Document) public documents;

    /// @notice KYC ID string → citizen address (reverse lookup)
    mapping(string => address) public kycIdToCitizen;

    /// @notice KYC ID → (company address → access granted)
    mapping(string => mapping(address => bool)) public accessPermissions;

    /// @notice Authorized verifier addresses
    mapping(address => bool) public verifiers;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event DocumentRegistered(
        address indexed citizen,
        bytes32 docHash,
        string  ipfsCID
    );

    event KYCVerified(
        address indexed citizen,
        string  kycId,
        address indexed verifier
    );

    event KYCRejected(
        address indexed citizen,
        address indexed verifier
    );

    event AccessRequested(
        string  indexed kycId,
        address indexed company
    );

    event AccessApproved(
        string  indexed kycId,
        address indexed citizen,
        address indexed company
    );

    event AccessRevoked(
        string  indexed kycId,
        address indexed citizen,
        address indexed company
    );

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "KYC: caller is not the owner");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "KYC: caller is not an authorized verifier");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ──────────────────────────────────────────────
    //  Admin Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Add an address as an authorized verifier.
     * @param _verifier The address to authorize.
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "KYC: zero address");
        require(!verifiers[_verifier], "KYC: already a verifier");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    /**
     * @notice Remove an address from authorized verifiers.
     * @param _verifier The address to de-authorize.
     */
    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier], "KYC: not a verifier");
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    // ──────────────────────────────────────────────
    //  Citizen Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Register a document on-chain by storing its hash and IPFS CID.
     * @param _docHash  SHA-256 hash of the original document (pre-encryption).
     * @param _ipfsCID  IPFS content identifier of the encrypted document.
     */
    function registerDocument(bytes32 _docHash, string calldata _ipfsCID) external {
        require(!documents[msg.sender].exists, "KYC: document already registered");
        require(_docHash != bytes32(0), "KYC: invalid document hash");
        require(bytes(_ipfsCID).length > 0, "KYC: empty IPFS CID");

        documents[msg.sender] = Document({
            docHash:    _docHash,
            ipfsCID:    _ipfsCID,
            isVerified: false,
            isRejected: false,
            exists:     true,
            kycId:      ""
        });

        emit DocumentRegistered(msg.sender, _docHash, _ipfsCID);
    }

    /**
     * @notice Citizen approves a company's access request for their KYC.
     * @param _kycId      The citizen's KYC identifier.
     * @param _company    The company address being granted access.
     */
    function approveAccess(string calldata _kycId, address _company) external {
        require(kycIdToCitizen[_kycId] == msg.sender, "KYC: not the owner of this KYC ID");
        require(_company != address(0), "KYC: zero address");
        require(!accessPermissions[_kycId][_company], "KYC: access already granted");

        accessPermissions[_kycId][_company] = true;

        emit AccessApproved(_kycId, msg.sender, _company);
    }

    /**
     * @notice Citizen revokes a company's previously granted access.
     * @param _kycId      The citizen's KYC identifier.
     * @param _company    The company address whose access is being revoked.
     */
    function revokeAccess(string calldata _kycId, address _company) external {
        require(kycIdToCitizen[_kycId] == msg.sender, "KYC: not the owner of this KYC ID");
        require(accessPermissions[_kycId][_company], "KYC: access not granted");

        accessPermissions[_kycId][_company] = false;

        emit AccessRevoked(_kycId, msg.sender, _company);
    }

    // ──────────────────────────────────────────────
    //  Verifier Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Verifier approves a citizen's KYC and assigns a unique KYC ID.
     * @param _citizen  The citizen's address.
     * @param _kycId    The unique KYC identifier to assign.
     */
    function verifyKYC(address _citizen, string calldata _kycId) external onlyVerifier {
        require(documents[_citizen].exists, "KYC: no document registered");
        require(!documents[_citizen].isVerified, "KYC: already verified");
        require(!documents[_citizen].isRejected, "KYC: already rejected");
        require(bytes(_kycId).length > 0, "KYC: empty KYC ID");
        require(kycIdToCitizen[_kycId] == address(0), "KYC: KYC ID already in use");

        documents[_citizen].isVerified = true;
        documents[_citizen].kycId = _kycId;
        kycIdToCitizen[_kycId] = _citizen;

        emit KYCVerified(_citizen, _kycId, msg.sender);
    }

    /**
     * @notice Verifier rejects a citizen's KYC submission.
     * @param _citizen  The citizen's address.
     */
    function rejectKYC(address _citizen) external onlyVerifier {
        require(documents[_citizen].exists, "KYC: no document registered");
        require(!documents[_citizen].isVerified, "KYC: already verified");
        require(!documents[_citizen].isRejected, "KYC: already rejected");

        documents[_citizen].isRejected = true;

        emit KYCRejected(_citizen, msg.sender);
    }

    // ──────────────────────────────────────────────
    //  Company Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Company requests access to a citizen's verified KYC.
     *         This emits an event that the backend listens for to create a notification.
     * @param _kycId  The KYC identifier to request access for.
     */
    function requestAccess(string calldata _kycId) external {
        require(kycIdToCitizen[_kycId] != address(0), "KYC: invalid KYC ID");
        require(kycIdToCitizen[_kycId] != msg.sender, "KYC: cannot request own KYC");

        emit AccessRequested(_kycId, msg.sender);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Check whether a company has access to a citizen's KYC.
     * @param _kycId    The KYC identifier.
     * @param _company  The company address to check.
     * @return True if access is currently granted.
     */
    function checkAccess(string calldata _kycId, address _company) external view returns (bool) {
        return accessPermissions[_kycId][_company];
    }

    /**
     * @notice Retrieve the document hash and IPFS CID for a citizen.
     * @param _citizen  The citizen's address.
     * @return docHash  The SHA-256 hash of the original document.
     * @return ipfsCID  The IPFS content identifier of the encrypted document.
     * @return isVerified  Whether the KYC is verified.
     * @return kycId    The assigned KYC identifier (empty if not yet verified).
     */
    function getDocument(address _citizen)
        external
        view
        returns (
            bytes32 docHash,
            string memory ipfsCID,
            bool isVerified,
            string memory kycId
        )
    {
        require(documents[_citizen].exists, "KYC: no document registered");
        Document storage doc = documents[_citizen];
        return (doc.docHash, doc.ipfsCID, doc.isVerified, doc.kycId);
    }
}
