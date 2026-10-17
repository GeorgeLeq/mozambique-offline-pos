import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface InternetStatusBadgeProps {
  className?: string;
}

export function InternetStatusBadge({ className = '' }: InternetStatusBadgeProps) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight border transition-all ${
        isOnline
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-xs'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-xs animate-pulse'
      } ${className}`}
      title={isOnline ? 'Conexão à Internet Ativa' : 'Sem ligação à Internet - A operar em SQLite Local (Offline-First)'}
    >
      <div className="relative flex items-center justify-center">
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400/50 animate-ping"></span>
          </>
        ) : (
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {isOnline ? <Wifi size={11} className="text-emerald-400" /> : <WifiOff size={11} className="text-amber-400" />}
        <span className="font-semibold uppercase tracking-wider text-[10px]">
          {isOnline ? 'Internet Conectada' : 'Modo Offline (Local)'}
        </span>
      </div>
    </div>
  );
}
