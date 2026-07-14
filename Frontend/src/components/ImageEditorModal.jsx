import React, { useState, useRef, useEffect } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { X, Check, RotateCw, ZoomIn, ZoomOut, Move, Crop } from "lucide-react";

export default function ImageEditorModal({ imageSrc, onSave, onCancel, defaultAspect = 1 }) {
  const cropperRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState(defaultAspect);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize cropper aspect ratio if it's not 'original'
  const initialAspectRatio = defaultAspect === 'original' ? NaN : defaultAspect;

  const handleSave = () => {
    if (typeof cropperRef.current?.cropper !== "undefined") {
      setIsProcessing(true);
      const canvas = cropperRef.current.cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
        fillColor: "#fff",
      });
      if (!canvas) {
        setIsProcessing(false);
        return;
      }

      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        onSave(croppedFile);
      }, "image/jpeg", 0.95);
    }
  };

  const setDragMode = (mode) => {
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.setDragMode(mode);
    }
  };

  const rotateImage = () => {
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.rotate(90);
    }
  };

  const zoomImage = (ratio) => {
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.zoom(ratio);
    }
  };

  useEffect(() => {
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.setAspectRatio(aspectRatio === 'original' ? NaN : aspectRatio);
    }
  }, [aspectRatio]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col overflow-hidden h-[90vh] md:h-[650px]">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Edit Photo</h2>
          <button onClick={onCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
          <Cropper
            ref={cropperRef}
            style={{ height: "100%", width: "100%" }}
            initialAspectRatio={initialAspectRatio}
            src={imageSrc}
            viewMode={0}
            minCropBoxHeight={10}
            minCropBoxWidth={10}
            background={true}
            responsive={true}
            autoCropArea={1}
            checkOrientation={false}
            guides={true}
            crossOrigin="anonymous"
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t bg-gray-50 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium mr-1 hidden sm:inline">Tools:</span>
              <button onClick={() => setDragMode("move")} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors" title="Move Image">
                <Move size={16} />
              </button>
              <button onClick={() => setDragMode("crop")} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors" title="Crop Mode">
                <Crop size={16} />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={() => zoomImage(0.1)} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors" title="Zoom In">
                <ZoomIn size={16} />
              </button>
              <button onClick={() => zoomImage(-0.1)} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors" title="Zoom Out">
                <ZoomOut size={16} />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={rotateImage} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors" title="Rotate 90°">
                <RotateCw size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium mr-1 hidden sm:inline">Format:</span>
              <button onClick={() => setAspectRatio('original')} className={`px-2 py-1 text-xs rounded transition-colors ${aspectRatio === 'original' ? 'bg-brand text-white font-medium shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Free / Original</button>
              <button onClick={() => setAspectRatio(1)} className={`px-2 py-1 text-xs rounded transition-colors ${aspectRatio === 1 ? 'bg-brand text-white font-medium shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>1:1 (Square)</button>
              <button onClick={() => setAspectRatio(4/3)} className={`px-2 py-1 text-xs rounded transition-colors ${aspectRatio === 4/3 ? 'bg-brand text-white font-medium shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>4:3</button>
              <button onClick={() => setAspectRatio(16/9)} className={`px-2 py-1 text-xs rounded transition-colors ${aspectRatio === 16/9 ? 'bg-brand text-white font-medium shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>16:9 (Wide)</button>
              <button onClick={() => setAspectRatio(21/9)} className={`px-2 py-1 text-xs rounded transition-colors ${aspectRatio === 21/9 ? 'bg-brand text-white font-medium shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>21:9 (Banner)</button>
              <button onClick={() => setAspectRatio(3)} className={`px-2 py-1 text-xs rounded transition-colors ${aspectRatio === 3 ? 'bg-brand text-white font-medium shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>3:1 (Ultra Wide)</button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
            <button onClick={onCancel} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-white bg-brand rounded hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-sm">
              {isProcessing ? "Processing..." : <><Check size={16} /> Save & Compress</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
