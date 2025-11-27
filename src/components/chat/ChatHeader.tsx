import React from 'react';

type ChatHeaderProps = {
  roomName: string;
};

export function ChatHeader({ roomName }: ChatHeaderProps) {
  return (
    <div className="h-16 border-b flex items-center px-4 bg-background">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <h1 className="font-semibold">{roomName}</h1>
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <button className="p-2 rounded-full hover:bg-muted/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <button className="p-2 rounded-full hover:bg-muted/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
}
