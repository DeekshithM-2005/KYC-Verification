const axios = require('axios');
const ethers = require('ethers');
const crypto = require('crypto');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log("🚀 Starting E2E Integration Tests...");
  const results = [];

  // Generate unique emails to avoid conflicts
  const suffix = Date.now();
  const citizenEmail = `citizen_${suffix}@test.com`;
  const companyEmail = `company_${suffix}@test.com`;
  const verifierEmail = `verifier_${suffix}@test.com`;

  let citizenToken, companyToken, verifierToken;
  let citizenId, companyId, verifierId;

  // 1. Register & Login
  try {
    console.log("--- Test: Authentication ---");
    // Citizen
    let res = await axios.post(`${API_URL}/auth/register`, {
      name: "Alice Citizen",
      email: citizenEmail,
      password: "Password123!",
      role: "Citizen",
      walletAddress: ethers.Wallet.createRandom().address
    });
    citizenToken = res.headers['set-cookie'][0].split(';')[0];
    citizenId = res.data._id;

    // Company
    res = await axios.post(`${API_URL}/auth/register`, {
      name: "Acme Bank",
      email: companyEmail,
      password: "Password123!",
      role: "Company",
      walletAddress: ethers.Wallet.createRandom().address
    });
    companyToken = res.headers['set-cookie'][0].split(';')[0];
    companyId = res.data._id;

    // Verifier
    res = await axios.post(`${API_URL}/auth/register`, {
      name: "Bob Verifier",
      email: verifierEmail,
      password: "Password123!",
      role: "Verifier",
      walletAddress: ethers.Wallet.createRandom().address
    });
    verifierToken = res.headers['set-cookie'][0].split(';')[0];
    verifierId = res.data._id;

    results.push({ case: "Register and Login Users", status: "PASS", detail: "Tokens received" });
  } catch (err) {
    console.error(err.response?.data || err.message);
    results.push({ case: "Register and Login Users", status: "FAIL", detail: err.message });
  }

  // 2. Upload KYC Document
  let documentHash = "";
  try {
    console.log("--- Test: Citizen Uploads Document ---");
    const res = await axios.post(`${API_URL}/kyc/upload-document`, {
      documentData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      userId: citizenId
    }, { headers: { Cookie: citizenToken } });

    documentHash = res.data.docHash;
    results.push({ case: "Citizen Upload Document", status: "PASS", detail: "Tx Hash: " + res.data.transactionHash });
  } catch (err) {
    console.error(err.response?.data || err.message);
    results.push({ case: "Citizen Upload Document", status: "FAIL", detail: err.message });
  }

  // 3. Duplicate KYC Upload (Edge Case)
  try {
    console.log("--- Test: Duplicate KYC Upload ---");
    await axios.post(`${API_URL}/kyc/upload-document`, {
      documentData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      userId: citizenId
    }, { headers: { Cookie: citizenToken } });
    results.push({ case: "Duplicate KYC Upload Prevention", status: "FAIL", detail: "Allowed duplicate" });
  } catch (err) {
    if (err.response && err.response.data.error.includes("already registered")) {
      results.push({ case: "Duplicate KYC Upload Prevention", status: "PASS", detail: "Correctly rejected duplicate" });
    } else {
      results.push({ case: "Duplicate KYC Upload Prevention", status: "FAIL", detail: err.response?.data?.error || err.message });
    }
  }

  // 4. Company Requests Access
  let requestId;
  try {
    console.log("--- Test: Company Requests Access ---");
    // Wait a moment to avoid nonce conflicts
    await new Promise(r => setTimeout(r, 1500));
    const res = await axios.post(`${API_URL}/kyc/request-access`, {
      citizenId: citizenId
    }, { headers: { Cookie: companyToken } });
    
    requestId = res.data.requestId;
    results.push({ case: "Company Request Access", status: "PASS", detail: "Request created: " + requestId });
  } catch (err) {
    console.error(err.response?.data || err.message);
    results.push({ case: "Company Request Access", status: "FAIL", detail: err.message });
  }

  // 5. Citizen Approves Access
  try {
    console.log("--- Test: Citizen Approves Access ---");
    // Wait a moment to avoid nonce conflicts in Hardhat
    await new Promise(r => setTimeout(r, 1500));
    const res = await axios.post(`${API_URL}/kyc/approve-access`, {
      requestId: requestId
    }, { headers: { Cookie: citizenToken } });
    
    results.push({ case: "Citizen Approve Access", status: "PASS", detail: "Approved" });
  } catch (err) {
    console.error(err.response?.data || err.message);
    results.push({ case: "Citizen Approve Access", status: "FAIL", detail: err.message });
  }

  // 6. Verifier Checks Integrity (Match)
  try {
    console.log("--- Test: Verifier Checks Integrity ---");
    const res = await axios.get(`${API_URL}/kyc/verify/${citizenId}`, {
       headers: { Cookie: verifierToken } 
    });
    
    if (res.data.isIntact) {
      results.push({ case: "Verify Document Integrity (Match)", status: "PASS", detail: "Match successful" });
    } else {
      results.push({ case: "Verify Document Integrity (Match)", status: "FAIL", detail: "False mismatch" });
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
    results.push({ case: "Verify Document Integrity (Match)", status: "FAIL", detail: err.message });
  }

  // 7. Tampered Document (Edge Case)
  try {
    console.log("--- Test: Tamper Detection ---");
    // Run the tamper script manually using child_process
    const { execSync } = require('child_process');
    execSync(`node simulate-tamper.js ${citizenId}`);

    const res = await axios.get(`${API_URL}/kyc/verify/${citizenId}`, {
       headers: { Cookie: verifierToken } 
    });
    
    if (!res.data.isIntact) {
      results.push({ case: "Tamper Detection (Mismatch)", status: "PASS", detail: "Successfully detected tamper" });
    } else {
      results.push({ case: "Tamper Detection (Mismatch)", status: "FAIL", detail: "Failed to detect tamper" });
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
    results.push({ case: "Tamper Detection (Mismatch)", status: "FAIL", detail: err.message });
  }

  // 8. Expired JWT
  try {
    console.log("--- Test: Expired JWT ---");
    const expiredToken = citizenToken + "BAD";
    await axios.get(`${API_URL}/kyc/status/${citizenId}`, {
       headers: { Cookie: expiredToken } 
    });
    results.push({ case: "Expired/Invalid JWT", status: "FAIL", detail: "Allowed invalid token" });
  } catch (err) {
    results.push({ case: "Expired/Invalid JWT", status: "PASS", detail: "Rejected correctly" });
  }

  // Print results
  console.log("\n--- TEST REPORT ---");
  console.table(results);
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
}

runTests();
