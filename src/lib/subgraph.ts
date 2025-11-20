import { gql } from '@apollo/client';

export const GET_ROOM_MESSAGES = gql`
  query GetRoomMessages($roomId: ID!, $first: Int = 20, $skip: Int = 0) {
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
        transactionHash
      }
    }
  }
`;

export const GET_USER_MESSAGES = gql`
  query GetUserMessages($userId: ID!, $first: Int = 20, $skip: Int = 0) {
    user(id: $userId) {
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
        roomId
        timestamp
        transactionHash
      }
    }
  }
`;

export const SEARCH_MESSAGES = gql`
  query SearchMessages($query: String!, $first: Int = 20, $skip: Int = 0) {
    messages(
      where: { content_contains: $query }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      content
      sender
      roomId
      timestamp
    }
  }
`;
