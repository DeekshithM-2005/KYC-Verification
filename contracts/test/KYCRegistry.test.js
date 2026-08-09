const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KYCRegistry", function () {
  let kycRegistry;
  let owner, citizen, company;

  const sampleDocHash = "0xSampleHash1234567890abcdef";
  const sampleIPFSCID = "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX";
  const sampleUserId = "USR-999-888";

  beforeEach(async function () {
    [owner, citizen, company] = await ethers.getSigners();

    const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
    kycRegistry = await KYCRegistry.deploy();
    await kycRegistry.waitForDeployment();
  });

  describe("KYC Registration", function () {
    it("should allow a user to register KYC and emit KYCRegistered", async function () {
      await expect(
        kycRegistry.connect(citizen).registerKYC(sampleDocHash, sampleIPFSCID, sampleUserId)
      )
        .to.emit(kycRegistry, "KYCRegistered")
        .withArgs(sampleUserId, sampleDocHash, sampleIPFSCID, citizen.address);
    });

    it("should return true for checkKYCStatus after registration", async function () {
      await kycRegistry.connect(citizen).registerKYC(sampleDocHash, sampleIPFSCID, sampleUserId);
      expect(await kycRegistry.checkKYCStatus(sampleUserId)).to.be.true;
    });

    it("should reject duplicate registration for the same user ID", async function () {
      await kycRegistry.connect(citizen).registerKYC(sampleDocHash, sampleIPFSCID, sampleUserId);
      await expect(
        kycRegistry.connect(citizen).registerKYC("newHash", "newCID", sampleUserId)
      ).to.be.revertedWith("KYC already registered for this user ID");
    });
  });

  describe("Access Request and Approval", function () {
    beforeEach(async function () {
      await kycRegistry.connect(citizen).registerKYC(sampleDocHash, sampleIPFSCID, sampleUserId);
    });

    it("should allow a company to request access and emit AccessRequested", async function () {
      await expect(
        kycRegistry.connect(company).requestAccess(company.address, sampleUserId)
      )
        .to.emit(kycRegistry, "AccessRequested")
        .withArgs(sampleUserId, company.address);
    });

    it("should revert access request if KYC not registered", async function () {
      await expect(
        kycRegistry.connect(company).requestAccess(company.address, "NON_EXISTENT")
      ).to.be.revertedWith("KYC not registered for this user ID");
    });

    it("should allow the citizen to approve access and emit AccessApproved", async function () {
      await expect(
        kycRegistry.connect(citizen).approveAccess(sampleUserId, company.address)
      )
        .to.emit(kycRegistry, "AccessApproved")
        .withArgs(sampleUserId, company.address);
    });

    it("should revert if a non-owner tries to approve access", async function () {
      await expect(
        kycRegistry.connect(company).approveAccess(sampleUserId, company.address)
      ).to.be.revertedWith("Only owner can approve access");
    });

    it("should correctly update hasAccess after approval", async function () {
      expect(await kycRegistry.hasAccess(sampleUserId, company.address)).to.be.false;
      await kycRegistry.connect(citizen).approveAccess(sampleUserId, company.address);
      expect(await kycRegistry.hasAccess(sampleUserId, company.address)).to.be.true;
    });
  });
});
