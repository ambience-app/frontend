import React from 'react';

function RoomSkeleton() {
    return (
        <div className="flex flex-col h-full rounded-lg shadow-sm overflow-hidden animate-pulse">
            {/* 
                Remove this <p> tag before usage 
                It is just for identification while testing
            */}
            <p>Room Skeleton</p>
            
            {/* Chat Header */}
            <div className="border-b border-gray-100 p-4 flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 w-20 bg-gray-100 rounded"></div>
                </div>
                <div className="flex space-x-2">
                    <div className="h-6 w-6 rounded-full bg-gray-100"></div>
                    {/* <div className="h-6 w-6 rounded-full bg-gray-100"></div> */}
                    {/* <div className="h-6 w-6 rounded-full bg-gray-100"></div> */}
                </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Received Message */}
                <div className="flex items-start space-x-2 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-gray-200 mt-1"></div>
                    <div className="space-y-1">
                        <div className="h-3 w-20 bg-gray-100 rounded"></div>
                        <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-sm">
                            <div className="h-3 w-48 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-40 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-2 w-16 bg-gray-100 rounded"></div>
                    </div>
                </div>
                
                {/* Sent Message */}
                <div className="flex flex-col items-end space-y-1 ml-auto max-w-[80%]">
                    <div className="bg-blue-100 p-3 rounded-2xl rounded-tr-sm">
                        <div className="h-3 w-32 bg-blue-200 rounded"></div>
                    </div>
                    <div className="h-2 w-16 bg-gray-100 rounded"></div>
                </div>
                
                {/* Message Input */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded-full bg-gray-100"></div>
                        <div className="flex-1 h-12 bg-gray-100 rounded-full"></div>
                        <div className="h-10 w-10 rounded-full bg-gray-100"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoomSkeleton;