# Decentralized KYC Platform

A blockchain-anchored identity verification framework that lets citizens submit KYC documents once, verified immutably on-chain, and share them with any requesting company through explicit, revocable consent — without any central authority holding raw data.

## Architecture

- **Blockchain Layer** (Ethereum/Ganache + Solidity) — stores document hashes, KYC IDs, verification status, and consent events
- **IPFS Layer** (Pinata) — stores AES-256 encrypted documents, linked via content hash
- **Database Layer** (MongoDB) — stores app metadata: users, sessions, access logs, notifications (never raw KYC documents)

## User Roles

| Role | Capabilities |
|------|-------------|
| **Citizen** | Submit identity documents, approve/deny access requests, revoke access |
| **Verifier (Bank)** | Review and approve/reject KYC submissions, issue KYC IDs |
| **Company** | Request access to verified KYC using a KYC ID |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js 18 + Express 4 |
| Blockchain | Solidity ^0.8.x + Hardhat + Ethers.js 6 |
| Storage | IPFS via Pinata |
| Database | MongoDB 6 + Mongoose 7 |

## Prerequisites

- **Node.js** >= 18.x LTS
- **MongoDB** Community Edition running on `localhost:27017`
- **Ganache** CLI or GUI running on `localhost:7545`
- **Pinata** account with API key and secret ([sign up free](https://app.pinata.cloud))

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd "MAJOR PROJECT 3_8_26"

# Install dependencies for all sub-projects
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure Environment

Copy `.env.example` to `.env` in both `contracts/` and `backend/`:

```bash
cp contracts/.env.example contracts/.env
cp backend/.env.example backend/.env
```

Edit each `.env` with your actual values (Ganache keys, Pinata keys, JWT secret, etc.)

### 3. Deploy Smart Contract

```bash
# Start Ganache first (port 7545)
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address into `backend/.env` as `CONTRACT_ADDRESS`.

### 4. Start Backend

```bash
cd backend
node server.js
# Server starts on http://localhost:5000
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
# App available at http://localhost:5173
```

## Project Structure

```text
├── contracts/          # Hardhat project (Solidity smart contracts)
├── backend/            # Express API server
├── frontend/           # React + Vite SPA
├── .gitignore
└── README.md
```

## Testing

The backend includes a comprehensive integration test suite using **Jest** and **Supertest** covering the full KYC lifecycle (Register, Upload, Request Access, Approve Access).

```bash
cd backend
npm run test:ci # or npx jest tests/integration.test.js
```

### Postman Collection
A full Postman collection is available for API testing:
- Import `backend/postman_collection.json` into Postman.
- Ensure the `baseUrl` variable is set to `http://localhost:5000`.

## Deployment (Azure App Service)

A GitHub Actions workflow is provided at `.github/workflows/azure-deploy.yml` to automatically build, test, and deploy the backend to Azure Web Apps on push to `main`.

**To deploy:**
1. Create a Node.js Web App in Azure.
2. Download the Publish Profile from the Azure Portal.
3. Add the Publish Profile as a GitHub Secret named `AZUREAPPSERVICE_PUBLISHPROFILE` in your repository.
4. Push to the `main` branch.

## License

MIT
