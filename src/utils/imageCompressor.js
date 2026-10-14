/**
 * Utility to compress image files in the browser (client-side) before uploading to server.
 * Resizes max width/height to specified pixels and converts to compressed JPEG blob.
 *
 * @param {File} file - The original File object from file input
 * @param {number} maxWidth - Maximum width or height dimension in pixels (default: 800)
 * @param {number} quality - Quality ratio between 0.1 and 1.0 (default: 0.75)
 * @returns {Promise<File>} - Compressed File object
 */
export const compressImage = (file, maxWidth = 800, quality = 0.75) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return resolve(file); // Return original if not an image
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file); // Fallback to original
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`Compressed image: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Resolves a profile image URL.
 * Handles:
 * 1. Full URLs (http://, https://, data:, blob:)
 * 2. Relative URLs (/uploads/...) served by backend API server
 * 3. Derives base URL from VITE_API_BASE_URL (where upload endpoint and static uploads live),
 *    falling back to VITE_IMAGE_URL.
 *
 * @param {string} url - Profile image path or URL
 * @returns {string} - Full accessible image URL
 */
export const getProfileImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Derive backend origin from VITE_API_BASE_URL (where upload endpoint and static uploads live)
  let backendOrigin = '';
  try {
    if (import.meta.env.VITE_API_BASE_URL) {
      const parsed = new URL(import.meta.env.VITE_API_BASE_URL);
      backendOrigin = parsed.origin;
    }
  } catch (e) {
    backendOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
  }

  const baseUrl = backendOrigin || import.meta.env.VITE_IMAGE_URL || '';
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};
