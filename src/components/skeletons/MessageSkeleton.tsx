import React from 'react';

function MessageSkeleton() {
    return (
        <div className="w-full px-4 py-3 animate-pulse">
            {/* 
                Remove this <p> tag before usage 
                It is just for identification while testing
            */}
            <p>Message Skeleton</p>
            {/* Message container */}
            <div className="flex space-x-3">
                {/* Avatar */}
                <div className="shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                </div>
                
                {/* Message content */}
                <div className="flex-1 min-w-0">
                    <div className="h-2 w-24 bg-gray-200 mb-2 rounded"></div>
                    {/* Message text */}
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    
                    {/* Sender and timestamp */}
                    <div className="flex items-center mt-2 space-x-2">
                        <div className="h-2 w-12 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MessageSkeleton;