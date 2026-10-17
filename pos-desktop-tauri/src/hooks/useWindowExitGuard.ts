import { useEffect, useRef, useState, useCallback } from 'react';
import { getDB } from '../lib/db';

interface UseWindowExitGuardOptions {
  currentUser: any;
  onOpenExitGuardModal: () => void;
}

/**
 * Hook to intercept the Windows OS Close button ('X'), Alt+F4, or browser tab close
 * when an operator has an active, unclosed shift.
 */
export function useWindowExitGuard({ currentUser, onOpenExitGuardModal }: UseWindowExitGuardOptions) {
  const isCloseModalTriggeredRef = useRef(false);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const checkHasActiveShift = useCallback(async (): Promise<boolean> => {
    try {
      if (currentUserRef.current?.current_shift_start) {
        return true;
      }
      const db = await getDB();
      const settingsRow: any[] = await db.select('SELECT value FROM settings WHERE key = "current_shift_start"');
      if (settingsRow.length > 0 && settingsRow[0]?.value) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let unlistenTauriClose: (() => void) | null = null;
    let isMounted = true;

    const setupTauriCloseGuard = async () => {
      const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
      if (!isTauri) return;

      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const currentWin = getCurrentWindow();

        unlistenTauriClose = await currentWin.onCloseRequested(async (event) => {
          const hasShift = await checkHasActiveShift();

          if (hasShift) {
            // Halt immediate window termination!
            event.preventDefault();
            console.warn('[ExitGuard] Intercepted window close request: Active shift detected.');
            onOpenExitGuardModal();
          } else {
            console.log('[ExitGuard] Window close requested: No active shift, proceeding with clean exit.');
          }
        });
      } catch (err) {
        console.warn('[ExitGuard] Failed to attach Tauri onCloseRequested listener:', err);
      }
    };

    setupTauriCloseGuard();

    // Web browser fallback for preview mode:
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentUserRef.current?.current_shift_start) {
        e.preventDefault();
        e.returnValue = 'Tem um turno de caixa activo em aberto. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (unlistenTauriClose) {
        unlistenTauriClose();
      }
    };
  }, [checkHasActiveShift, onOpenExitGuardModal]);

  const forceExitApp = useCallback(async () => {
    const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
    if (isTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().destroy();
      } catch (e) {
        try {
          const { exit } = await import('@tauri-apps/plugin-process');
          await exit(0);
        } catch {
          window.close();
        }
      }
    } else {
      window.close();
    }
  }, []);

  return { forceExitApp, checkHasActiveShift };
}
