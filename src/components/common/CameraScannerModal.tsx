import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Camera, 
  SwitchCamera, 
  Flashlight, 
  FlashlightOff, 
  ScanLine, 
  AlertCircle, 
  RefreshCw,
  CheckCircle2,
  Barcode
} from 'lucide-react';
import jsQR from 'jsqr';
import { soundManager } from '../../utils/audio';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedCode: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode / QR Code',
  description = 'Arahkan kamera ke barcode atau QR code pada buku / kartu',
  placeholder = 'Atau ketik kode secara manual...'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScannedRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);

  // Stop camera tracks and scanning loop
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Enumerate video devices
  const refreshCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
      }
    } catch (e) {
      console.warn('Enumerate devices error:', e);
    }
  }, []);

  // Start Camera
  const startCamera = useCallback(async (customDeviceId?: string, customFacing?: 'environment' | 'user') => {
    try {
      stopCamera();
      setCameraError(null);
      setIsCameraActive(false);
      setLastScannedResult(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Browser ini tidak mendukung akses kamera langsung. Silakan gunakan input manual di bawah.');
        return;
      }

      const targetFacing = customFacing || facingMode;
      const targetDeviceId = customDeviceId !== undefined ? customDeviceId : selectedCameraId;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: targetDeviceId 
          ? { deviceId: { exact: targetDeviceId } }
          : {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check torch capabilities
      const track = stream.getVideoTracks()[0];
      if (track && typeof (track as any).getCapabilities === 'function') {
        const caps = (track as any).getCapabilities();
        setHasTorch(Boolean(caps?.torch));
      } else {
        setHasTorch(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      await refreshCameras();

      // Native BarcodeDetector if available
      let nativeBarcodeDetector: any = null;
      if ('BarcodeDetector' in window) {
        try {
          nativeBarcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf']
          });
        } catch {
          nativeBarcodeDetector = null;
        }
      }

      // Scanner animation loop
      const scanLoop = async () => {
        if (!videoRef.current || !streamRef.current) return;
        const video = videoRef.current;

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          const now = Date.now();
          if (now - lastScannedRef.current > 80) {
            lastScannedRef.current = now;

            let canvas = canvasRef.current;
            if (!canvas) {
              canvas = document.createElement('canvas');
              (canvasRef as any).current = canvas;
            }

            const maxDim = 640;
            let targetWidth = video.videoWidth;
            let targetHeight = video.videoHeight;
            if (targetWidth > maxDim || targetHeight > maxDim) {
              if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
                targetWidth = maxDim;
              } else {
                targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
                targetHeight = maxDim;
              }
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
              const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

              // 1. Scan QR with jsQR
              let detectedCode: string | null = null;
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });

              if (qrResult && qrResult.data && qrResult.data.trim()) {
                detectedCode = qrResult.data.trim();
              }

              // 2. Scan Barcode if BarcodeDetector is available
              if (!detectedCode && nativeBarcodeDetector) {
                try {
                  const barcodes = await nativeBarcodeDetector.detect(canvas);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    detectedCode = barcodes[0].rawValue.trim();
                  }
                } catch {
                  // ignore
                }
              }

              if (detectedCode) {
                soundManager.playScanBlip();
                if (navigator.vibrate) {
                  navigator.vibrate([80]);
                }
                setLastScannedResult(detectedCode);
                stopCamera();
                onScan(detectedCode);
                onClose();
                return;
              }
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(scanLoop);
      };

      animFrameRef.current = requestAnimationFrame(scanLoop);

    } catch (err: any) {
      stopCamera();
      const msg = err?.message || '';
      if (err.name === 'NotAllowedError' || msg.includes('denied')) {
        setCameraError('Izin akses kamera ditolak. Harap izinkan kamera pada browser.');
      } else if (err.name === 'NotFoundError' || msg.includes('found')) {
        setCameraError('Kamera tidak terdeteksi pada perangkat ini.');
      } else {
        setCameraError('Gagal membuka kamera: ' + (msg || 'Kesalahan perangkat keras'));
      }
    }
  }, [facingMode, selectedCameraId, stopCamera, refreshCameras, onScan, onClose]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn('Toggle torch failed', e);
      }
    }
  };

  // Flip Camera
  const flipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(undefined, nextFacing);
  };

  // Switch specific camera
  const handleSelectCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    startCamera(deviceId);
  };

  // Manual Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const clean = manualInput.trim();
    soundManager.playScanBlip();
    stopCamera();
    onScan(clean);
    onClose();
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setManualInput('');
      setLastScannedResult(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Canvas Area */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanner Overlay Frame */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Darkened edges */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-blue-400/70 rounded-2xl flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Laser animation line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce" />

                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                <div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] text-blue-300 font-medium flex items-center gap-1.5 border border-blue-500/30">
                  <ScanLine className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  Posisikan Barcode / QR di dalam kotak
                </div>
              </div>
            </div>
          )}

          {/* Camera Error / Loading state */}
          {!isCameraActive && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-sm font-semibold text-white">Menghubungkan Kamera...</p>
              <p className="text-xs text-slate-400 mt-1">Harap izinkan browser mengakses kamera</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-20">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-rose-300">{cameraError}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Anda tetap dapat memasukkan kode buku/kartu secara manual melalui formulir di bawah.
              </p>
              <button
                type="button"
                onClick={() => startCamera()}
                className="mt-4 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Buka Kamera Lagi
              </button>
            </div>
          )}

          {/* Quick Camera Action Controls (Torch, Flip, Device Switch) */}
          {isCameraActive && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                    isTorchOn 
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30' 
                      : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                  title={isTorchOn ? "Matikan Flash" : "Nyalakan Flash"}
                >
                  {isTorchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={flipCamera}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 backdrop-blur-md transition-colors"
                title="Balik Kamera (Depan/Belakang)"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Camera Selector (if multiple available) */}
        {availableCameras.length > 1 && (
          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400 shrink-0">Pilih Kamera:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => handleSelectCamera(e.target.value)}
              className="w-full text-xs py-1 px-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Kamera Default ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</option>
              {availableCameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `Kamera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Manual Input Fallback Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 text-slate-100 border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
            >
              Gunakan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
