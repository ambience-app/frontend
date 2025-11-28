"use client";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { profileUpdateSchema } from "@/lib/validation/user";
import { createRateLimitedFunction, useRateLimit } from "@/utils/rateLimiter";
import { createSafeError } from "@/lib/security/errors";
import { sanitizeMessage } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";

/**
 * ProfileForm component
 *
 * A comprehensive form component for updating user profile information with validation,
 * rate limiting, and security features. Handles username, bio, and avatar updates
 * with proper error handling and user feedback.
 *
 * Features:
 * - Real-time form validation with Zod schema
 * - Rate limiting for profile updates (prevents spam)
 * - Input sanitization for security
 * - File upload for avatar with size/type validation
 * - Error handling with user-friendly messages
 * - Loading states during submission
 * - Rate limit status display
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <ProfileForm />
 *
 * // With custom styling
 * <div className="max-w-md mx-auto">
 *   <ProfileForm />
 * </div>
 * ```
 *
 * @returns {JSX.Element} A form with username, bio, and avatar inputs
 */
export function ProfileForm() {
  const { profile, updateProfile, savingProfile } = useProfile();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && Array.isArray(profile) && profile.length > 0) {
      setUsername(profile[0]?.username || "");
      setBio(profile[0]?.bio || "");
    }
  }, [profile]);

  // Rate limiting for profile updates
  const rateLimit = useRateLimit('PROFILE_UPDATE');
  const rateLimitStatus = rateLimit.getStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    try {
      // Check rate limit
      const limitCheck = rateLimit.checkLimit();
      if (!limitCheck.allowed) {
        setErrors([`Too many requests. Please wait ${Math.ceil((limitCheck.retryAfter || 0) / 1000)} seconds.`]);
        return;
      }

      // Sanitize inputs
      const sanitizedUsername = sanitizeMessage(username.trim());
      const sanitizedBio = sanitizeMessage(bio.trim());

      // Validate inputs using Zod schema
      const validationResult = profileUpdateSchema.safeParse({
        username: sanitizedUsername,
        bio: sanitizedBio,
        avatarFile: avatar || undefined
      });

      if (!validationResult.success) {
        const validationErrors = validationResult.error.issues.map(issue => issue.message);
        setErrors(validationErrors);
        return;
      }

      // Create rate-limited update function
      const rateLimitedUpdate = createRateLimitedFunction(
        () => updateProfile({ username: sanitizedUsername, bio: sanitizedBio, avatarFile: avatar }),
        'PROFILE_UPDATE'
      );

      const result = await rateLimitedUpdate();
      
      if ('error' in result) {
        setErrors([result.error]);
        return;
      }

      // Success - form will be reset by the updateProfile function
    } catch (error) {
      const safeError = createSafeError(error, 'profile_form_submit');
      setErrors([safeError.message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate username in real-time
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setUsername(newValue);
    
    // Clear username-specific errors
    if (errors.some(err => err.toLowerCase().includes('username'))) {
      setErrors(prev => prev.filter(err => !err.toLowerCase().includes('username')));
    }
  };

  // Validate bio in real-time
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setBio(newValue);
    
    // Clear bio-specific errors
    if (errors.some(err => err.toLowerCase().includes('bio'))) {
      setErrors(prev => prev.filter(err => !err.toLowerCase().includes('bio')));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h4>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rate Limit Warning */}
      {rateLimitStatus && rateLimitStatus.tokens < 2 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You have {rateLimitStatus.tokens} updates remaining. 
            Resets in {Math.ceil(rateLimitStatus.resetTime / 1000)}s.
          </p>
        </div>
      )}

      {/* Username Input */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter username"
          value={username}
          onChange={handleUsernameChange}
          disabled={isSubmitting || savingProfile}
          maxLength={20}
          autoComplete="off"
        />
        <p className="text-xs text-gray-500 mt-1">
          3-20 characters, letters, numbers, underscores, and hyphens only
        </p>
      </div>

      {/* Bio Input */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={handleBioChange}
          disabled={isSubmitting || savingProfile}
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {bio.length}/500 characters
        </p>
      </div>

      {/* Avatar Input */}
      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
          Profile Picture
        </label>
        <input
          id="avatar"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={(e) => setAvatar(e.target.files?.[0] || null)}
          disabled={isSubmitting || savingProfile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Max 5MB. Supported formats: JPEG, PNG, GIF, WebP
        </p>
        {avatar && (
          <p className="text-xs text-green-600 mt-1">
            Selected: {avatar.name} ({(avatar.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isSubmitting || savingProfile || (rateLimitStatus && rateLimitStatus.tokens === 0)}
        className="w-full"
      >
        {isSubmitting || savingProfile ? "Saving..." : "Save Profile"}
      </Button>

      {/* Rate limit info */}
      {rateLimitStatus && (
        <div className="text-xs text-gray-500 text-center">
          {rateLimitStatus.tokens} requests remaining • Resets in {Math.ceil(rateLimitStatus.resetTime / 1000)}s
        </div>
      )}
    </form>
  );
}
