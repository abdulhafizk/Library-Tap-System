import { useState, useEffect, useCallback, useRef } from 'react';
import { useLibrary } from '../context/LibraryContext';

// Standard 60 minutes auto-logout, warning prompt at 50 minutes
export const IDLE_TOTAL_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes = 3,600,000 ms
export const IDLE_WARNING_THRESHOLD_MS = 50 * 60 * 1000; // 50 minutes = 3,000,000 ms
export const IDLE_WARNING_DURATION_MS = IDLE_TOTAL_TIMEOUT_MS - IDLE_WARNING_THRESHOLD_MS; // 10 minutes = 600,000 ms

const STORAGE_KEYS = {
  LAST_ACTIVITY: 'perpustakaan_session_last_activity',
  LOGOUT_REASON: 'perpustakaan_session_logout_reason',
  TEST_OFFSET: 'perpustakaan_session_test_offset',
};

export function useIdleSessionTimer() {
  const { isAuthenticated, currentUser, logout, pushNotification } = useLibrary();

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(IDLE_WARNING_DURATION_MS / 1000);
  const [totalIdleMinutes, setTotalIdleMinutes] = useState<number>(0);

  const lastActivityRef = useRef<number>(Date.now());
  const isWarningOpenRef = useRef<boolean>(false);
  isWarningOpenRef.current = isWarningOpen;

  // Reset the activity timestamp
  const recordActivity = useCallback((isExplicitExtension = false) => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
      localStorage.removeItem(STORAGE_KEYS.TEST_OFFSET);
    } catch {
      // ignore
    }

    if (isWarningOpenRef.current) {
      setIsWarningOpen(false);
      if (isExplicitExtension) {
        pushNotification(
          'Sesi Diperpanjang',
          'Sesi login Anda berhasil diperpanjang. Selamat bertugas!',
          'success'
        );
      }
    }
  }, [pushNotification]);

  // Trigger simulated 50-minute inactivity for testing/demo purposes
  const simulateIdleWarning = useCallback(() => {
    const fakePastTime = Date.now() - IDLE_WARNING_THRESHOLD_MS - 5000; // 50m 5s ago
    lastActivityRef.current = fakePastTime;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, fakePastTime.toString());
    } catch {
      // ignore
    }
    setIsWarningOpen(true);
    setRemainingSeconds(Math.floor((IDLE_TOTAL_TIMEOUT_MS - (Date.now() - fakePastTime)) / 1000));
  }, []);

  // Listen for custom simulation event (e.g. from Settings or Dev testing)
  useEffect(() => {
    const handleSimulate = () => {
      simulateIdleWarning();
    };
    window.addEventListener('simulate-idle-warning', handleSimulate);
    return () => window.removeEventListener('simulate-idle-warning', handleSimulate);
  }, [simulateIdleWarning]);

  // Listen to user interaction events
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setIsWarningOpen(false);
      return;
    }

    // Initialize last activity safely: if missing or stale from previous expired session, reset to now
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    const now = Date.now();
    let initialTime = saved ? Number(saved) : now;
    if (isNaN(initialTime) || (now - initialTime >= IDLE_TOTAL_TIMEOUT_MS)) {
      initialTime = now;
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
      } catch {
        // ignore
      }
    }
    lastActivityRef.current = initialTime;

    let throttleTimeout: any = null;
    const handleUserActivity = () => {
      // If warning modal is open, don't automatically dismiss by subtle mouse move
      // Require clicking extend session button or keypress
      if (isWarningOpenRef.current) return;

      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          recordActivity(false);
          throttleTimeout = null;
        }, 1500); // Throttled every 1.5s
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Storage listener to sync across multiple browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.LAST_ACTIVITY && e.newValue) {
        const time = Number(e.newValue);
        if (!isNaN(time) && time > lastActivityRef.current) {
          lastActivityRef.current = time;
          if (isWarningOpenRef.current && (Date.now() - time) < IDLE_WARNING_THRESHOLD_MS) {
            setIsWarningOpen(false);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAuthenticated, currentUser, recordActivity]);

  // Main countdown / idle evaluation interval ticker
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setIsWarningOpen(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastActivityRef.current;
      const elapsedMins = Math.floor(elapsedMs / (60 * 1000));
      setTotalIdleMinutes(elapsedMins);

      // Check if reached 60 minutes auto-logout
      if (elapsedMs >= IDLE_TOTAL_TIMEOUT_MS) {
        setIsWarningOpen(false);
        try {
          localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
          localStorage.removeItem(STORAGE_KEYS.TEST_OFFSET);
          localStorage.setItem(
            STORAGE_KEYS.LOGOUT_REASON,
            'Sesi login Anda telah berakhir secara otomatis setelah 60 menit tidak ada aktivitas demi keamanan data perpustakaan.'
          );
        } catch {
          // ignore
        }
        logout();
        return;
      }

      // Check if reached 50 minutes warning threshold
      if (elapsedMs >= IDLE_WARNING_THRESHOLD_MS) {
        setIsWarningOpen(true);
        const remainingMs = Math.max(0, IDLE_TOTAL_TIMEOUT_MS - elapsedMs);
        setRemainingSeconds(Math.floor(remainingMs / 1000));
      } else {
        if (isWarningOpenRef.current) {
          setIsWarningOpen(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser, logout]);

  return {
    isWarningOpen,
    remainingSeconds,
    totalIdleMinutes,
    recordActivity,
    simulateIdleWarning,
    extendSession: () => recordActivity(true),
    logoutNow: logout
  };
}
