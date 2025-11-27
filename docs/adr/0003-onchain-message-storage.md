# 3. On-Chain Message Storage Strategy

- **Status**: Accepted
- **Date**: 2025-11-21

## Context
We needed to decide how to store messages in our application, considering factors like cost, decentralization, and data availability. Several approaches were considered including fully on-chain storage, IPFS, and hybrid solutions.

## Decision
We chose a hybrid approach for message storage:
1. **On-Chain**: Store message metadata and references on-chain
2. **IPFS/Decentralized Storage**: Store actual message content on IPFS
3. **Indexing**: Use The Graph for efficient querying of message data

### Rationale
- **Cost Efficiency**: Storing only hashes on-chain reduces gas costs
- **Decentralization**: Maintains decentralization principles
- **Data Availability**: IPFS ensures data persistence
- **Query Performance**: The Graph enables efficient data querying

## Consequences
### Positive
- Lower transaction costs
- Decentralized and censorship-resistant
- Scalable storage solution
- Efficient data retrieval

### Negative
- Added complexity in implementation
- Need to manage IPFS pinning
- Slightly higher latency for message retrieval

### Neutral
- Requires monitoring of storage layer performance
- Need for fallback mechanisms in case of IPFS node issues
