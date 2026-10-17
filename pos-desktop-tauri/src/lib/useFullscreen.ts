import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to monitor and toggle zero-bar Fullscreen mode (F11 / Button)
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
  });

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;

    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Erro ao ativar ecrã inteiro:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Erro ao sair do ecrã inteiro:', err);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen]);

  return { isFullscreen, toggleFullscreen };
}
