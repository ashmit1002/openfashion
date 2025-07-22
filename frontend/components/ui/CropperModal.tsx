import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

interface CropperModalProps {
  image: string;
  aspect?: number;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, croppedUrl: string) => void;
}

export default function CropperModal({ image, aspect = 3 / 4, open, onClose, onCropComplete }: CropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = (c: any) => setCrop(c);
  const onZoomChange = (z: number) => setZoom(z);
  const onCropAreaChange = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    const cropped = await getCroppedImg(image, croppedAreaPixels);
    setProcessing(false);
    if (cropped) {
      onCropComplete(cropped.blob, cropped.url);
      onClose();
    }
  }, [croppedAreaPixels, image, onCropComplete, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[90vw] max-w-lg flex flex-col items-center">
        <div className="relative w-full h-96 bg-gray-100 rounded">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
          />
        </div>
        <div className="flex gap-4 mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-meta-pink text-white hover:bg-meta-pink/90"
            onClick={handleCrop}
            disabled={processing}
          >
            {processing ? "Processing..." : "Crop & Use"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to crop image using canvas
async function getCroppedImg(imageSrc: string, crop: any): Promise<{ blob: Blob, url: string } | null> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );
      canvas.toBlob((blob) => {
        if (!blob) return reject('Failed to crop');
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      }, 'image/png');
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
} 