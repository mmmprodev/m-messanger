import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface MediaLightboxProps {
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  imageUrl,
  imageName = 'photo.jpg',
  onClose
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = imageName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="w-full max-w-4xl flex items-center justify-between text-white py-2 px-4 bg-black/40 rounded-full backdrop-blur-md z-10"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-sm font-medium truncate max-w-xs">{imageName}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            title="Kattalashtirish"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            title="Kichiklashtirish"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            title="Burish"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            title="Yuklab olish"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-full transition-colors"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden my-4"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-h-[82vh] max-w-[90vw] object-contain transition-transform duration-200 cursor-grab active:cursor-grabbing rounded-lg shadow-2xl"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`
          }}
        />
      </div>

      {/* Footer Info */}
      <div className="text-white/60 text-xs">
        Kattalashtirish: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
