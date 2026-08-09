# Smart Contract Performance & Gas Report
*Integration Track - Day 2*

## 1. Test Coverage
We ran `solidity-coverage` to ensure our core contract logic is heavily tested before analyzing its gas limits. 
- **KYCRegistry.sol** (the primary contract used in the backend/frontend) 
- **Coverage Status**: 
  - **Statements:** 100%
  - **Functions:** 100%
  - **Lines:** 100%
  - **Branches:** 66.67% (Total combined branches across both contracts: 82.35%)

## 2. Gas Usage Baseline & Optimization
Initially, we ran `hardhat-gas-reporter` against `KYCRegistry`. 

**Identified Optimization Opportunity**:
The `KYCRecord` struct was originally storing the `userId` as a `string`:
```solidity
struct KYCRecord {
    string docHash;
    string ipfsCID;
    string userId; // <-- REDUNDANT
    bool isRegistered;
    address owner;
}
```
Because the `userId` was already the key in the mapping (`mapping(string => KYCRecord) public kycRecords;`), storing it inside the struct itself forced an additional expensive storage write (`SSTORE`) for a dynamic string type during registration.

**Applied Optimization**:
We removed `userId` from the `KYCRecord` struct entirely, relying strictly on the mapping key to track records.

### Gas Savings Achieved:
| Metric | Pre-Optimization | Post-Optimization | Savings |
|---|---|---|---|
| **Contract Deployment** | 795,427 gas | 753,941 gas | ~41,486 gas |
| **`registerKYC` Function** | 187,169 gas | 164,642 gas | **~22,527 gas** |

*(A standard storage write for a non-zero slot costs ~20,000 gas; avoiding this string storage write cleanly explains our 22.5k gas reduction).*

## 3. Gas Cost Estimations (Post-Optimization)
Assuming a network gas price of **20 gwei** and an ETH price of **$3,000 USD** (for equivalent mainnet scale estimations, though this will likely be deployed to a low-cost L2 or sidechain in production).

*Calculation: `Gas Used × 0.00000002 ETH/gas × $3000/ETH`*

| Function / Operation | Average Gas Used | Estimated USD Cost (Mainnet) |
|---|---|---|
| **Contract Deployment** | 753,941 gas | ~$45.23 |
| **`registerKYC`** | 164,642 gas | ~$9.87 |
| **`approveAccess`** | 49,869 gas | ~$2.99 |
| **`requestAccess`** | 27,342 gas | ~$1.64 |

## Conclusion
The `KYCRegistry` contract is highly gas-optimized for its role as a registry pointer. Further gas savings could theoretically be achieved by converting the string IPFS CID to a `bytes32` multihash format, but the current `string` setup allows for maximum compatibility with IPFS clients on the frontend without heavy encoding/decoding logic.
