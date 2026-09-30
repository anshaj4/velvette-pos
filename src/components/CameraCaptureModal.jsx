import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Take a Picture"
}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back camera) or 'user'
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const fileInputRef = useRef(null);

  // Start video stream when open
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by browser. Use file upload.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Unable to access camera.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturedImage({
        file,
        previewUrl: URL.createObjectURL(blob)
      });
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleConfirm = () => {
    if (capturedImage?.file) {
      onCapture(capturedImage.file);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Fallback native mobile camera input
  const handleNativeCameraFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-card" style={{ maxWidth: 500, padding: 20, textAlign: 'center' }}>
        <button type="button" className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-main)' }}>
          {title}
        </h3>

        {/* Viewfinder or Preview */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(200px, 42vh, 320px)',
          background: '#190F16',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          {capturedImage ? (
            <img
              src={capturedImage.previewUrl}
              alt="Captured"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : cameraError ? (
            <div style={{ color: '#FFD4E5', padding: 20 }}>
              <AlertCircle size={36} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, margin: '0 0 12px 0' }}>{cameraError}</p>
              <button
                type="button"
                className="btn-checkout"
                style={{ width: 'auto', padding: '8px 16px', fontSize: 12, margin: '0 auto' }}
                onClick={() => fileInputRef.current?.click()}
              >
                Open Device Camera App
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Switch Camera Button (Front / Back) */}
          {!capturedImage && !cameraError && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <RefreshCw size={12} />
              <span>Flip</span>
            </button>
          )}
        </div>

        {/* Hidden native input for mobile fallback */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraFile}
          style={{ display: 'none' }}
        />

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {capturedImage ? (
            <>
              <button
                type="button"
                className="nav-tab-btn"
                style={{ border: '1px solid var(--border-soft)', padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700 }}
                onClick={handleRetake}
              >
                Retake
              </button>
              <button
                type="button"
                className="btn-checkout"
                style={{ width: 'auto', padding: '10px 24px', fontSize: 13 }}
                onClick={handleConfirm}
              >
                <Check size={16} />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              {!cameraError && (
                <button
                  type="button"
                  className="btn-checkout"
                  style={{ width: 'auto', padding: '10px 28px', fontSize: 14 }}
                  onClick={handleSnap}
                >
                  <Camera size={18} />
                  <span>Snap Photo</span>
                </button>
              )}
              <button
                type="button"
                className="nav-tab-btn"
                style={{ border: '1px solid var(--border-soft)', padding: '10px 18px', borderRadius: 24, fontSize: 12 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Camera App / Files
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
