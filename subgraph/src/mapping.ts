import { Message, Room, User } from '../generated/schema';
import { MessageSent } from '../generated/AmbienceChat/AmbienceChat';
import { BigInt } from '@graphprotocol/graph-ts';

export function handleMessageSent(event: MessageSent): void {
  // Create or update the user
  let user = User.load(event.params.sender.toHexString());
  if (!user) {
    user = new User(event.params.sender.toHexString());
    user.messageCount = BigInt.fromI32(0);
    user.save();
  }
  
  // Create or update the room
  let room = Room.load(event.params.roomId);
  if (!room) {
    room = new Room(event.params.roomId);
    room.messageCount = BigInt.fromI32(0);
    room.createdAt = event.block.timestamp;
  }
  
  // Create the message
  const messageId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();
  let message = new Message(messageId);
  
  message.sender = user.id;
  message.content = event.params.content;
  message.roomId = event.params.roomId;
  message.timestamp = event.params.timestamp;
  message.transactionHash = event.transaction.hash;
  message.blockNumber = event.block.number;
  message.blockTimestamp = event.block.timestamp;
  
  // Update relationships
  message.save();
  
  // Update user and room counters
  user.messageCount = user.messageCount.plus(BigInt.fromI32(1));
  user.save();
  
  room.messageCount = room.messageCount.plus(BigInt.fromI32(1));
  room.updatedAt = event.block.timestamp;
  room.lastMessage = message.id;
  room.save();
}
