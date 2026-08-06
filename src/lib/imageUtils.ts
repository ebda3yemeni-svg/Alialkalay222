/**
 * Utility to process uploaded image files from device (gallery/camera/file manager),
 * compress/resize them on HTML5 Canvas to optimal resolution, and return a clean Data URL
 * that can be stored permanently in the database.
 */
export const processImageFile = (
  file: File,
  maxDimension: number = 900,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المالي ليس صورة صالحة'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG for standard photos for superior compression, PNG if transparent
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('تعذر قراءة بيانات الصورة المختارة'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('فشل فتح الملف من الجهاز'));
    reader.readAsDataURL(file);
  });
};
