import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, Upload } from 'lucide-react';

/**
 * ProfilePhotoViewer
 * Full-size photo viewer modal for Student and Counsellor profiles.
 * Supports image viewing, first-letter avatar fallback, edit menu with:
 * 1. "Remove Profile Photo" (confirmation dialog)
 * 2. "Update Profile Photo" (compact file selection dialog)
 */
const ProfilePhotoViewer = ({
  isOpen,
  onClose,
  imageUrl,
  name,
  onRemovePhoto,
  onUploadPhoto,
  readOnly = false
}) => {
  const canEdit = !readOnly && Boolean(onRemovePhoto || onUploadPhoto);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageError = (e) => {
    const currentSrc = e.target.src;
    const prodBase = import.meta.env.VITE_IMAGE_URL || '';
    if (prodBase && !currentSrc.startsWith(prodBase) && imageUrl) {
      try {
        const parsed = new URL(currentSrc);
        const fallbackUrl = `${prodBase}${parsed.pathname}`;
        if (currentSrc !== fallbackUrl) {
          e.target.src = fallbackUrl;
          return;
        }
      } catch (err) {
        // ignore
      }
    }
    setHasLoadError(true);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setValidationError('');

    // 1. Validate File Size (Max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setValidationError('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    // 2. Validate MIME Type & Extension (JPG, JPEG, PNG, WebP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const hasValidExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
    const hasValidMime = allowedTypes.includes(file.type);

    if (!hasValidMime && !hasValidExtension) {
      setValidationError('Unsupported format. Please choose a JPG, PNG, or WebP image.');
      return;
    }

    if (!onUploadPhoto) {
      setValidationError('Upload handler is not available.');
      return;
    }

    // 3. Perform upload using existing upload handler
    setIsUploading(true);
    try {
      const success = await onUploadPhoto(file);
      if (success !== false) {
        setIsUpdateModalOpen(false);
        setIsMenuOpen(false);
        onClose?.();
      }
    } catch (err) {
      console.error('Profile photo upload error:', err);
      setValidationError(err?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (isRemoving) return;
    if (!onRemovePhoto) {
      setIsConfirmDeleteOpen(false);
      setIsMenuOpen(false);
      onClose?.();
      return;
    }
    setIsRemoving(true);
    try {
      const success = await onRemovePhoto();
      if (success !== false) {
        setIsConfirmDeleteOpen(false);
        setIsMenuOpen(false);
        onClose?.();
      }
    } catch (err) {
      console.error("Profile photo removal error:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  useEffect(() => {
    setHasLoadError(false);
  }, [imageUrl]);

  // Reset sub-menus whenever viewer opens or closes
  useEffect(() => {
    if (!isOpen) {
      setIsMenuOpen(false);
      setIsConfirmDeleteOpen(false);
      setIsUpdateModalOpen(false);
      setIsRemoving(false);
      setIsUploading(false);
      setValidationError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while viewer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Hierarchical Escape key handler: closes topmost layer first
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isConfirmDeleteOpen) {
          if (!isRemoving) setIsConfirmDeleteOpen(false);
        } else if (isUpdateModalOpen) {
          if (!isUploading) {
            setValidationError('');
            setIsUpdateModalOpen(false);
          }
        } else if (isMenuOpen) {
          setIsMenuOpen(false);
        } else {
          onClose?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMenuOpen, isConfirmDeleteOpen, isUpdateModalOpen, isUploading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo viewer"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              if (isMenuOpen) setIsMenuOpen(false);
              else onClose?.();
            }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md cursor-pointer"
          />

          {/* Top-Right Action Controls */}
          <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 flex items-center gap-3">
            {/* Edit Icon Button (only when editing is allowed) */}
            {canEdit && (
              <div className="relative">
                <button
                  type="button"
                  id="profile-viewer-edit-btn"
                  aria-label="Edit Profile Photo"
                  title="Edit Profile Photo"
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen((prev) => !prev);
                  }}
                  className={`w-11 h-11 rounded-full border transition-all flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer ${
                    isMenuOpen
                      ? 'bg-white/30 text-white border-white/40 ring-2 ring-white/30'
                      : 'bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md border border-white/10'
                  }`}
                >
                  <Pencil className="w-5 h-5 text-white" aria-hidden="true" />
                </button>

                {/* Action Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      {/* Transparent Dismiss Overlay for Dropdown */}
                      <div
                        className="fixed inset-0 z-25"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                        }}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-zinc-900/95 dark:bg-[#1e293b]/95 border border-white/15 shadow-2xl backdrop-blur-2xl p-2 z-30 flex flex-col gap-1 text-white"
                      >
                        {/* Option 2: Update Profile Photo */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsUpdateModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10 active:scale-[0.98] transition-all text-left text-sm font-bold text-white cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 text-[#f97316] flex items-center justify-center group-hover:bg-[#f97316] group-hover:text-white transition-colors">
                            <Upload className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <span>Update Profile Photo</span>
                        </button>

                        <div className="w-full h-px bg-white/10 my-0.5" />

                        {/* Option 1: Remove Profile Photo */}
                        <button
                          type="button"
                          id="menu-remove-photo-btn"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsConfirmDeleteOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-rose-500/15 active:scale-[0.98] transition-all text-left text-sm font-bold text-rose-400 hover:text-rose-300 cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <span>Remove Profile Photo</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              id="profile-viewer-close-btn"
              aria-label="Close photo viewer"
              title="Close photo viewer"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
            >
              <X className="w-5 h-5 text-white" aria-hidden="true" />
            </button>
          </div>

          {/* Photo Content Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            onClick={(e) => {
              e.stopPropagation();
              if (isMenuOpen) setIsMenuOpen(false);
            }}
            className="relative max-w-full max-h-[85vh] flex flex-col items-center justify-center z-10 select-none"
          >
            {imageUrl && !hasLoadError ? (
              <img
                src={imageUrl}
                alt={name ? `${name}'s profile photo` : 'Profile Photo'}
                onError={handleImageError}
                className="max-w-[90vw] max-h-[75vh] sm:max-w-[600px] sm:max-h-[80vh] rounded-3xl object-contain shadow-2xl ring-1 ring-white/10 select-none"
              />
            ) : (
              <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-7xl sm:text-8xl shadow-2xl ring-4 ring-white/20 select-none">
                {name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}

            {name && (
              <h2 className="mt-5 text-white font-black text-lg sm:text-xl tracking-tight text-center drop-shadow-md">
                {name}
              </h2>
            )}
          </motion.div>

          {/* Confirmation Dialog: Remove Profile Photo */}
          <AnimatePresence>
            {canEdit && isConfirmDeleteOpen && (
              <div
                className="fixed inset-0 z-40 flex items-center justify-center p-4"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="remove-dialog-title"
                aria-describedby="remove-dialog-desc"
              >
                {/* Dialog Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (!isRemoving) setIsConfirmDeleteOpen(false);
                  }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                />

                {/* Dialog Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-sm rounded-[28px] bg-zinc-900/95 dark:bg-[#1e293b]/95 border border-white/15 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-center z-50 text-white"
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-500/20">
                    <Trash2 className="w-7 h-7" aria-hidden="true" />
                  </div>

                  <h3 id="remove-dialog-title" className="text-xl font-black text-white mb-2 tracking-tight">
                    Remove Profile Photo?
                  </h3>

                  <p id="remove-dialog-desc" className="text-sm text-gray-300 font-medium mb-6 leading-relaxed">
                    Are you sure you want to remove your profile photo?
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      id="cancel-remove-photo-btn"
                      disabled={isRemoving}
                      onClick={() => setIsConfirmDeleteOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-sm transition-all border border-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="confirm-remove-photo-btn"
                      disabled={isRemoving}
                      onClick={handleConfirmRemove}
                      className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRemoving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Removing...</span>
                        </>
                      ) : (
                        <span>Remove Photo</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Update Profile Photo Modal */}
          <AnimatePresence>
            {canEdit && isUpdateModalOpen && (
              <div
                className="fixed inset-0 z-40 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="update-dialog-title"
              >
                {/* Dialog Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (!isUploading) {
                      setValidationError('');
                      setIsUpdateModalOpen(false);
                    }
                  }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                />

                {/* Dialog Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-sm rounded-[28px] bg-zinc-900/95 dark:bg-[#1e293b]/95 border border-white/15 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-center z-50 text-white"
                >
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-[#f97316]/15 hover:bg-[#f97316]/25 active:scale-95 text-[#f97316] mx-auto flex items-center justify-center mb-4 border border-[#f97316]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Click to choose image file"
                    aria-label="Choose photo"
                  >
                    <Upload className="w-7 h-7" aria-hidden="true" />
                  </button>

                  <h3 id="update-dialog-title" className="text-xl font-black text-white mb-2 tracking-tight">
                    Update Profile Photo
                  </h3>

                  <p className="text-sm text-gray-300 font-medium mb-6 leading-relaxed">
                    Select an image from your device to update your profile photo.
                  </p>

                  <input
                    ref={fileInputRef}
                    id="update-profile-photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    disabled={isUploading}
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {validationError && (
                    <div
                      id="upload-validation-error"
                      className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-left flex items-start gap-2"
                    >
                      <span className="text-sm">⚠️</span>
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      id="cancel-update-photo-btn"
                      disabled={isUploading}
                      onClick={() => {
                        if (!isUploading) {
                          setValidationError('');
                          setIsUpdateModalOpen(false);
                        }
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-sm transition-all border border-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="choose-update-photo-btn"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 rounded-xl bg-[#f97316] hover:bg-orange-600 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#f97316]/25 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" aria-hidden="true" />
                          <span>Choose Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePhotoViewer;
