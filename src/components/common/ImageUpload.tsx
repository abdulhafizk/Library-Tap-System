import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  User, 
  AlertCircle, 
  Check, 
  Link as LinkIcon, 
  Sparkles,
  Camera,
  RefreshCw
} from 'lucide-react';

interface PresetOption {
  label: string;
  url: string;
}

interface ImageUploadProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  maxSizeMB?: number;
  presetOptions?: PresetOption[];
  allowUrlInput?: boolean;
  shape?: 'circle' | 'rounded' | 'square';
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  id = 'image-upload',
  value = '',
  onChange,
  label = 'Foto Profil',
  helperText = 'Format: JPG, PNG, WEBP, GIF. Maksimal 10 MB per foto.',
  maxSizeMB = 10,
  presetOptions,
  allowUrlInput = true,
  shape = 'rounded',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to data URL (keeps high visual quality while staying safe for localStorage)
  const processImageFile = (file: File) => {
    setErrorMsg(null);

    // 1. Validate MIME type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File yang dipilih bukan gambar. Harap pilih file JPG, PNG, WEBP, atau GIF.');
      return;
    }

    // 2. Validate max file size (10 MB limit)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`Ukuran foto terlalu besar (${fileSizeMB} MB). Batas maksimum file adalah ${maxSizeMB} MB.`);
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file dari perangkat.');
      setIsProcessing(false);
    };

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessing(false);
        return;
      }

      // Optimize image dimensions on canvas to avoid blowing up localStorage
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 800; // max dimension for avatars & profile photos
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onChange(optimizedDataUrl);
        } else {
          onChange(result);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        onChange(result);
        setIsProcessing(false);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input value so re-uploading same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemovePhoto = () => {
    onChange('');
    setErrorMsg(null);
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setUrlDraft('');
      setShowUrlInput(false);
      setErrorMsg(null);
    }
  };

  const hasPhoto = Boolean(value && value.trim() !== '');

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-2xl',
    square: 'rounded-lg'
  }[shape];

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Label and Actions */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {allowUrlInput && (
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(!showUrlInput);
                if (!showUrlInput) setUrlDraft(value.startsWith('http') ? value : '');
              }}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{showUrlInput ? 'Tutup URL' : 'Input URL'}</span>
            </button>
          )}
          {hasPhoto && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-[11px] text-rose-600 dark:text-rose-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Foto</span>
            </button>
          )}
        </div>
      </div>

      {/* URL Input Bar (Toggled) */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* Upload Dropzone & Preview Box */}
      <div
        id={id}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20 scale-[1.01]'
            : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-900/50'
        }`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Thumbnail Preview / Icon */}
        <div className="relative shrink-0 group">
          {hasPhoto ? (
            <img
              src={value}
              alt="Preview foto"
              className={`w-20 h-20 object-cover ${shapeClasses} ring-2 ring-emerald-500/30 shadow-xs`}
            />
          ) : (
            <div
              className={`w-20 h-20 ${shapeClasses} bg-slate-200 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 ring-2 ring-slate-300 dark:ring-slate-700 shadow-xs`}
            >
              <User className="w-8 h-8 mb-0.5" />
              <span className="text-[9px] font-medium">Tanpa Foto</span>
            </div>
          )}

          {/* Hover Overlay Camera */}
          <div
            className={`absolute inset-0 bg-slate-900/60 ${shapeClasses} flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <Camera className="w-5 h-5" />
          </div>
        </div>

        {/* Upload Description & Call To Action */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UploadCloud className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isProcessing ? 'Memproses gambar...' : hasPhoto ? 'Ganti Foto dari Perangkat' : 'Pilih / Upload Foto dari Device'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            Klik untuk memilih file atau seret (drag & drop) gambar ke sini.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              <Check className="w-3 h-3" /> Maks. {maxSizeMB} MB
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
              JPG, PNG, WEBP, GIF
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Optional Preset Avatars list (for Users / Petugas) */}
      {presetOptions && presetOptions.length > 0 && (
        <div className="pt-1.5">
          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Atau pilih dari avatar preset:
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presetOptions.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(av.url);
                  setErrorMsg(null);
                }}
                className={`relative p-1 rounded-xl border transition-all text-center cursor-pointer ${
                  value === av.url
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <img
                  src={av.url}
                  alt={av.label}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover mx-auto"
                />
                <span className="block text-[9px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                  {av.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {helperText && !errorMsg && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
