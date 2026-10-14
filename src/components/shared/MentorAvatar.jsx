import React, { useState, useEffect } from 'react';
import { getProfileImageUrl } from '../../utils/imageCompressor';

/**
 * MentorAvatar
 * Renders a mentor's thumbnail with robust image URL resolution:
 * 1. Checks mentor_profile_image, avatar, profile_image, and profile fields.
 * 2. Uses getProfileImageUrl to resolve relative paths.
 * 3. Falls back to production VITE_IMAGE_URL if local dev returns 404 (e.g. mentor photo exists in prod).
 * 4. Falls back gracefully to first-letter / UI-avatar when no valid photo exists or both fail.
 * 5. Prevents any native broken-image icons from ever appearing.
 */
const MentorAvatar = ({
  mentor,
  className = "w-14 h-14 rounded-2xl object-cover shadow-sm bg-gray-100 shrink-0",
  fallbackClassName = "w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0 select-none",
  onPhotoClick
}) => {
  const [useProdFallback, setUseProdFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  const rawPath = mentor?.mentor_profile_image || mentor?.avatar || mentor?.profile_image || mentor?.profile;
  const hasRealPhoto = Boolean(rawPath && !rawPath.includes('ui-avatars.com'));

  useEffect(() => {
    setUseProdFallback(false);
    setHasError(false);
  }, [rawPath]);
  const displayName = mentor?.name || mentor?.mentor_name || 'Mentor';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M';
  const prodBase = import.meta.env.VITE_IMAGE_URL || '';

  // Calculate current image URL
  let imageSrc = '';
  if (hasRealPhoto && !hasError) {
    if (useProdFallback && prodBase && !rawPath.startsWith('http')) {
      imageSrc = rawPath.startsWith('/') ? `${prodBase}${rawPath}` : `${prodBase}/${rawPath}`;
    } else {
      imageSrc = getProfileImageUrl(rawPath);
    }
  }

  const handleError = () => {
    // If we haven't tried the production fallback yet and have a relative path, try it
    if (!useProdFallback && prodBase && rawPath && !rawPath.startsWith('http')) {
      setUseProdFallback(true);
    } else {
      setHasError(true);
    }
  };

  if (!hasRealPhoto || !imageSrc || hasError) {
    return (
      <div
        className={fallbackClassName}
        title={displayName}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={displayName}
      className={`${className} ${onPhotoClick ? 'cursor-pointer hover:opacity-95 active:scale-95 transition-all' : ''}`}
      onClick={(e) => {
        if (onPhotoClick) {
          e.stopPropagation();
          onPhotoClick(imageSrc);
        }
      }}
      onError={handleError}
      title={onPhotoClick ? "Click to view full photo" : displayName}
    />
  );
};

export default MentorAvatar;
