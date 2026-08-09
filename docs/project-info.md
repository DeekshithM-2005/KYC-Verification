# Project Info — Decentralized KYC Platform

**A blockchain-anchored identity verification framework that lets citizens submit KYC documents once, verified immutably on-chain, and share them with any requesting company through explicit, revocable consent — without any central authority holding raw data.**

> All technical decisions in this document reference the [approved architecture](file:///C:/Users/deeks/.gemini/antigravity-ide/brain/1d10fbba-44a4-430c-87c3-3efa8b414b6d/architecture.md).

---

## 1. Objectives

| # | Objective | How the Architecture Achieves It |
|---|---|---|
| O1 | **Eliminate central KYC database** | Raw documents never enter MongoDB — they are AES-256 encrypted and stored on IPFS/Pinata. MongoDB holds only metadata (user accounts, statuses, logs). |
| O2 | **Enable one-time reusable verification** | A Verifier approves KYC once and assigns a unique KYC ID on-chain. Any Company can subsequently request access using that same KYC ID — the citizen never re-submits. |
| O3 | **Guarantee tamper-proof records** | SHA-256 hash of the original document is immutably recorded on the Ethereum blockchain. On retrieval, the hash is recomputed and compared — any mismatch proves tampering. |
| O4 | **Preserve user consent (self-sovereign identity)** | Access is gated by on-chain consent: the citizen must explicitly call `approveAccess()` on the smart contract. Consent can be revoked at any time via `revokeAccess()`. Every grant and revocation emits an immutable event. |
| O5 | **Privacy-by-design (no raw documents on-chain)** | The blockchain stores only hashes and CIDs — never actual documents. Encrypted blobs live on IPFS. Only the backend (holding the AES key) can decrypt. |
| O6 | **Reduce redundant KYC costs** | Citizens verify once; companies skip re-verification entirely. The access-request model replaces redundant document collection and manual checks across institutions. |

---

## 2. Scope Boundaries

### ✅ In Scope (MVP)

| Area | Detail |
|---|---|
| **3 User Roles** | Citizen, Verifier (Bank), Company — with distinct dashboards and permissions |
| **Document Submission** | Citizen uploads identity documents (Aadhaar, PAN, Passport) via the frontend |
| **Encryption & IPFS Upload** | Backend encrypts documents (AES-256-CBC), uploads to IPFS via Pinata, records CID |
| **On-Chain Hash Registration** | SHA-256 hash + IPFS CID stored immutably on Ethereum via Solidity smart contract |
| **KYC Verification Flow** | Verifier reviews pending submissions, approves/rejects, assigns KYC ID on-chain |
| **Access Request & Consent** | Company requests access by KYC ID → Citizen approves/denies → on-chain consent recorded |
| **Document Retrieval & Integrity Check** | Approved company retrieves document → backend decrypts → recomputes hash → compares with on-chain hash |
| **Access Revocation** | Citizen can revoke a previously granted access at any time |
| **Notifications** | In-app notifications for access requests, KYC approvals/rejections |
| **JWT Authentication + RBAC** | Stateless auth with role-based route guards on both backend and frontend |
| **Local Blockchain** | Ganache for development — no mainnet deployment required |

### ⛔ Out of Scope

| Area | Rationale |
|---|---|
| **Real bank/FI integration** | MVP is a proof-of-concept; no live banking APIs or partner onboarding |
| **Production KYC-AML/CFT compliance** | Regulatory compliance (PMLA, EU AMLD) requires legal review beyond an MVP |
| **Mainnet deployment** | Gas costs and key management for Ethereum mainnet are deferred |
| **Biometric verification** | No liveness checks, face matching, or fingerprint scanning |
| **Mobile app** | Web-only; responsive design covers mobile browsers |
| **Multi-chain support** | Single Ethereum/Ganache chain only |
| **Document OCR / auto-extraction** | Documents are stored and verified as files, not parsed |
| **Admin panel / super-admin role** | Contract owner functions suffice for MVP |
| **Automated testing CI/CD pipeline** | Manual testing; CI/CD is a post-MVP concern |

---

## 3. Tech Stack Summary

> All choices sourced from [architecture.md §5](file:///C:/Users/deeks/.gemini/antigravity-ide/brain/1d10fbba-44a4-430c-87c3-3efa8b414b6d/architecture.md).

| Layer | Technology | Role in System |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | Role-based SPA with dashboards for Citizen, Verifier, Company |
| **Frontend Routing** | React Router 6 | Protected routes with role-based guards |
| **Frontend HTTP** | Axios | JWT-attached API calls to backend |
| **Frontend Styling** | Vanilla CSS (dark theme) | Premium UI with glassmorphism, Inter font, micro-animations |
| **Backend Runtime** | Node.js 18 LTS + Express 4 | REST API gateway, business logic, orchestration |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs | Stateless auth with hashed passwords |
| **Blockchain** | Ethereum (Ganache 7.x) | Local chain for development — stores hashes, KYC IDs, consent |
| **Smart Contracts** | Solidity ^0.8.x + Hardhat 2.x | Contract compilation, testing, deployment |
| **Blockchain Client** | Ethers.js 6.x | Backend ↔ smart contract interaction |
| **Distributed Storage** | IPFS via Pinata API | Encrypted document storage with content-addressed retrieval |
| **Database** | MongoDB 6.x + Mongoose 7.x | App metadata: users, sessions, access logs, notifications |
| **Encryption** | Node.js `crypto` (AES-256-CBC) | Document encryption before IPFS upload |
| **Hashing** | Node.js `crypto` (SHA-256) | Document integrity fingerprinting for on-chain storage |
| **API Security** | Helmet, CORS, express-rate-limit, express-validator, Multer | Defense-in-depth HTTP hardening |

---

## 4. Seven-Day Roadmap

The backend and frontend tracks run **in parallel** after Day 1's shared setup. Milestones are marked with 🏁.

```
Day   Backend Track                         Frontend Track                    Shared
───── ─────────────────────────────────────  ────────────────────────────────  ──────────────
  1   Project scaffold + Hardhat +           Vite + React scaffold +          .gitignore
      Express shell + MongoDB connection     env config + proxy setup         README.md
      Smart contract (KYCContract.sol)                                        🏁 All npm
      Deploy script + contract tests                                            install OK

  2   MongoDB models (User, KYCDocument,     Auth pages (Login, Register)     
      AccessRequest, Notification)           AuthContext + useAuth hook       
      Auth middleware (JWT + RBAC)           ProtectedRoute component         
      Auth controller + routes              Axios instance with JWT           
      🏁 Register/Login API works            interceptor                      

  3   Crypto service (AES + SHA-256)         Shared components (Navbar,       
      IPFS service (Pinata upload/fetch)     Sidebar, Loader, StatusBadge,    
      Blockchain service (Ethers.js)         FileUpload, NotificationPanel)   
      🏁 Services unit-testable              🏁 Component library ready       

  4   KYC controller + routes               Citizen Dashboard page           
      (submit, status, pending,             (DocumentUploadForm,             
       verify, reject)                       KYCStatusCard,                   
      🏁 Full KYC flow via API               AccessRequestsList)              
                                            🏁 Citizen UI complete            

  5   Access controller + routes            Verifier Dashboard page          
      (request, approve, deny,              (PendingSubmissionsList,         
       revoke, document retrieval)           VerificationCard)               
      Notification controller + routes      Company Dashboard page           
      🏁 Full access flow via API            (AccessRequestForm,              
                                             RequestStatusList,               
                                             DocumentViewer)                  
                                            🏁 All dashboards complete        

  6   ABI wiring + end-to-end               Frontend ↔ Backend integration   🏁 Full E2E
      integration testing                   Connect all API calls            flow works
      Input validation (express-validator)  Loading states + error handling  through UI
      Error handling middleware             Toast notifications              

  7   Security hardening (rate-limit,       UI polish, responsive tweaks,    🏁 MVP DEMO
      file-size limits, Helmet)             final styling pass               READY
      Final README + setup guide            NotFound (404) page              
```

### Day-by-Day Detail

#### Day 1 — Foundation & Smart Contract

| Track | Deliverables | Architecture Reference |
|---|---|---|
| **Shared** | `.gitignore`, `README.md` | §6 Folder Structure |
| **Backend** | `contracts/hardhat.config.js`, `contracts/package.json`, `backend/package.json`, `backend/.env`, `backend/server.js`, `backend/config/db.js` | §6, §10 |
| **Backend** | `contracts/contracts/KYCContract.sol`, `contracts/scripts/deploy.js`, `contracts/test/KYCContract.test.js` | §8 Smart Contract Interface |
| **Frontend** | Vite scaffold, `frontend/.env`, `frontend/vite.config.js` | §6 |

> 🏁 **Milestone**: `npm install` passes everywhere. `npx hardhat test` passes. `node backend/server.js` connects to MongoDB. Vite dev server shows welcome page.

#### Day 2 — Auth System

| Track | Deliverables | Architecture Reference |
|---|---|---|
| **Backend** | `models/User.js`, `models/KYCDocument.js`, `models/AccessRequest.js`, `models/Notification.js` | §7 MongoDB Schemas |
| **Backend** | `middleware/authMiddleware.js`, `middleware/roleMiddleware.js` | §4.3 Auth & RBAC |
| **Backend** | `controllers/authController.js`, `routes/authRoutes.js` | §9 API Endpoints |
| **Frontend** | `pages/Login.jsx`, `pages/Register.jsx`, `context/AuthContext.jsx`, `hooks/useAuth.js`, `routes/ProtectedRoute.jsx`, `api/axios.js` | §6 |

> 🏁 **Milestone**: A user can register (citizen/verifier/company), login, receive JWT, and be redirected to their dashboard shell.

#### Day 3 — Core Services & Component Library

| Track | Deliverables | Architecture Reference |
|---|---|---|
| **Backend** | `services/cryptoService.js`, `services/ipfsService.js`, `services/blockchainService.js` | §3 Component Responsibilities |
| **Frontend** | `Navbar.jsx`, `Sidebar.jsx`, `Loader.jsx`, `StatusBadge.jsx`, `FileUpload.jsx`, `NotificationPanel.jsx` | §6 |

> 🏁 **Milestone**: Backend services can encrypt a file, upload to Pinata, hash it, and call the smart contract. Frontend component library is built and visually polished.

#### Day 4 — KYC Submission & Citizen Dashboard

| Track | Deliverables | Architecture Reference |
|---|---|---|
| **Backend** | `controllers/kycController.js`, `routes/kycRoutes.js` | §9 KYC Routes |
| **Frontend** | `CitizenDashboard.jsx`, `DocumentUploadForm.jsx`, `KYCStatusCard.jsx`, `AccessRequestsList.jsx` | §6 |

> 🏁 **Milestone**: Citizen submits a document → it's encrypted, uploaded to IPFS, hashed on-chain, and appears as "pending" in their dashboard.

#### Day 5 — Access Flow & Remaining Dashboards

| Track | Deliverables | Architecture Reference |
|---|---|---|
| **Backend** | `controllers/accessController.js`, `routes/accessRoutes.js`, `controllers/notificationController.js`, `routes/notificationRoutes.js` | §9 Access & Notification Routes |
| **Frontend** | `VerifierDashboard.jsx`, `PendingSubmissionsList.jsx`, `VerificationCard.jsx`, `CompanyDashboard.jsx`, `AccessRequestForm.jsx`, `RequestStatusList.jsx`, `DocumentViewer.jsx` | §6 |

> 🏁 **Milestone**: Complete backend API for all 3 roles. All 3 dashboard UIs built.

#### Day 6 — Integration & Error Handling

| Track | Deliverables | Architecture Reference |
|---|---|---|
| **Shared** | Copy contract ABI to backend, configure contract address | §5 Integration |
| **Backend** | Input validation on all routes, global error handler middleware | §4.4 API Security |
| **Frontend** | Wire all API calls, loading spinners, error toasts, 401 redirect | §3 Component Responsibilities |

> 🏁 **Milestone**: Full end-to-end flow works through the browser UI: citizen submits → verifier approves → company requests → citizen consents → company views → tamper check passes.

#### Day 7 — Security, Polish & Demo Prep

| Track | Deliverables | Architecture Reference |
|---|---|---|
| **Backend** | Rate limiting, Helmet headers, file upload limits, CORS lockdown | §4.4 API Security |
| **Frontend** | Responsive polish, final styling, 404 page, micro-animations | §6 |
| **Shared** | Updated `README.md` with full setup + demo instructions | — |

> 🏁 **Milestone**: MVP demo-ready. All success criteria met.

---

## 5. Success Criteria (MVP "Done" Definition)

The MVP is considered **complete** when all of the following can be demonstrated end-to-end:

| # | Criterion | Verification Method |
|---|---|---|
| SC1 | **Citizen registers and logs in** | Register with role "citizen" → receive JWT → redirected to Citizen Dashboard |
| SC2 | **Citizen uploads an identity document** | Upload Aadhaar/PAN/Passport → file encrypted (AES-256) → uploaded to IPFS → SHA-256 hash recorded on blockchain → status shows "pending" |
| SC3 | **Verifier approves KYC** | Verifier logs in → sees pending submission → approves → KYC ID generated and stored on-chain → citizen notified → status changes to "verified" |
| SC4 | **Company requests access** | Company logs in → enters KYC ID → sends access request → citizen receives notification |
| SC5 | **Citizen approves access** | Citizen views request → approves → on-chain consent event emitted → company notified |
| SC6 | **Company retrieves verified document** | Company fetches document → backend retrieves from IPFS → decrypts → recomputes SHA-256 → matches on-chain hash → document displayed |
| SC7 | **Tamper detection works** | If IPFS content is altered, hash mismatch is detected and flagged |
| SC8 | **Citizen revokes access** | Citizen revokes → on-chain event emitted → company can no longer retrieve document |
| SC9 | **Role-based access control enforced** | Citizens cannot verify; verifiers cannot submit; companies cannot approve their own requests |
| SC10 | **No raw documents in MongoDB** | Database inspection confirms only metadata — no binary document content |

---

## 6. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Pinata API rate limits / downtime | IPFS uploads fail | Medium | Implement retry logic in `ipfsService.js`; add fallback error messaging |
| Ganache state lost on restart | Deployed contract disappears | High | Re-run deploy script; document this in README setup steps |
| AES key compromise | All stored documents decryptable | Low (dev env) | Master key in `.env` (git-ignored); per-document keys encrypted at rest in MongoDB |
| Large file uploads timeout | Citizen submission fails | Medium | Multer 10 MB limit; frontend file-size validation before upload |
| Blockchain tx failures | On-chain registration fails | Low | Wrap all Ethers.js calls in try-catch; surface clear errors to frontend |

---

## 7. Assumptions & Dependencies

| Assumption | Detail |
|---|---|
| **MongoDB running locally** | MongoDB Community Edition installed and running on `localhost:27017` |
| **Ganache available** | Ganache CLI or GUI installed, running on `localhost:7545` with funded accounts |
| **Pinata account** | Free-tier Pinata account with API key and secret configured in `backend/.env` |
| **Node.js 18+** | LTS version installed with npm |
| **No concurrent users** | MVP is single-developer demo; no load testing or multi-session handling |
| **Citizens provide wallet addresses** | Users register with an Ethereum wallet address (from Ganache accounts) |

---

> [!CAUTION]
> **Awaiting approval.** Please review this project info document and confirm to begin Day 1 execution (project scaffolding + smart contract + Vite setup).
