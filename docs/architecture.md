# Decentralized KYC Platform — System Architecture

## 1. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                        │
│  │   Citizen     │  │   Verifier   │  │   Company    │                        │
│  │   Dashboard   │  │   Dashboard  │  │   Dashboard  │                        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                        │
│         └─────────────────┼─────────────────┘                                │
│                           │  Role-Based Views                                │
│                    ┌──────┴───────┐                                           │
│                    │  React App   │                                           │
│                    │  (SPA)       │                                           │
│                    └──────┬───────┘                                           │
└───────────────────────────┼──────────────────────────────────────────────────┘
                            │  HTTPS / REST API
                            │  JWT Bearer Token
                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (Node.js / Express)                      │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Auth Module  │  │  KYC Module │  │ Access Ctrl  │  │ Notification│        │
│  │ (JWT+RBAC)  │  │ (Submit/    │  │ (Request/   │  │ Module      │        │
│  │             │  │  Verify)    │  │  Approve)   │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐         │
│  │                    Service Layer                                │         │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │         │
│  │  │ Crypto     │  │ Blockchain │  │ IPFS       │               │         │
│  │  │ Service    │  │ Service    │  │ Service    │               │         │
│  │  │ (AES/SHA)  │  │ (Web3.js)  │  │ (Pinata)  │               │         │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘               │         │
│  └────────┼────────────────┼───────────────┼─────────────────────┘         │
└───────────┼────────────────┼───────────────┼─────────────────────────────────┘
            │                │               │
            ▼                ▼               ▼
  ┌─────────────────┐ ┌───────────┐ ┌──────────────────┐
  │   MongoDB       │ │ Ethereum  │ │  IPFS / Pinata   │
  │                 │ │ Blockchain│ │  (Distributed     │
  │  • Users        │ │ (Ganache) │ │   Storage)        │
  │  • Sessions     │ │           │ │                   │
  │  • Access Logs  │ │ Smart     │ │  • Encrypted      │
  │  • Notifications│ │ Contracts │ │    Documents      │
  │  • KYC Metadata │ │           │ │  • AES-256        │
  │                 │ │ • Doc     │ │    Encrypted      │
  │  ⛔ NEVER raw   │ │   Hashes  │ │                   │
  │    KYC docs    │ │ • KYC IDs │ │                   │
  │                 │ │ • Status  │ │                   │
  │                 │ │ • Consent │ │                   │
  └─────────────────┘ └───────────┘ └──────────────────┘
        Layer 3            Layer 1          Layer 2
   (App Metadata)    (Immutable Ledger) (Encrypted Docs)
```

---

## 2. Data Flow

### 2.1 Document Submission & KYC Verification

```
  Citizen                    Backend                Blockchain        IPFS/Pinata        MongoDB
    │                          │                       │                  │                 │
    │  1. Upload doc + auth    │                       │                  │                 │
    │ ─────────────────────►   │                       │                  │                 │
    │                          │  2. Validate JWT      │                  │                 │
    │                          │     + role check      │                  │                 │
    │                          │                       │                  │                 │
    │                          │  3. Encrypt doc       │                  │                 │
    │                          │     (AES-256-CBC)     │                  │                 │
    │                          │                       │                  │                 │
    │                          │  4. Upload encrypted ─┼──────────────►   │                 │
    │                          │     blob to IPFS      │                  │                 │
    │                          │                       │      5. Return   │                 │
    │                          │  ◄────────────────────┼──── IPFS CID    │                 │
    │                          │                       │                  │                 │
    │                          │  6. Compute SHA-256   │                  │                 │
    │                          │     of original doc   │                  │                 │
    │                          │                       │                  │                 │
    │                          │  7. Store docHash, ──►│                  │                 │
    │                          │     IPFS CID,         │                  │                 │
    │                          │     citizenAddr       │                  │                 │
    │                          │     on-chain          │                  │                 │
    │                          │                       │                  │                 │
    │                          │  8. Save metadata ────┼──────────────────┼─────────────►   │
    │                          │     (userId, docType, │                  │  (submission    │
    │                          │      txHash, status:  │                  │   record, NO    │
    │                          │      "pending")       │                  │   raw doc)      │
    │                          │                       │                  │                 │
    │  9. Confirmation         │                       │                  │                 │
    │ ◄─────────────────────   │                       │                  │                 │
    ▼                          ▼                       ▼                  ▼                 ▼
```

### 2.2 Verifier Approves KYC

```
  Verifier                  Backend                Blockchain          MongoDB
    │                          │                       │                  │
    │  1. View pending         │                       │                  │
    │     submissions          │                       │                  │
    │ ─────────────────────►   │                       │                  │
    │                          │  2. Fetch pending ────┼──────────────────► 
    │                          │     records           │                  │
    │                          │  ◄────────────────────┼──────────────────┘
    │                          │                       │                  │
    │  3. Approve / Reject     │                       │                  │
    │ ─────────────────────►   │                       │                  │
    │                          │  4. Update status ───►│                  │
    │                          │     on-chain          │                  │
    │                          │     (verified/rejected│                  │
    │                          │      + assign KYC ID) │                  │
    │                          │                       │                  │
    │                          │  5. Update MongoDB ───┼──────────────────►
    │                          │     (status, kycId,   │                  │
    │                          │      verifierId)      │                  │
    │                          │                       │                  │
    │  6. KYC ID returned      │                       │                  │
    │ ◄─────────────────────   │                       │                  │
    ▼                          ▼                       ▼                  ▼
```

### 2.3 Company Requests Access to Citizen's KYC

```
  Company          Backend         Blockchain     IPFS/Pinata    MongoDB       Citizen
    │                 │                │               │            │             │
    │ 1. Request      │                │               │            │             │
    │    access w/    │                │               │            │             │
    │    KYC ID       │                │               │            │             │
    │ ───────────►    │                │               │            │             │
    │                 │ 2. Log access  │               │            │             │
    │                 │    request ────┼───────────────┼────────►   │             │
    │                 │                │               │            │             │
    │                 │ 3. Notify ─────┼───────────────┼────────────┼──────────►  │
    │                 │    citizen     │               │            │             │
    │                 │                │               │            │             │
    │                 │                │               │            │  4. Citizen  │
    │                 │                │               │            │  views req   │
    │                 │  ◄─────────────┼───────────────┼────────────┼───────────  │
    │                 │                │               │            │             │
    │                 │ 5. Record      │               │            │             │
    │                 │    consent ───►│               │            │             │
    │                 │    on-chain    │               │            │             │
    │                 │                │               │            │             │
    │                 │ 6. On approval │               │            │             │
    │                 │    fetch from  ├───────────►   │            │             │
    │                 │    IPFS        │               │            │             │
    │                 │  ◄─────────────┼───────────────┘            │             │
    │                 │                │               │            │             │
    │                 │ 7. Decrypt doc │               │            │             │
    │                 │    + verify    │               │            │             │
    │                 │    hash vs     │               │            │             │
    │                 │    on-chain    │               │            │             │
    │                 │    hash        │               │            │             │
    │                 │                │               │            │             │
    │ 8. Verified     │                │               │            │             │
    │    doc returned │                │               │            │             │
    │ ◄───────────    │                │               │            │             │
    ▼                 ▼                ▼               ▼            ▼             ▼
```

### 2.4 Integrity Verification (Tamper Detection)

```
1. Retrieve encrypted document from IPFS using stored CID
2. Decrypt document using AES key
3. Compute SHA-256 hash of the decrypted document
4. Fetch the original document hash from the blockchain
5. Compare:
   • If hashes MATCH     → Document integrity confirmed ✅
   • If hashes MISMATCH  → Document has been tampered with ⛔
```

---

## 3. Component Responsibilities

| Component | Technology | Responsibilities | What It Stores |
|---|---|---|---|
| **Frontend** | React 18 + Vite | Role-based dashboards (Citizen, Verifier, Company). Document upload UI. Access request/approval flows. Notification display. | Client-side state only (no persistent KYC data) |
| **Backend API** | Node.js + Express | REST API gateway. JWT authentication & RBAC middleware. Document encryption/decryption (AES-256). SHA-256 hashing. IPFS upload orchestration. Blockchain transaction submission via Web3.js. Business logic for all 3 roles. | Nothing persistent — delegates to the 3 storage layers |
| **Smart Contracts** | Solidity (^0.8.x) | `registerDocument(docHash, ipfsCID)` — store hash on-chain. `verifyKYC(citizenAddr, kycId)` — verifier marks KYC as approved. `requestAccess(kycId)` — company requests consent. `approveAccess(kycId, companyAddr)` — citizen grants consent. `revokeAccess(kycId, companyAddr)` — citizen revokes consent. Emit events: `DocumentRegistered`, `KYCVerified`, `AccessRequested`, `AccessApproved`, `AccessRevoked`. | Document hashes, KYC IDs, verification status, consent mappings, event logs |
| **IPFS / Pinata** | IPFS protocol via Pinata API | Distributed, content-addressed storage for encrypted document blobs. Pinning service ensures persistence. Content hash (CID) serves as retrieval key. | AES-256 encrypted document files only |
| **MongoDB** | MongoDB 6.x + Mongoose | User accounts (email, hashed password, role, wallet address). Session management. KYC submission metadata (docType, txHash, status, timestamps). Access request records. Notification queue. Audit/access logs. | App metadata — **never raw KYC documents** |

---

## 4. Security Model

### 4.1 Encryption at Rest

| Aspect | Implementation |
|---|---|
| **Document Encryption** | AES-256-CBC. Each document encrypted with a unique per-document key before IPFS upload. Raw documents never leave the backend unencrypted. |
| **Key Management** | Per-document AES keys stored in MongoDB, encrypted with a master key from environment variables. Only the backend can decrypt. |
| **MongoDB Passwords** | User passwords hashed with bcrypt (12 salt rounds). Never stored in plaintext. |

### 4.2 Hashing & Integrity

| Aspect | Implementation |
|---|---|
| **Document Hashing** | SHA-256 of the **original** (pre-encryption) document. Stored immutably on the blockchain. |
| **IPFS CID** | Content-based addressing — the CID of the encrypted blob is also recorded on-chain, linking blockchain ↔ IPFS. |
| **Tamper Detection** | On retrieval: decrypt from IPFS → re-hash → compare with on-chain hash. Mismatch = tampered. |

### 4.3 Authentication & Authorization

```
┌─────────────────────────────────────────────────┐
│               JWT Authentication                │
│                                                 │
│  Login → Validate credentials → Issue JWT       │
│  JWT payload: { userId, role, walletAddr, iat } │
│  Token expiry: 24h                              │
│  Refresh: sliding window (optional)             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│           Role-Based Access Control             │
│                                                 │
│  CITIZEN:                                       │
│    ✅ Upload documents                          │
│    ✅ View own KYC status                       │
│    ✅ Approve / Deny access requests            │
│    ✅ Revoke previously granted access          │
│    ⛔ Cannot verify others' KYC                 │
│    ⛔ Cannot request access to others' KYC      │
│                                                 │
│  VERIFIER (Bank):                               │
│    ✅ View pending KYC submissions              │
│    ✅ Approve / Reject KYC (issues KYC ID)      │
│    ✅ View verification history                 │
│    ⛔ Cannot submit documents                   │
│    ⛔ Cannot request access                     │
│                                                 │
│  COMPANY:                                       │
│    ✅ Request access to verified KYC via KYC ID │
│    ✅ View approved documents (after consent)   │
│    ✅ View own request history                  │
│    ⛔ Cannot submit or verify documents         │
│    ⛔ Cannot approve own access requests        │
└─────────────────────────────────────────────────┘
```

### 4.4 API Security

| Measure | Detail |
|---|---|
| **HTTPS** | All API traffic over TLS in production |
| **CORS** | Whitelist only the frontend origin |
| **Rate Limiting** | express-rate-limit on auth and upload endpoints |
| **Input Validation** | express-validator on all incoming request bodies |
| **File Upload** | Multer with file-size limits (10 MB) and MIME-type whitelist (image/pdf) |
| **Helmet** | HTTP security headers (CSP, X-Frame-Options, etc.) |

### 4.5 Blockchain Security

| Measure | Detail |
|---|---|
| **Access Modifiers** | Solidity `onlyVerifier`, `onlyCitizen`, `onlyOwner` modifiers enforce role separation on-chain |
| **Event Immutability** | All state changes emit events — provides an immutable audit trail |
| **Private Key Management** | Backend uses server-managed wallet; citizen/verifier/company wallets are mapped at registration |

---

## 5. Tech Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| **Frontend Framework** | React | 18.x | Component-based architecture, rich ecosystem, excellent for role-based dashboards |
| **Frontend Build Tool** | Vite | 5.x | Lightning-fast HMR, modern ESM-first bundling, superior DX over CRA |
| **Frontend Routing** | React Router | 6.x | De-facto standard for SPA routing with role-based protected routes |
| **Frontend HTTP Client** | Axios | 1.x | Promise-based, interceptors for JWT attachment, cleaner API than fetch |
| **UI Styling** | CSS (vanilla) + responsive design | — | Full control, no framework lock-in, lightweight |
| **Backend Runtime** | Node.js | 18.x LTS | Non-blocking I/O, vast npm ecosystem, shared JS with frontend |
| **Backend Framework** | Express | 4.x | Minimal, flexible, well-understood middleware pattern |
| **Authentication** | jsonwebtoken (JWT) | 9.x | Stateless auth, easy RBAC payload, no server-side session store needed |
| **Password Hashing** | bcryptjs | 2.x | Industry-standard adaptive hashing, resistant to brute force |
| **File Upload** | Multer | 1.x | Battle-tested multipart/form-data handling for Express |
| **Database** | MongoDB | 6.x | Flexible schema for evolving metadata, native JSON, horizontal scaling |
| **ODM** | Mongoose | 7.x | Schema validation, middleware hooks, population (joins), clean API |
| **Blockchain** | Ethereum (Ganache for dev) | Ganache 7.x | Local blockchain for rapid development, free transactions, deterministic |
| **Smart Contract Language** | Solidity | ^0.8.x | Dominant EVM language, mature tooling, security patterns (OpenZeppelin) |
| **Contract Tooling** | Hardhat | 2.x | Modern Solidity dev environment: compilation, testing, deployment scripts |
| **Blockchain Interaction** | Ethers.js | 6.x | Lightweight, well-typed, modern alternative to Web3.js for contract calls |
| **Distributed Storage** | IPFS via Pinata | — | Content-addressed storage; Pinata provides reliable pinning + REST API |
| **Document Encryption** | Node.js `crypto` (AES-256-CBC) | Built-in | No external dependency, FIPS-compliant, performant |
| **Document Hashing** | Node.js `crypto` (SHA-256) | Built-in | Deterministic, collision-resistant, industry standard |
| **API Security** | Helmet, CORS, express-rate-limit | — | Defense-in-depth HTTP hardening |
| **Input Validation** | express-validator | 7.x | Declarative validation chains, sanitization, clear error messages |
| **Environment Config** | dotenv | 16.x | Twelve-factor app config, keeps secrets out of source code |

---

## 6. Folder Structure (Monorepo)

```
MAJOR PROJECT 3_8_26/
│
├── contracts/                          # Layer 1: Blockchain
│   ├── contracts/
│   │   └── KYCContract.sol             # Main Solidity smart contract
│   ├── scripts/
│   │   └── deploy.js                   # Hardhat deployment script
│   ├── test/
│   │   └── KYCContract.test.js         # Contract unit tests
│   └── hardhat.config.js               # Hardhat configuration
│
├── backend/                            # Layer 2+3: API Server
│   ├── config/
│   │   └── db.js                       # MongoDB connection setup
│   ├── controllers/
│   │   ├── authController.js           # Register, login, token refresh
│   │   ├── kycController.js            # Document submission & verification
│   │   ├── accessController.js         # Access request & consent flows
│   │   └── notificationController.js   # Notification CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js           # JWT verification
│   │   └── roleMiddleware.js           # Role-based route guards
│   ├── models/
│   │   ├── User.js                     # User schema (role, walletAddr)
│   │   ├── KYCDocument.js              # KYC metadata schema
│   │   ├── AccessRequest.js            # Access request schema
│   │   └── Notification.js             # Notification schema
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth/*
│   │   ├── kycRoutes.js                # /api/kyc/*
│   │   ├── accessRoutes.js             # /api/access/*
│   │   └── notificationRoutes.js       # /api/notifications/*
│   ├── services/
│   │   ├── cryptoService.js            # AES encrypt/decrypt, SHA-256
│   │   ├── ipfsService.js              # Pinata upload/retrieve
│   │   └── blockchainService.js        # Ethers.js contract interactions
│   ├── utils/
│   │   └── helpers.js                  # Shared utilities
│   ├── uploads/                        # Temp directory for Multer (auto-cleaned)
│   ├── .env                            # Environment variables (git-ignored)
│   ├── server.js                       # Express app entry point
│   └── package.json
│
├── frontend/                           # Presentation Layer
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                # Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   ├── common/                 # Shared: Navbar, Sidebar, Loader, etc.
│   │   │   ├── citizen/                # Citizen-specific components
│   │   │   ├── verifier/               # Verifier-specific components
│   │   │   └── company/                # Company-specific components
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CitizenDashboard.jsx
│   │   │   ├── VerifierDashboard.jsx
│   │   │   ├── CompanyDashboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Auth state provider
│   │   ├── hooks/
│   │   │   └── useAuth.js              # Custom auth hook
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx      # Role-guarded route wrapper
│   │   ├── styles/
│   │   │   └── index.css               # Global stylesheet
│   │   ├── App.jsx                     # Root component with routing
│   │   └── main.jsx                    # Vite entry point
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
├── README.md
└── architecture.md                     # ← This document
```

---

## 7. MongoDB Schema Overview

> [!NOTE]
> MongoDB stores **only metadata**. Raw KYC documents are never persisted here.

### Users Collection

```
{
  _id:          ObjectId,
  name:         String,
  email:        String (unique, indexed),
  password:     String (bcrypt hash),
  role:         Enum ["citizen", "verifier", "company"],
  walletAddress:String (Ethereum address),
  kycId:        String (assigned after verification, citizen only),
  createdAt:    Date,
  updatedAt:    Date
}
```

### KYCDocuments Collection

```
{
  _id:          ObjectId,
  userId:       ObjectId (ref → Users),
  documentType: Enum ["aadhaar", "pan", "passport"],
  ipfsCID:      String (IPFS content identifier),
  docHash:      String (SHA-256 of original document),
  txHash:       String (blockchain transaction hash),
  encryptionKey:String (AES key, encrypted with master key),
  status:       Enum ["pending", "verified", "rejected"],
  verifiedBy:   ObjectId (ref → Users, verifier),
  kycId:        String (assigned on verification),
  createdAt:    Date,
  updatedAt:    Date
}
```

### AccessRequests Collection

```
{
  _id:          ObjectId,
  requestedBy:  ObjectId (ref → Users, company),
  citizenId:    ObjectId (ref → Users, citizen),
  kycId:        String,
  status:       Enum ["pending", "approved", "denied", "revoked"],
  consentTxHash:String (blockchain tx for consent event),
  requestedAt:  Date,
  respondedAt:  Date
}
```

### Notifications Collection

```
{
  _id:          ObjectId,
  userId:       ObjectId (ref → Users),
  message:      String,
  type:         Enum ["access_request", "kyc_verified", "kyc_rejected", "access_revoked"],
  isRead:       Boolean (default: false),
  relatedId:    ObjectId (ref → AccessRequests or KYCDocuments),
  createdAt:    Date
}
```

---

## 8. Smart Contract Interface

> [!IMPORTANT]
> The contract is the single source of truth for document integrity and consent. Off-chain data in MongoDB is supplementary metadata.

### Core Functions

| Function | Caller | Description |
|---|---|---|
| `registerDocument(bytes32 docHash, string ipfsCID)` | Citizen | Records document hash and IPFS CID on-chain |
| `verifyKYC(address citizen, string kycId)` | Verifier | Marks a citizen's KYC as verified, assigns KYC ID |
| `rejectKYC(address citizen)` | Verifier | Marks KYC as rejected |
| `requestAccess(string kycId)` | Company | Emits an access request event for a given KYC ID |
| `approveAccess(string kycId, address company)` | Citizen | Grants a company access to their KYC |
| `revokeAccess(string kycId, address company)` | Citizen | Revokes a company's access |
| `checkAccess(string kycId, address company)` | Any | View function — returns whether access is granted |
| `getDocument(address citizen)` | Authorized | Returns stored docHash and IPFS CID |

### Events

| Event | Emitted When |
|---|---|
| `DocumentRegistered(address citizen, bytes32 docHash, string ipfsCID)` | Document registered on-chain |
| `KYCVerified(address citizen, string kycId, address verifier)` | Verifier approves KYC |
| `KYCRejected(address citizen, address verifier)` | Verifier rejects KYC |
| `AccessRequested(string kycId, address company)` | Company requests access |
| `AccessApproved(string kycId, address citizen, address company)` | Citizen approves access |
| `AccessRevoked(string kycId, address citizen, address company)` | Citizen revokes access |

---

## 9. API Endpoints Overview

### Auth Routes (`/api/auth`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/register` | Public | Register with name, email, password, role |
| POST | `/login` | Public | Login, receive JWT |

### KYC Routes (`/api/kyc`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/submit` | Citizen | Upload document (multipart) |
| GET | `/status` | Citizen | Get own KYC status |
| GET | `/pending` | Verifier | List pending submissions |
| POST | `/verify/:id` | Verifier | Approve KYC, assign KYC ID |
| POST | `/reject/:id` | Verifier | Reject KYC |

### Access Routes (`/api/access`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/request` | Company | Request access using KYC ID |
| GET | `/requests` | Citizen | View pending access requests |
| POST | `/approve/:id` | Citizen | Approve a request |
| POST | `/deny/:id` | Citizen | Deny a request |
| POST | `/revoke/:id` | Citizen | Revoke granted access |
| GET | `/document/:kycId` | Company | Retrieve verified document (if approved) |

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | Any (authenticated) | Get own notifications |
| PATCH | `/:id/read` | Any (authenticated) | Mark notification as read |

---

## 10. Deployment Topology (Development)

```
┌──────────────────────────────────────────────┐
│              Developer Machine               │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Frontend  │  │ Backend  │  │ Ganache  │   │
│  │ :5173     │  │ :5000    │  │ :7545    │   │
│  │ (Vite)    │  │ (Express)│  │ (Local   │   │
│  │           │  │          │  │  Chain)  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                              │
│  ┌──────────┐  ┌───────────────────────┐     │
│  │ MongoDB  │  │ Pinata (Cloud IPFS)   │     │
│  │ :27017   │  │ https://api.pinata.   │     │
│  │ (Local)  │  │ cloud                 │     │
│  └──────────┘  └───────────────────────┘     │
└──────────────────────────────────────────────┘
```

| Service | Port | Notes |
|---|---|---|
| Frontend (Vite) | 5173 | Proxies API calls to backend |
| Backend (Express) | 5000 | Central API server |
| Ganache | 7545 | Local Ethereum blockchain |
| MongoDB | 27017 | Local database instance |
| Pinata | Cloud | IPFS pinning service (API key required) |

---

## 11. Key Design Decisions

> [!TIP]
> These decisions are documented here for future reference and to guide implementation.

1. **Encrypt-then-upload**: Documents are AES-encrypted **before** uploading to IPFS. Even if an IPFS CID is discovered, the raw document cannot be read without the decryption key.

2. **Hash original, not encrypted**: SHA-256 is computed on the **original** document (before encryption). This allows integrity verification after decryption — if the decrypted content's hash matches the on-chain hash, the document is untampered.

3. **Consent on-chain**: Access approvals and revocations are recorded as blockchain events, creating an immutable consent audit trail that neither party can later deny.

4. **Ethers.js over Web3.js**: Ethers.js is chosen over Web3.js for its smaller bundle size, better TypeScript support, and cleaner provider/signer separation.

5. **Pinata over local IPFS node**: Pinata abstracts away IPFS node management, provides reliable pinning, and offers a clean REST API — ideal for development and production without DevOps overhead.

6. **Monorepo structure**: Keeping `/contracts`, `/backend`, and `/frontend` in one repository enables atomic commits across the stack, shared configuration, and simpler CI/CD.

---

> [!CAUTION]
> **Awaiting approval.** No implementation code will be written until this architecture is reviewed and approved. Please review all sections and provide feedback or approval to proceed.
