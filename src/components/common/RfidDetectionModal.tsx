import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Radio, 
  Smartphone, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Sparkles,
  Zap,
  RotateCcw,
  Search,
  Check
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student, RfidCard } from '../../types';
import { soundManager } from '../../utils/audio';
import { CameraScannerModal } from './CameraScannerModal';

interface RfidDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
}

export const RfidDetectionModal: React.FC<RfidDetectionModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent
}) => {
  const { students, cards } = useLibrary();

  const [inputUid, setInputUid] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successStudent, setSuccessStudent] = useState<Student | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  // Web NFC
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [nfcNotice, setNfcNotice] = useState<string | null>(null);
  const nfcAbortRef = useRef<AbortController | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Match and resolve student from UID / input
  const processUidMatch = useCallback((rawUid: string): boolean => {
    if (!rawUid.trim()) return false;
    const clean = rawUid.trim().toUpperCase();

    // 1. Direct card match
    const matchedCard = cards.find(c => c.uid.toUpperCase() === clean);
    if (matchedCard && matchedCard.student_id) {
      const std = students.find(s => s.id === matchedCard.student_id || s.nis === matchedCard.student_id);
      if (std) {
        soundManager.playSuccess();
        setSuccessStudent(std);
        setErrorMessage(null);
        setTimeout(() => {
          onSelectStudent(std);
          onClose();
        }, 600);
        return true;
      }
    }

    // 2. Student rfid_uid match
    const stdByRfid = students.find(s => s.rfid_uid && s.rfid_uid.toUpperCase() === clean);
    if (stdByRfid) {
      soundManager.playSuccess();
      setSuccessStudent(stdByRfid);
      setErrorMessage(null);
      setTimeout(() => {
        onSelectStudent(stdByRfid);
        onClose();
      }, 600);
      return true;
    }

    // 3. NIS match
    const stdByNis = students.find(s => s.nis.toUpperCase() === clean);
    if (stdByNis) {
      soundManager.playSuccess();
      setSuccessStudent(stdByNis);
      setErrorMessage(null);
      setTimeout(() => {
        onSelectStudent(stdByNis);
        onClose();
      }, 600);
      return true;
    }

    // 4. Fallback: Digits-only match (e.g. RFID-202407001 vs 202407001)
    const cleanDigits = clean.replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      const stdByDigits = students.find(s => 
        s.nis.includes(cleanDigits) || 
        (s.rfid_uid && s.rfid_uid.replace(/\D/g, '') === cleanDigits)
      );
      if (stdByDigits) {
        soundManager.playSuccess();
        setSuccessStudent(stdByDigits);
        setErrorMessage(null);
        setTimeout(() => {
          onSelectStudent(stdByDigits);
          onClose();
        }, 600);
        return true;
      }
    }

    soundManager.playError();
    setErrorMessage(`Kartu RFID "${clean}" belum terdaftar atau tidak terhubung ke santri.`);
    return false;
  }, [cards, students, onSelectStudent, onClose]);

  // Start NFC
  const startNfc = useCallback(async () => {
    if (!('NDEFReader' in window)) return;
    try {
      if (nfcAbortRef.current) nfcAbortRef.current.abort();
      nfcAbortRef.current = new AbortController();

      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan({ signal: nfcAbortRef.current.signal });
      setIsNfcActive(true);
      setNfcNotice('Sensor NFC Aktif: Tempelkan kartu santri di bagian belakang perangkat.');

      ndef.addEventListener('reading', (event: any) => {
        let detected = event.serialNumber || '';
        if (event.message?.records?.length > 0) {
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              try {
                const decoder = new TextDecoder(record.encoding || 'utf-8');
                const t = decoder.decode(record.data);
                if (t && t.trim()) {
                  detected = t.trim();
                  break;
                }
              } catch {
                // ignore
              }
            }
          }
        }
        if (detected) {
          setInputUid(detected);
          processUidMatch(detected);
        }
      });
    } catch (err: any) {
      setIsNfcActive(false);
      if (err.name === 'NotAllowedError') {
        setNfcNotice('Izin akses NFC belum diberikan.');
      } else {
        setNfcNotice(null);
      }
    }
  }, [processUidMatch]);

  const stopNfc = useCallback(() => {
    if (nfcAbortRef.current) {
      nfcAbortRef.current.abort();
      nfcAbortRef.current = null;
    }
    setIsNfcActive(false);
  }, []);

  // On open
  useEffect(() => {
    if (isOpen) {
      setInputUid('');
      setErrorMessage(null);
      setSuccessStudent(null);
      const hasNfc = 'NDEFReader' in window;
      setIsNfcSupported(hasNfc);
      if (hasNfc) {
        startNfc();
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      stopNfc();
    }
    return () => {
      stopNfc();
    };
  }, [isOpen, startNfc, stopNfc]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUid.trim()) return;
    processUidMatch(inputUid);
  };

  const handleCameraScan = (scannedCode: string) => {
    setInputUid(scannedCode);
    processUidMatch(scannedCode);
  };

  // Quick students filter
  const filteredStudents = students
    .filter(s => s.status === 'active' && (
      !searchStudent.trim() ||
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nis.includes(searchStudent) ||
      s.class.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (s.rfid_uid && s.rfid_uid.toLowerCase().includes(searchStudent.toLowerCase()))
    ))
    .slice(0, 6);

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm cursor-pointer"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base">Deteksi Kartu RFID Santri</h3>
                <p className="text-xs text-blue-100">Tempelkan kartu pada scanner atau cari data santri</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200">
            {/* Success state */}
            {successStudent && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center gap-3 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Santri Ditemukan!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {successStudent.name} (NIS: {successStudent.nis}) • Kelas {successStudent.class}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !successStudent && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Radar Animation / Scanner Listening Box */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-b from-blue-50/80 to-indigo-50/40 dark:from-slate-800/80 dark:to-slate-800/30 border border-blue-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-ping absolute" />
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 z-10">
                  <Radio className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Menunggu Tempelan Kartu RFID...
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
                Dekatkan kartu ke USB RFID Reader atau ketik nomor kartu/NIS di bawah.
              </p>

              {nfcNotice && (
                <div className="mt-3 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
                  <Smartphone className="w-3.5 h-3.5" />
                  {nfcNotice}
                </div>
              )}
            </div>

            {/* Scanner Input & Camera QR Action */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                UID Kartu / Nomor NIS / Scan
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Radio className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputUid}
                    onChange={(e) => {
                      setInputUid(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Tempelkan kartu pada scanner USB..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputUid.trim()}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors shrink-0"
                >
                  Periksa
                </button>
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="px-3 py-2.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shrink-0"
                  title="Scan QR Code Santri dengan Kamera"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan Kamera</span>
                </button>
              </div>
            </form>

            {/* Quick Santri Picker (Alternative / Testing) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Pilih Cepat Santri Terdaftar
                </span>
                <span className="text-[10px] text-slate-400">Klik untuk langsung memilih</span>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter nama santri atau kelas..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {filteredStudents.map(student => (
                  <button
                    type="button"
                    key={student.id}
                    onClick={() => {
                      soundManager.playSuccess();
                      setSuccessStudent(student);
                      setTimeout(() => {
                        onSelectStudent(student);
                        onClose();
                      }, 400);
                    }}
                    className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {student.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        NIS: {student.nis} • {student.class}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white font-medium shrink-0">
                      Pilih
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Camera Scanner for Student QR / Barcode */}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScan={handleCameraScan}
        title="Scan QR / Barcode Kartu Santri"
        description="Arahkan kamera ke QR Code pada kartu perpustakaan santri"
        placeholder="Ketik UID / NIS santri..."
      />
    </>
  );
};
