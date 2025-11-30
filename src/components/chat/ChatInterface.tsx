'use client';

import { useState } from 'react';
import { ChatSkeleton } from '../LoadingSkeleton';

export const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Alice', text: 'Hello!', timestamp: '12:00 PM' },
    { id: 2, sender: 'You', text: 'Hi there!', timestamp: '12:01 PM', isMe: true },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message = {
      id: messages.length + 1,
      sender: 'You',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Chat Room</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isMe 
                  ? 'bg-blue-500 text-white rounded-tr-none' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-none'
              }`}
            >
              {!message.isMe && (
                <div className="font-semibold text-xs text-slate-500 dark:text-slate-300">
                  {message.sender}
                </div>
              )}
              <p className="text-sm">{message.text}</p>
              <div className="text-right">
                <span className="text-xs opacity-70">{message.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
