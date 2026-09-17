import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Radio,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  Zap,
  ListOrdered,
  Search,
  Check,
  User,
  Smartphone,
  Copy,
  Trash2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student, RfidCard } from '../../types';
import { soundManager } from '../../utils/audio';

interface RfidMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassFilter?: string;
  initialOnlyUnmapped?: boolean;
}

type MappingTab = 'rapid_scan' | 'batch_table' | 'import_text';

export const RfidMappingModal: React.FC<RfidMappingModalProps> = ({
  isOpen,
  onClose,
  initialClassFilter = 'all',
  initialOnlyUnmapped = false
}) => {
  const {
    students,
    cards,
    linkCardToStudent,
    batchLinkCardsToStudents,
    batchUnlinkCardsFromStudents,
    settings
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<MappingTab>('rapid_scan');

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>(initialClassFilter);
  const [onlyUnmapped, setOnlyUnmapped] = useState<boolean>(initialOnlyUnmapped);
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------------------------
  // TAB 1: Rapid Scan State
  // ----------------------------------------------------------------------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rapidInputUid, setRapidInputUid] = useState('');
  const [rapidSuccessMessage, setRapidSuccessMessage] = useState<string | null>(null);
  const [rapidConflictWarning, setRapidConflictWarning] = useState<{
    uid: string;
    existingStudent: Student;
  } | null>(null);
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const rapidInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------------------
  // TAB 2: Batch Table State (Inline Edits)
  // ----------------------------------------------------------------------
  const [tableUids, setTableUids] = useState<Record<string, string>>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isSavingTable, setIsSavingTable] = useState(false);

  // ----------------------------------------------------------------------
  // TAB 3: Text / CSV Import State
  // ----------------------------------------------------------------------
  const [importRawText, setImportRawText] = useState('');
  const [importDelimiter, setImportDelimiter] = useState<'auto' | 'comma' | 'tab' | 'semicolon'>('auto');

  // Classes list
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.class))).sort();
  }, [students]);

  // Unassigned cards in inventory
  const unassignedCards = useMemo(() => {
    const assignedUids = new Set(
      students.filter(s => s.rfid_uid).map(s => s.rfid_uid!.toUpperCase())
    );
    return cards.filter(
      c => !c.student_id && !assignedUids.has(c.uid.toUpperCase()) && c.status === 'active'
    );
  }, [cards, students]);

  // Filtered queue of students for mapping
  const queueStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass === 'all' || s.class === selectedClass;
      const matchesMapped = onlyUnmapped ? !s.rfid_uid : true;
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        (s.rfid_uid && s.rfid_uid.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesClass && matchesMapped && matchesSearch;
    });
  }, [students, selectedClass, onlyUnmapped, searchQuery]);

  // Reset index when queue changes
  useEffect(() => {
    if (currentIndex >= queueStudents.length) {
      setCurrentIndex(Math.max(0, queueStudents.length - 1));
    }
  }, [queueStudents.length, currentIndex]);

  // Focus input automatically in Rapid Scan Mode
  useEffect(() => {
    if (isOpen && activeTab === 'rapid_scan') {
      const timer = setTimeout(() => {
        rapidInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, currentIndex]);

  // Sync initial batch table values
  useEffect(() => {
    const initialMap: Record<string, string> = {};
    students.forEach(s => {
      initialMap[s.id] = s.rfid_uid || '';
    });
    setTableUids(initialMap);
  }, [students, isOpen]);

  const currentStudent: Student | undefined = queueStudents[currentIndex];

  // Overall Statistics
  const totalStudentsCount = students.length;
  const mappedStudentsCount = students.filter(s => s.rfid_uid && s.rfid_uid.trim() !== '').length;
  const unmappedStudentsCount = totalStudentsCount - mappedStudentsCount;
  const progressPercent = totalStudentsCount > 0 ? Math.round((mappedStudentsCount / totalStudentsCount) * 100) : 0;

  // ----------------------------------------------------------------------
  // RAPID SCAN HANDLERS
  // ----------------------------------------------------------------------
  const handleRapidSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentStudent) return;

    const rawUid = rapidInputUid.trim().toUpperCase();
    if (!rawUid) return;

    // Check if card is currently assigned to another student
    const existingOtherStudent = students.find(
      s => s.id !== currentStudent.id && s.rfid_uid && s.rfid_uid.toUpperCase() === rawUid
    );

    if (existingOtherStudent) {
      setRapidConflictWarning({
        uid: rawUid,
        existingStudent: existingOtherStudent
      });
      return;
    }

    applyRapidMapping(rawUid);
  };

  const applyRapidMapping = (uidToApply: string) => {
    if (!currentStudent) return;

    const success = linkCardToStudent(currentStudent.id, uidToApply);
    if (success) {
      if (settings.sound_enabled) {
        soundManager.playCheckInSound();
      }
      setRapidSuccessMessage(`Kartu ${uidToApply} berhasil dihubungkan ke ${currentStudent.name}!`);
      setRapidConflictWarning(null);
      setRapidInputUid('');

      // Auto clear message and advance
      setTimeout(() => {
        setRapidSuccessMessage(null);
        if (currentIndex < queueStudents.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }, 800);
    }
  };

  const handleConfirmConflictTransfer = () => {
    if (rapidConflictWarning) {
      applyRapidMapping(rapidConflictWarning.uid);
    }
  };

  const handleRapidAutoGenerate = () => {
    if (!currentStudent) return;
    const generatedUid = `RFID-${currentStudent.nis.trim().toUpperCase()}`;
    applyRapidMapping(generatedUid);
  };

  const handleRapidSkip = () => {
    setRapidConflictWarning(null);
    setRapidInputUid('');
    setRapidSuccessMessage(null);
    if (currentIndex < queueStudents.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRapidPrev = () => {
    setRapidConflictWarning(null);
    setRapidInputUid('');
    setRapidSuccessMessage(null);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Smartphone Web NFC Scanner Integration
  const startNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      setNfcError('Web NFC tidak didukung pada browser ini. Buka aplikasi di Google Chrome Android via HTTPS.');
      return;
    }

    try {
      setNfcError(null);
      setIsNfcActive(true);
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan();

      ndef.addEventListener('reading', (event: any) => {
        const uid = (event.serialNumber || '').toUpperCase();
        if (uid) {
          if (navigator.vibrate) navigator.vibrate(100);
          setRapidInputUid(uid);
          if (currentStudent) {
            applyRapidMapping(uid);
          }
        }
      });
    } catch (err: any) {
      setIsNfcActive(false);
      const errMsg = err?.message || '';
      if (err.name === 'SecurityError' || errMsg.includes('top-level')) {
        setNfcError('Fitur NFC HP mengharuskan aplikasi dibuka langsung di tab browser baru (bukan iframe).');
      } else if (err.name === 'NotAllowedError') {
        setNfcError('Izin akses sensor NFC HP ditolak pengguna.');
      } else {
        setNfcError(errMsg || 'Gagal menyalakan sensor NFC.');
      }
    }
  };

  // ----------------------------------------------------------------------
  // BATCH TABLE HANDLERS
  // ----------------------------------------------------------------------
  const handleTableUidChange = (studentId: string, value: string) => {
    setTableUids(prev => ({
      ...prev,
      [studentId]: value.toUpperCase()
    }));
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === queueStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(queueStudents.map(s => s.id)));
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleBulkAutoGenerate = () => {
    const targetStudents = selectedStudentIds.size > 0
      ? queueStudents.filter(s => selectedStudentIds.has(s.id))
      : queueStudents.filter(s => !tableUids[s.id] || tableUids[s.id].trim() === '');

    const nextUids = { ...tableUids };
    targetStudents.forEach(s => {
      nextUids[s.id] = `RFID-${s.nis.trim().toUpperCase()}`;
    });
    setTableUids(nextUids);
  };

  const handleBulkClearSelected = () => {
    if (selectedStudentIds.size === 0) return;
    const nextUids = { ...tableUids };
    selectedStudentIds.forEach(id => {
      nextUids[id] = '';
    });
    setTableUids(nextUids);
  };

  const handleSaveBatchTable = () => {
    setIsSavingTable(true);
    const mappingsToSave: Array<{ studentId: string; cardUid: string }> = [];
    const unlinksToPerform: string[] = [];

    students.forEach(s => {
      const newUid = (tableUids[s.id] || '').trim().toUpperCase();
      const currentUid = (s.rfid_uid || '').trim().toUpperCase();

      if (newUid !== currentUid) {
        if (newUid === '') {
          unlinksToPerform.push(s.id);
        } else {
          mappingsToSave.push({ studentId: s.id, cardUid: newUid });
        }
      }
    });

    if (unlinksToPerform.length > 0) {
      batchUnlinkCardsFromStudents(unlinksToPerform);
    }

    if (mappingsToSave.length > 0) {
      batchLinkCardsToStudents(mappingsToSave);
    }

    if (settings.sound_enabled) {
      soundManager.playCheckInSound();
    }

    setIsSavingTable(false);
  };

  // ----------------------------------------------------------------------
  // TEXT / CSV IMPORT PARSER & HANDLERS
  // ----------------------------------------------------------------------
  interface ParsedImportRow {
    rawLine: string;
    nis: string;
    uid: string;
    student?: Student;
    status: 'matched' | 'student_not_found' | 'invalid_format' | 'duplicate_uid';
    errorMessage?: string;
  }

  const parsedImportRows = useMemo<ParsedImportRow[]>(() => {
    if (!importRawText.trim()) return [];

    const lines = importRawText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const results: ParsedImportRow[] = [];
    const seenUids = new Set<string>();

    const nisStudentMap = new Map<string, Student>();
    students.forEach(s => {
      nisStudentMap.set(s.nis.trim(), s);
    });

    lines.forEach(line => {
      // Determine delimiter
      let parts: string[] = [];
      if (importDelimiter === 'tab' || (importDelimiter === 'auto' && line.includes('\t'))) {
        parts = line.split('\t');
      } else if (importDelimiter === 'semicolon' || (importDelimiter === 'auto' && line.includes(';'))) {
        parts = line.split(';');
      } else {
        parts = line.split(',');
      }

      parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length < 2) {
        results.push({
          rawLine: line,
          nis: parts[0] || '',
          uid: '',
          status: 'invalid_format',
          errorMessage: 'Format tidak lengkap (harus ada NIS dan UID)'
        });
        return;
      }

      // If format is NIS, Name, UID (3 columns) -> take parts[0] and parts[2]
      let parsedNis = parts[0];
      let parsedUid = parts[parts.length - 1].toUpperCase();

      if (parts.length >= 3 && !parts[1].match(/^[0-9]+$/)) {
        // parts[1] is name, parts[2] is UID
        parsedUid = parts[parts.length - 1].toUpperCase();
      }

      const matchedStudent = nisStudentMap.get(parsedNis);

      if (!matchedStudent) {
        results.push({
          rawLine: line,
          nis: parsedNis,
          uid: parsedUid,
          status: 'student_not_found',
          errorMessage: `NIS "${parsedNis}" tidak ditemukan di database`
        });
        return;
      }

      if (seenUids.has(parsedUid)) {
        results.push({
          rawLine: line,
          nis: parsedNis,
          uid: parsedUid,
          student: matchedStudent,
          status: 'duplicate_uid',
          errorMessage: `UID "${parsedUid}" duplikat dalam teks impor`
        });
        return;
      }

      seenUids.add(parsedUid);

      results.push({
        rawLine: line,
        nis: parsedNis,
        uid: parsedUid,
        student: matchedStudent,
        status: 'matched'
      });
    });

    return results;
  }, [importRawText, importDelimiter, students]);

  const validImportCount = parsedImportRows.filter(r => r.status === 'matched').length;

  const handleApplyImport = () => {
    const validMappings = parsedImportRows
      .filter(r => r.status === 'matched' && r.student)
      .map(r => ({
        studentId: r.student!.id,
        cardUid: r.uid
      }));

    if (validMappings.length === 0) return;

    batchLinkCardsToStudents(validMappings);
    if (settings.sound_enabled) {
      soundManager.playCheckInSound();
    }
    setImportRawText('');
    setActiveTab('batch_table');
  };

  const handleInsertSampleImport = () => {
    const sampleStudents = students.slice(0, 5);
    const sampleText = sampleStudents
      .map((s, idx) => `${s.nis}, ${s.name}, CARD-${s.nis}`)
      .join('\n');
    setImportRawText(sampleText);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full h-[92vh] max-h-[850px] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 cursor-default overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Pemetaan Kartu RFID Santri Massal
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[11px] font-semibold">
                  Batch Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Hubungkan UID kartu RFID fisik ke santri dengan pemindaian berurutan, tabel massal, atau impor data CSV.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Stats & Progress Bar */}
        <div className="px-5 py-3 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Total Santri:</span>
              <span className="font-bold text-slate-800 dark:text-white">{totalStudentsCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Sudah Terhubung:</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">{mappedStudentsCount} ({progressPercent}%)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between">
              <span className="text-amber-700 dark:text-amber-400 font-medium">Belum Ada Kartu:</span>
              <span className="font-bold text-amber-800 dark:text-amber-300">{unmappedStudentsCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-400 font-medium">Kartu Cadangan:</span>
              <span className="font-bold text-blue-800 dark:text-blue-300">{unassignedCards.length}</span>
            </div>
          </div>

          {/* Progress Visual Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 py-2">
            <button
              onClick={() => setActiveTab('rapid_scan')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rapid_scan'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Scan Berurutan (Rapid Tap)</span>
            </button>

            <button
              onClick={() => setActiveTab('batch_table')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'batch_table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Tabel Massal (Multi-Santri)</span>
            </button>

            <button
              onClick={() => setActiveTab('import_text')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'import_text'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Impor Teks / CSV</span>
            </button>
          </div>

          {/* Quick Filter Controls for Current View */}
          <div className="flex items-center gap-2 py-2">
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setCurrentIndex(0);
              }}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium select-none cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={onlyUnmapped}
                onChange={e => {
                  setOnlyUnmapped(e.target.checked);
                  setCurrentIndex(0);
                }}
                className="w-3.5 h-3.5 rounded-sm text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"
              />
              <span>Hanya Belum Ada Kartu</span>
            </label>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-900/50">
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: RAPID SCAN (TAP BERURUTAN)                             */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'rapid_scan' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {queueStudents.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Semua Santri Pada Filter Ini Sudah Terhubung!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Seluruh santri dalam filter yang dipilih telah memiliki kartu RFID. Anda dapat mengubah filter kelas atau mematikan opsi "Hanya Belum Ada Kartu".
                  </p>
                  <button
                    onClick={() => {
                      setOnlyUnmapped(false);
                      setSelectedClass('all');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Tampilkan Semua Santri
                  </button>
                </div>
              ) : currentStudent ? (
                <div className="space-y-4">
                  {/* Step & Queue Tracker */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">
                      Antrean Pemetaan: <strong className="text-slate-800 dark:text-white">{currentIndex + 1}</strong> dari {queueStudents.length} santri
                    </span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      Kelas: {currentStudent.class}
                    </span>
                  </div>

                  {/* Active Student Target Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/40 dark:border-emerald-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-12 -mt-12 pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                      {/* Photo */}
                      {currentStudent.photo_url ? (
                        <img
                          src={currentStudent.photo_url}
                          alt={currentStudent.name}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-emerald-500/20 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 ring-4 ring-emerald-500/20 shadow-md shrink-0">
                          <User className="w-12 h-12" />
                        </div>
                      )}

                      {/* Info & Scanner Input */}
                      <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {currentStudent.name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-xs border border-indigo-100 dark:border-indigo-900">
                            Kelas {currentStudent.class}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>NIS: <strong className="font-mono text-slate-700 dark:text-slate-300">{currentStudent.nis}</strong></span>
                          <span>•</span>
                          <span>Gender: <strong>{currentStudent.gender === 'L' ? 'Laki-laki (Putra)' : 'Perempuan (Putri)'}</strong></span>
                          <span>•</span>
                          <span>Status Kartu: {currentStudent.rfid_uid ? (
                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{currentStudent.rfid_uid}</strong>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">Belum Ada Kartu</span>
                          )}</span>
                        </div>

                        {/* Fast Input / RFID Reader Target Box */}
                        <form onSubmit={handleRapidSubmit} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          <div className="relative">
                            <input
                              ref={rapidInputRef}
                              type="text"
                              value={rapidInputUid}
                              onChange={e => setRapidInputUid(e.target.value.toUpperCase())}
                              placeholder="Tempelkan kartu fisik pada scanner USB / ketik UID..."
                              className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/50 dark:border-emerald-500/40 text-slate-800 dark:text-white font-mono text-sm sm:text-base font-bold placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 shadow-inner"
                              autoFocus
                            />
                            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                            <button
                              type="submit"
                              disabled={!rapidInputUid.trim()}
                              className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              Hubungkan
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleRapidAutoGenerate}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Format Otomatis: RFID-{currentStudent.nis}</span>
                              </button>

                              <button
                                type="button"
                                onClick={startNfcScan}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Scan NFC HP</span>
                              </button>
                            </div>

                            {/* Pick from unassigned inventory cards */}
                            {unassignedCards.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <span>Pilih Cadangan:</span>
                                <select
                                  onChange={e => {
                                    if (e.target.value) {
                                      setRapidInputUid(e.target.value);
                                      applyRapidMapping(e.target.value);
                                    }
                                  }}
                                  value=""
                                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                                >
                                  <option value="">Pilih UID ({unassignedCards.length})</option>
                                  {unassignedCards.map(c => (
                                    <option key={c.id} value={c.uid}>
                                      {c.uid} {c.note ? `(${c.note})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Feedback Messages */}
                    {rapidSuccessMessage && (
                      <div className="mt-4 p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{rapidSuccessMessage}</span>
                      </div>
                    )}

                    {rapidConflictWarning && (
                      <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-2 animate-in fade-in">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">
                              Kartu ({rapidConflictWarning.uid}) sudah terhubung ke santri lain:
                            </p>
                            <p className="mt-0.5">
                              <strong>{rapidConflictWarning.existingStudent.name}</strong> (NIS: {rapidConflictWarning.existingStudent.nis} • Kelas {rapidConflictWarning.existingStudent.class})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                          <button
                            type="button"
                            onClick={() => setRapidConflictWarning(null)}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmConflictTransfer}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                          >
                            Alihkan Kartu ke {currentStudent.name}
                          </button>
                        </div>
                      </div>
                    )}

                    {nfcError && (
                      <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{nfcError}</span>
                      </div>
                    )}
                  </div>

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleRapidPrev}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRapidSkip}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Lewati Santri Ini
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentIndex < queueStudents.length - 1) {
                            setCurrentIndex(prev => prev + 1);
                          } else {
                            onClose();
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{currentIndex === queueStudents.length - 1 ? 'Selesai' : 'Lanjut ke Berikutnya'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mini Queue Preview Carousel Strip */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Daftar Antrean Santri:
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {queueStudents.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setCurrentIndex(idx);
                            setRapidConflictWarning(null);
                            setRapidSuccessMessage(null);
                            setRapidInputUid('');
                          }}
                          className={`px-3 py-2 rounded-xl text-left border shrink-0 transition-all cursor-pointer min-w-[140px] ${
                            idx === currentIndex
                              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                            {s.rfid_uid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                            )}
                          </div>
                          <p className="font-bold text-xs text-slate-800 dark:text-white truncate mt-0.5">
                            {s.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {s.rfid_uid || 'Belum ada'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: BATCH TABLE (MULTI-SANTRI INLINE EDITOR)                */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'batch_table' && (
            <div className="space-y-4">
              {/* Batch Action Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari nama, NIS, UID..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleBulkAutoGenerate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Generate UID ({selectedStudentIds.size > 0 ? `${selectedStudentIds.size} Terpilih` : 'Yang Kosong'})</span>
                  </button>

                  {selectedStudentIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkClearSelected}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kosongkan ({selectedStudentIds.size})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveBatchTable}
                    disabled={isSavingTable}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Semua Perubahan</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[480px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
                      <tr className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={queueStudents.length > 0 && selectedStudentIds.size === queueStudents.length}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </th>
                        <th className="py-3 px-3 w-12 text-center">No</th>
                        <th className="py-3 px-4">Santri</th>
                        <th className="py-3 px-3">NIS</th>
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-4">Input UID RFID (Editable)</th>
                        <th className="py-3 px-3">Aksi Cepat</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {queueStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            Tidak ada data santri yang sesuai kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        queueStudents.map((student, idx) => {
                          const currentVal = tableUids[student.id] || '';
                          const isChanged = currentVal !== (student.rfid_uid || '');
                          const isSelected = selectedStudentIds.has(student.id);

                          return (
                            <tr
                              key={student.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectStudent(student.id)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  {student.photo_url ? (
                                    <img
                                      src={student.photo_url}
                                      alt={student.name}
                                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                      <User className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                                      {student.name}
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                      {student.gender === 'L' ? 'Putra' : 'Putri'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                                {student.nis}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px]">
                                  {student.class}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={currentVal}
                                    onChange={e => handleTableUidChange(student.id, e.target.value)}
                                    placeholder="Ketik UID / Tap Scanner..."
                                    className={`w-full py-1.5 pl-3 pr-3 text-xs rounded-xl font-mono border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                      isChanged
                                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
                                    }`}
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="Auto-Generate RFID-NIS"
                                    onClick={() => handleTableUidChange(student.id, `RFID-${student.nis.trim()}`)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>

                                  {unassignedCards.length > 0 && (
                                    <select
                                      title="Pilih dari Cadangan"
                                      onChange={e => {
                                        if (e.target.value) {
                                          handleTableUidChange(student.id, e.target.value);
                                        }
                                      }}
                                      value=""
                                      className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 max-w-[80px]"
                                    >
                                      <option value="">Pilih</option>
                                      {unassignedCards.map(c => (
                                        <option key={c.id} value={c.uid}>
                                          {c.uid}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {currentVal && (
                                    <button
                                      type="button"
                                      title="Kosongkan"
                                      onClick={() => handleTableUidChange(student.id, '')}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isChanged ? (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                                    Berubah
                                  </span>
                                ) : currentVal ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                    Aktif
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                                    Kosong
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: IMPORT TEXT / CSV (COPY-PASTE BATCH DATA)              */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'import_text' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      Salin & Tempel Data Pemetaan (Excel / CSV)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Format baris yang didukung: <code className="font-mono text-emerald-600">NIS, UID_KARTU</code> atau <code className="font-mono text-emerald-600">NIS, NAMA, UID_KARTU</code> (pemisah koma atau Tab).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleInsertSampleImport}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Contoh Format
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <textarea
                    rows={6}
                    value={importRawText}
                    onChange={e => setImportRawText(e.target.value)}
                    placeholder="Contoh:&#10;202407001, E28068940001&#10;202407002, Muhammad Rizky, E28068940002&#10;202407003, CARD-202407003"
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Live Match Preview Table */}
                {parsedImportRows.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Hasil Analisis Teks ({validImportCount} dari {parsedImportRows.length} baris valid)
                      </span>
                      {validImportCount > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Siap diterapkan ke database
                        </span>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold text-[10px] sticky top-0">
                          <tr>
                            <th className="py-2 px-3">NIS</th>
                            <th className="py-2 px-3">Nama Santri</th>
                            <th className="py-2 px-3">Kelas</th>
                            <th className="py-2 px-3 font-mono">UID Kartu</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {parsedImportRows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={
                                row.status === 'matched'
                                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                  : 'bg-rose-50/40 dark:bg-rose-950/20'
                              }
                            >
                              <td className="py-2 px-3 font-mono font-semibold">{row.nis || '-'}</td>
                              <td className="py-2 px-3 font-semibold">
                                {row.student ? row.student.name : <span className="text-rose-500 italic">Tidak ditemukan</span>}
                              </td>
                              <td className="py-2 px-3">
                                {row.student ? (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-[10px]">
                                    {row.student.class}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-white">
                                {row.uid || '-'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {row.status === 'matched' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    Valid
                                  </span>
                                ) : (
                                  <span
                                    title={row.errorMessage}
                                    className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]"
                                  >
                                    Error
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleApplyImport}
                        disabled={validImportCount === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Terapkan Pemetaan ({validImportCount} Santri)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Close Button */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Gunakan reader RFID USB atau tempelkan kartu langsung untuk pemindaian otomatis tanpa perlu menekan tombol.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
