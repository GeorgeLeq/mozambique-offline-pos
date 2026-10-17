/**
 * @file useBarcodeScanner.ts
 * @description A custom React hook to capture input from a USB barcode scanner.
 * It differentiates between human typing and scanner input using a time threshold.
 */

import { useState, useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  /** Maximum time (in ms) between keystrokes to be considered a scanner. Default: 50ms */
  timeout?: number;
  /** Optional callback fired when a barcode is successfully scanned */
  onScan?: (barcode: string) => void;
}

export function useBarcodeScanner({ timeout = 50, onScan }: UseBarcodeScannerOptions = {}) {
  const [scannedCode, setScannedCode] = useState<string>('');
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Optional: Ignore events if the user is actively typing inside an input or textarea
      // so we don't accidentally capture manual data entry as a scan.
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // If the delay between keys is longer than the timeout, it's likely human typing.
      // We clear the buffer to start fresh.
      if (currentTime - lastKeyTime.current > timeout) {
        buffer.current = '';
      }

      if (e.key === 'Enter') {
        // When 'Enter' is pressed, check if we have a buffered barcode
        if (buffer.current.length > 0) {
          const code = buffer.current;
          setScannedCode(code);
          if (onScan) onScan(code);
          
          buffer.current = ''; // Clear buffer after successful scan
          e.preventDefault();  // Prevent default form submission behavior
        }
      } else if (e.key.length === 1) { 
        // Only capture single printable characters (ignore Shift, Ctrl, etc.)
        buffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [timeout, onScan]);

  return scannedCode;
}
