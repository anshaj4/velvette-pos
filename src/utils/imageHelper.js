/**
 * Helper to compress and convert image files/blobs to lightweight Base64 Data URLs.
 * Ensures images persist permanently in database and work across serverless/Vercel environments.
 */
export function compressImageToDataUrl(file, maxWidth = 600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file) {
      resolve('/logo.png');
      return;
    }

    // If already a data URL or string url
    if (typeof file === 'string') {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (!result) {
        resolve('/logo.png');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression error, using raw file data:', canvasErr);
          resolve(result);
        }
      };

      img.onerror = () => {
        resolve(result);
      };

      img.src = result;
    };

    reader.onerror = () => {
      resolve('/logo.png');
    };

    reader.readAsDataURL(file);
  });
}
