import React from 'react';

function ProfileSkeleton() {
    return (
        <div className="w-full max-w-2xl mx-auto rounded-lg shadow-sm animate-pulse">
            {/* 
                Remove this <p> tag before usage 
                It is just for identification while testing
            */}
            <p>Profile Skeleton</p>

            {/* Profile Header */}
            <div className="relative">
                {/* Profile Picture */}
                <div className="absolute -bottom-12 left-6">
                    <div className="h-20 w-20 rounded-full border-4 border-white bg-gray-200"></div>
                </div>
            </div>
            
            {/* Profile Info */}
            <div className="px-6 pt-16 pb-6">
                {/* Name and Username */}
                <div className="space-y-2 mb-6">
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    <div className="h-2 w-32 bg-gray-100 rounded"></div>
                </div>
                
                {/* Bio */}
                <div className="space-y-3 mb-6">
                    <div className="h-3 w-full bg-gray-100 rounded"></div>
                    <div className="h-3 w-5/6 bg-gray-100 rounded"></div>
                    <div className="h-3 w-4/6 bg-gray-100 rounded"></div>
                </div>
            </div>
        </div>
    );
}

export default ProfileSkeleton;