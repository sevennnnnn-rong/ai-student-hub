'use client';

/**
 * SyncProvider — React Context Provider
 * 提供 SyncManager 和 SyncStatus 给整个应用
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { SyncManager, SyncStatus } from './sync-manager';

// ============================================================
// Types
// ============================================================

interface SyncContextValue {
  syncManager: SyncManager | null;
  status: SyncStatus;
}

// ============================================================
// Context
// ============================================================

const SyncContext = createContext<SyncContextValue>({
  syncManager: null,
  status: {
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    connected: true,
  },
});

// ============================================================
// Provider
// ============================================================

interface SyncProviderProps {
  children: ReactNode;
  serverUrl?: string;
  syncInterval?: number;
}

export function SyncProvider({
  children,
  serverUrl,
  syncInterval,
}: SyncProviderProps) {
  const managerRef = useRef<SyncManager | null>(null);
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    connected: true,
  });

  // Initialize SyncManager once
  if (!managerRef.current) {
    managerRef.current = new SyncManager({ serverUrl, syncInterval });
  }

  const syncManager = managerRef.current;

  // Lifecycle: start on mount, stop on unmount
  useEffect(() => {
    syncManager.start();
    return () => {
      syncManager.stop();
    };
  }, [syncManager]);

  // Status listener
  useEffect(() => {
    const unsubscribe = syncManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    setStatus(syncManager.getStatus());

    return unsubscribe;
  }, [syncManager]);

  // Online / Offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, connected: true }));
      syncManager.sync().catch(() => {});
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, connected: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setStatus((prev) => ({
      ...prev,
      connected: syncManager.isOnline(),
    }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncManager]);

  const contextValue: SyncContextValue = {
    syncManager,
    status,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

/**
 * useSync — 获取 syncManager 和 syncStatus
 */
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);

  if (!context.syncManager) {
    console.warn(
      'useSync() must be used within a <SyncProvider>. ' +
        'Falling back to null manager.'
    );
  }

  return context;
}
