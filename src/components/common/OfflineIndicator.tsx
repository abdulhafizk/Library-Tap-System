import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 animate-in slide-in-from-bottom-3 duration-200">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>Koneksi Pulih — Database Cloud Supabase Terhubung & Sinkron</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 animate-in slide-in-from-bottom-3 duration-200">
      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shrink-0" />
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Koneksi Offline — Data ditampung di antrean & otomatis disinkronkan ke Supabase saat online</span>
    </div>
  );
};
