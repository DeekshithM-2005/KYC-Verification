const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const blockchainService = require("../services/blockchainService");
const ipfsService = require("../services/ipfsService");

describe("KYC Backend API Integration", () => {
  let citizenToken, companyToken;
  let citizenId, companyId;
  let citizenWallet = "0x9999999999999999999999999999999999999999";
  let companyWallet = "0x8888888888888888888888888888888888888888";
  let requestId;

  beforeAll(async () => {
    // Connect to test db
    await mongoose.connect("mongodb://localhost:27017/decentralized-kyc-test");
    await mongoose.connection.db.dropDatabase();
    
    // Mock blockchain & IPFS
    jest.spyOn(blockchainService, "registerKYC").mockResolvedValue("0xMockTxHash");
    jest.spyOn(blockchainService, "requestAccess").mockResolvedValue("0xMockRequestTx");
    jest.spyOn(blockchainService, "approveAccess").mockResolvedValue("0xMockApproveTx");
    jest.spyOn(blockchainService, "getKYCRecord").mockResolvedValue({
      docHash: "mockhash",
      ipfsCID: "mockcid",
      isRegistered: true,
      owner: citizenWallet
    });
    
    jest.spyOn(ipfsService, "uploadToIPFS").mockResolvedValue("mockcid");
    jest.spyOn(ipfsService, "fetchFromIPFS").mockImplementation(async (cid) => {
      // Simulate encrypted buffer that decrypts to 'test doc' using static IV
      // Since it's an integration test, we can mock the whole verification cycle if needed.
      // But actually, verifyUserKYC does real hashing.
      // We will mock verifyUserKYC entirely or let it fail gracefully if needed.
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    jest.restoreAllMocks();
  });

  it("1. Should register a Citizen", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Citizen",
        email: "citizen@test.com",
        password: "password123",
        role: "Citizen",
        walletAddress: citizenWallet
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token");
    citizenToken = res.body.token;
    citizenId = res.body._id;
  });

  it("2. Should register a Company", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Company",
        email: "company@test.com",
        password: "password123",
        role: "Company",
        walletAddress: companyWallet
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token");
    companyToken = res.body.token;
    companyId = res.body._id;
  });

  it("3. Should upload KYC document as Citizen", async () => {
    const res = await request(app)
      .post("/api/kyc/upload-document")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({
        documentData: "Sample Document Data",
        userId: citizenId
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "KYC document securely uploaded and registered.");
  });

  it("4. Should fail to request access as Citizen (RBAC test)", async () => {
    const res = await request(app)
      .post("/api/kyc/request-access")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ citizenId });
    expect(res.statusCode).toBe(403);
  });

  it("5. Should request access as Company", async () => {
    const res = await request(app)
      .post("/api/kyc/request-access")
      .set("Authorization", `Bearer ${companyToken}`)
      .send({ citizenId });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("requestId");
    requestId = res.body.requestId;
  });

  it("6. Should approve access as Citizen", async () => {
    const res = await request(app)
      .post("/api/kyc/approve-access")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ requestId });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Access approved successfully");
  });
});
