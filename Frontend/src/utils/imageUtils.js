/**
 * Reads an uploaded image file, downsizes it to a max width/height, and returns
 * a compressed WEBP data URL. Keeps localStorage usage sane since phone photos
 * can otherwise be several MB each.
 */
export function fileToCompressedDataUrl(file, { maxSize = 1000, quality = 0.85, watermarkText = "Astro Wala Shop" } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        // Draw the main image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Add Watermark
        if (watermarkText) {
          ctx.save();
          const fontSize = Math.max(14, Math.floor(width * 0.04)); // Responsive font size
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; // Semi-transparent white
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          
          // Add a subtle shadow for contrast against light images
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Position at bottom right with some padding
          const padding = fontSize;
          ctx.fillText(watermarkText, width - padding, height - padding);
          ctx.restore();
        }

        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
