# Ambience Chat Subgraph

This subgraph indexes blockchain events from the Ambience Chat smart contract and makes them queryable via GraphQL.

## Development

### Prerequisites

- Node.js (v16 or later)
- Yarn or npm
- Graph CLI: `npm install -g @graphprotocol/graph-cli`

### Setup

1. Install dependencies:
   ```bash
   cd subgraph
   npm install
   ```

2. Generate types and prepare the subgraph:
   ```bash
   graph codegen
   graph build
   ```

### Deployment

#### Local Development

1. Start a local Graph Node (requires Docker):
   ```bash
   docker-compose up -d
   ```

2. Deploy to your local node:
   ```bash
   npm run create-local
   npm run deploy-local
   ```

#### Production (The Graph Hosted Service)

1. Authenticate with The Graph CLI:
   ```bash
   graph auth --studio <your-access-token>
   ```

2. Deploy to The Graph Hosted Service:
   ```bash
   npm run deploy
   ```

## Querying the Subgraph

Example GraphQL queries:

```graphql
# Get messages for a specific room
{
  room(id: "room-1") {
    id
    messageCount
    messages(first: 10, orderBy: timestamp, orderDirection: desc) {
      id
      content
      sender
      timestamp
    }
  }
}

# Get user's messages
{
  user(id: "0x...") {
    id
    messageCount
    messages(first: 10, orderBy: timestamp, orderDirection: desc) {
      id
      content
      roomId
      timestamp
    }
  }
}
```

## Schema

The subgraph indexes the following entities:

- **Message**: Individual chat messages
- **Room**: Chat rooms containing messages
- **User**: Message senders

## Event Handlers

- `MessageSent`: Tracks new messages and updates related entities

## Integration with Frontend

To use this subgraph in your frontend, you can use a GraphQL client like Apollo or urql. Here's an example using Apollo Client:

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const API_URL = 'YOUR_GRAPHQL_ENDPOINT';

const client = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache(),
});

// Example query
export const GET_ROOM_MESSAGES = gql`
  query GetRoomMessages($roomId: ID!, $first: Int = 10, $skip: Int = 0) {
    room(id: $roomId) {
      id
      messageCount
      messages(
        first: $first,
        skip: $skip,
        orderBy: timestamp,
        orderDirection: desc
      ) {
        id
        content
        sender
        timestamp
      }
    }
  }
`;
```
