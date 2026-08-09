const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KYCContract", function () {
  let kycContract;
  let owner, verifier, citizen, company, other;

  // Sample document data
  const sampleDocHash = ethers.keccak256(ethers.toUtf8Bytes("sample-document-content"));
  const sampleIPFSCID = "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX";
  const sampleKYCId = "KYC-2026-000001";

  beforeEach(async function () {
    [owner, verifier, citizen, company, other] = await ethers.getSigners();

    const KYCContract = await ethers.getContractFactory("KYCContract");
    kycContract = await KYCContract.deploy();
    await kycContract.waitForDeployment();

    // Add verifier
    await kycContract.addVerifier(verifier.address);
  });

  // ──────────────────────────────────────────────
  //  Deployment
  // ──────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      expect(await kycContract.owner()).to.equal(owner.address);
    });

    it("should have the verifier registered", async function () {
      expect(await kycContract.verifiers(verifier.address)).to.be.true;
    });
  });

  // ──────────────────────────────────────────────
  //  Verifier Management
  // ──────────────────────────────────────────────

  describe("Verifier Management", function () {
    it("should allow owner to add a verifier", async function () {
      await expect(kycContract.addVerifier(other.address))
        .to.emit(kycContract, "VerifierAdded")
        .withArgs(other.address);
      expect(await kycContract.verifiers(other.address)).to.be.true;
    });

    it("should allow owner to remove a verifier", async function () {
      await expect(kycContract.removeVerifier(verifier.address))
        .to.emit(kycContract, "VerifierRemoved")
        .withArgs(verifier.address);
      expect(await kycContract.verifiers(verifier.address)).to.be.false;
    });

    it("should reject non-owner adding a verifier", async function () {
      await expect(
        kycContract.connect(other).addVerifier(other.address)
      ).to.be.revertedWith("KYC: caller is not the owner");
    });

    it("should reject adding zero address as verifier", async function () {
      await expect(
        kycContract.addVerifier(ethers.ZeroAddress)
      ).to.be.revertedWith("KYC: zero address");
    });

    it("should reject adding an existing verifier", async function () {
      await expect(
        kycContract.addVerifier(verifier.address)
      ).to.be.revertedWith("KYC: already a verifier");
    });
  });

  // ──────────────────────────────────────────────
  //  Document Registration
  // ──────────────────────────────────────────────

  describe("Document Registration", function () {
    it("should register a document and emit DocumentRegistered", async function () {
      await expect(
        kycContract.connect(citizen).registerDocument(sampleDocHash, sampleIPFSCID)
      )
        .to.emit(kycContract, "DocumentRegistered")
        .withArgs(citizen.address, sampleDocHash, sampleIPFSCID);
    });

    it("should store document details correctly", async function () {
      await kycContract.connect(citizen).registerDocument(sampleDocHash, sampleIPFSCID);

      const [docHash, ipfsCID, isVerified, kycId] = await kycContract.getDocument(citizen.address);
      expect(docHash).to.equal(sampleDocHash);
      expect(ipfsCID).to.equal(sampleIPFSCID);
      expect(isVerified).to.be.false;
      expect(kycId).to.equal("");
    });

    it("should reject duplicate registration", async function () {
      await kycContract.connect(citizen).registerDocument(sampleDocHash, sampleIPFSCID);
      await expect(
        kycContract.connect(citizen).registerDocument(sampleDocHash, sampleIPFSCID)
      ).to.be.revertedWith("KYC: document already registered");
    });

    it("should reject registration with zero hash", async function () {
      await expect(
        kycContract.connect(citizen).registerDocument(ethers.ZeroHash, sampleIPFSCID)
      ).to.be.revertedWith("KYC: invalid document hash");
    });

    it("should reject registration with empty IPFS CID", async function () {
      await expect(
        kycContract.connect(citizen).registerDocument(sampleDocHash, "")
      ).to.be.revertedWith("KYC: empty IPFS CID");
    });
  });

  // ──────────────────────────────────────────────
  //  KYC Verification
  // ──────────────────────────────────────────────

  describe("KYC Verification", function () {
    beforeEach(async function () {
      await kycContract.connect(citizen).registerDocument(sampleDocHash, sampleIPFSCID);
    });

    it("should allow verifier to approve KYC and assign KYC ID", async function () {
      await expect(
        kycContract.connect(verifier).verifyKYC(citizen.address, sampleKYCId)
      )
        .to.emit(kycContract, "KYCVerified")
        .withArgs(citizen.address, sampleKYCId, verifier.address);

      const [, , isVerified, kycId] = await kycContract.getDocument(citizen.address);
      expect(isVerified).to.be.true;
      expect(kycId).to.equal(sampleKYCId);
    });

    it("should map KYC ID to citizen address", async function () {
      await kycContract.connect(verifier).verifyKYC(citizen.address, sampleKYCId);
      expect(await kycContract.kycIdToCitizen(sampleKYCId)).to.equal(citizen.address);
    });

    it("should reject non-verifier approving KYC", async function () {
      await expect(
        kycContract.connect(other).verifyKYC(citizen.address, sampleKYCId)
      ).to.be.revertedWith("KYC: caller is not an authorized verifier");
    });

    it("should reject verifying a non-existent document", async function () {
      await expect(
        kycContract.connect(verifier).verifyKYC(other.address, sampleKYCId)
      ).to.be.revertedWith("KYC: no document registered");
    });

    it("should reject duplicate KYC IDs", async function () {
      await kycContract.connect(verifier).verifyKYC(citizen.address, sampleKYCId);

      // Register another citizen
      await kycContract.connect(other).registerDocument(
        ethers.keccak256(ethers.toUtf8Bytes("other-doc")),
        "QmOtherCID"
      );

      await expect(
        kycContract.connect(verifier).verifyKYC(other.address, sampleKYCId)
      ).to.be.revertedWith("KYC: KYC ID already in use");
    });

    it("should allow verifier to reject KYC", async function () {
      await expect(
        kycContract.connect(verifier).rejectKYC(citizen.address)
      )
        .to.emit(kycContract, "KYCRejected")
        .withArgs(citizen.address, verifier.address);
    });

    it("should reject re-verification of already verified KYC", async function () {
      await kycContract.connect(verifier).verifyKYC(citizen.address, sampleKYCId);
      await expect(
        kycContract.connect(verifier).verifyKYC(citizen.address, "KYC-ANOTHER")
      ).to.be.revertedWith("KYC: already verified");
    });

    it("should reject verifying already rejected KYC", async function () {
      await kycContract.connect(verifier).rejectKYC(citizen.address);
      await expect(
        kycContract.connect(verifier).verifyKYC(citizen.address, sampleKYCId)
      ).to.be.revertedWith("KYC: already rejected");
    });
  });

  // ──────────────────────────────────────────────
  //  Access Request & Consent
  // ──────────────────────────────────────────────

  describe("Access Request & Consent", function () {
    beforeEach(async function () {
      // Citizen registers and gets verified
      await kycContract.connect(citizen).registerDocument(sampleDocHash, sampleIPFSCID);
      await kycContract.connect(verifier).verifyKYC(citizen.address, sampleKYCId);
    });

    it("should allow a company to request access", async function () {
      await expect(
        kycContract.connect(company).requestAccess(sampleKYCId)
      )
        .to.emit(kycContract, "AccessRequested")
        .withArgs(sampleKYCId, company.address);
    });

    it("should reject access request for invalid KYC ID", async function () {
      await expect(
        kycContract.connect(company).requestAccess("INVALID-ID")
      ).to.be.revertedWith("KYC: invalid KYC ID");
    });

    it("should reject citizen requesting own KYC", async function () {
      await expect(
        kycContract.connect(citizen).requestAccess(sampleKYCId)
      ).to.be.revertedWith("KYC: cannot request own KYC");
    });

    it("should allow citizen to approve access", async function () {
      await expect(
        kycContract.connect(citizen).approveAccess(sampleKYCId, company.address)
      )
        .to.emit(kycContract, "AccessApproved")
        .withArgs(sampleKYCId, citizen.address, company.address);

      expect(await kycContract.checkAccess(sampleKYCId, company.address)).to.be.true;
    });

    it("should reject non-owner approving access", async function () {
      await expect(
        kycContract.connect(other).approveAccess(sampleKYCId, company.address)
      ).to.be.revertedWith("KYC: not the owner of this KYC ID");
    });

    it("should reject granting access to zero address", async function () {
      await expect(
        kycContract.connect(citizen).approveAccess(sampleKYCId, ethers.ZeroAddress)
      ).to.be.revertedWith("KYC: zero address");
    });

    it("should reject duplicate access grants", async function () {
      await kycContract.connect(citizen).approveAccess(sampleKYCId, company.address);
      await expect(
        kycContract.connect(citizen).approveAccess(sampleKYCId, company.address)
      ).to.be.revertedWith("KYC: access already granted");
    });

    it("should allow citizen to revoke access", async function () {
      await kycContract.connect(citizen).approveAccess(sampleKYCId, company.address);

      await expect(
        kycContract.connect(citizen).revokeAccess(sampleKYCId, company.address)
      )
        .to.emit(kycContract, "AccessRevoked")
        .withArgs(sampleKYCId, citizen.address, company.address);

      expect(await kycContract.checkAccess(sampleKYCId, company.address)).to.be.false;
    });

    it("should reject revoking non-existent access", async function () {
      await expect(
        kycContract.connect(citizen).revokeAccess(sampleKYCId, company.address)
      ).to.be.revertedWith("KYC: access not granted");
    });
  });

  // ──────────────────────────────────────────────
  //  View Functions
  // ──────────────────────────────────────────────

  describe("View Functions", function () {
    it("should return false for checkAccess when not granted", async function () {
      await kycContract.connect(citizen).registerDocument(sampleDocHash, sampleIPFSCID);
      await kycContract.connect(verifier).verifyKYC(citizen.address, sampleKYCId);

      expect(await kycContract.checkAccess(sampleKYCId, company.address)).to.be.false;
    });

    it("should revert getDocument for unregistered citizen", async function () {
      await expect(
        kycContract.getDocument(other.address)
      ).to.be.revertedWith("KYC: no document registered");
    });
  });
});
