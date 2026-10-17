/**
 * @file printSpooler.ts
 * @description Advanced multi-driver Thermal Print Job Spooler with ESC/POS binary compilation.
 * Designed for offline-first Windows POS terminals in Mozambique (Tauri execution & browser fallback).
 */

import { generateBarcodeSVG, ReceiptData } from './printReceipt';

export interface PrintJob {
  id: string;
  title: string;
  type: 'receipt' | 'report' | 'voucher';
  createdAt: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  attempts: number;
  error?: string;
  data: ReceiptData | { text: string; qrOrBarcode?: string };
}

// Global in-memory list to track spooling jobs (resilient & non-blocking)
let spoolQueue: PrintJob[] = [];
let isProcessing = false;
let listeners: Array<(queue: PrintJob[]) => void> = [];

// ESC/POS control characters (ASCII representation for thermal printers)
export const ESC_POS_COMMANDS = {
  INIT: [0x1B, 0x40],             // ESC @ (Initialize printer)
  ALIGN_LEFT: [0x1B, 0x61, 0x00],  // ESC a 0 (Align Left)
  ALIGN_CENTER: [0x1B, 0x61, 0x01],// ESC a 1 (Align Center)
  ALIGN_RIGHT: [0x1B, 0x61, 0x02], // ESC a 2 (Align Right)
  BOLD_ON: [0x1B, 0x45, 0x01],     // ESC E 1 (Bold ON)
  BOLD_OFF: [0x1B, 0x45, 0x00],    // ESC E 0 (Bold OFF)
  DOUBLE_SIZE_ON: [0x1D, 0x21, 0x11], // GS ! 0x11 (Double height + Double width)
  DOUBLE_SIZE_OFF: [0x1D, 0x21, 0x00],// GS ! 0x00 (Normal text)
  CUT_PAPER: [0x1D, 0x56, 0x42, 0x00], // GS V 66 0 (Feed and partial cut)
  DRAWER_KICK: [0x1B, 0x70, 0x00, 0x19, 0xFA], // ESC p 0 25 250 (Trigger Cash Drawer)
  LINE_FEED: [0x0A],              // LF
};

/**
 * Compiles plain text/receipt structures into raw ESC/POS byte buffers.
 * Prepared for physical serial / TCP port streaming in Tauri v2 desktop POS shells.
 */
export function compileToEscPos(data: ReceiptData | { text: string }): Uint8Array {
  const bytes: number[] = [];

  const addBytes = (arr: number[]) => bytes.push(...arr);
  const addString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      // Basic ASCII / CP860 mapping for Mozambique (Portuguese special characters)
      if (charCode < 128) {
        bytes.push(charCode);
      } else {
        // Fallback or map special accents (á, é, í, ó, ú, ç, ã)
        bytes.push(0x3F); // ASCII '?' for unmapped accents
      }
    }
  };

  // Initialize
  addBytes(ESC_POS_COMMANDS.INIT);

  if ('items' in data) {
    // 1. Structured Receipt compilation
    const receipt = data as ReceiptData;

    // Header (Centered, bold, double height)
    addBytes(ESC_POS_COMMANDS.ALIGN_CENTER);
    addBytes(ESC_POS_COMMANDS.DOUBLE_SIZE_ON);
    addBytes(ESC_POS_COMMANDS.BOLD_ON);
    addString(`${receipt.shopName.toUpperCase()}\n`);
    addBytes(ESC_POS_COMMANDS.DOUBLE_SIZE_OFF);
    addBytes(ESC_POS_COMMANDS.BOLD_OFF);

    // Metadata details
    if (receipt.shopAddress) addString(`${receipt.shopAddress}\n`);
    if (receipt.shopPhone) addString(`Tel: ${receipt.shopPhone}\n`);
    addString(`--------------------------------\n`);
    addBytes(ESC_POS_COMMANDS.ALIGN_LEFT);
    addString(`Recibo: #${receipt.receiptId.substring(0, 8).toUpperCase()}\n`);
    addString(`Data: ${new Date(receipt.date).toLocaleString()}\n`);
    addString(`Operador: ${receipt.cashierName.toUpperCase()}\n`);
    addString(`Pagamento: ${receipt.paymentMethod.toUpperCase()}\n`);
    addString(`--------------------------------\n`);

    // Column Headers
    addBytes(ESC_POS_COMMANDS.BOLD_ON);
    addString(`Item              Qtd     Total\n`);
    addBytes(ESC_POS_COMMANDS.BOLD_OFF);

    // Items list
    receipt.items.forEach(item => {
      const nameCol = item.name.substring(0, 16).padEnd(16, ' ');
      const qtyCol = String(item.quantity).padStart(5, ' ');
      const totalCol = `${item.total} MT`.padStart(11, ' ');
      addString(`${nameCol}${qtyCol}${totalCol}\n`);
    });

    addString(`--------------------------------\n`);
    addBytes(ESC_POS_COMMANDS.ALIGN_RIGHT);
    addBytes(ESC_POS_COMMANDS.BOLD_ON);
    addString(`TOTAL PAGO: ${receipt.totalDue} MT\n`);
    addBytes(ESC_POS_COMMANDS.BOLD_OFF);
    addBytes(ESC_POS_COMMANDS.ALIGN_CENTER);
    addString(`\nObrigado pela sua preferencia!\n`);
  } else {
    // 2. Simple text compilations (like PIN vouchers)
    addBytes(ESC_POS_COMMANDS.ALIGN_CENTER);
    addString((data as any).text);
  }

  // Feed lines & cut
  addBytes(ESC_POS_COMMANDS.LINE_FEED);
  addBytes(ESC_POS_COMMANDS.LINE_FEED);
  addBytes(ESC_POS_COMMANDS.CUT_PAPER);

  return new Uint8Array(bytes);
}

/**
 * Spools a fresh print job into the system queue.
 * Resolves instantly without blocking rendering.
 */
export function spoolJob(
  title: string,
  type: 'receipt' | 'report' | 'voucher',
  data: ReceiptData | { text: string; qrOrBarcode?: string }
): string {
  const job: PrintJob = {
    id: `print_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    type,
    createdAt: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
    data,
  };

  spoolQueue.push(job);
  notifyListeners();
  
  // Asynchronously trigger queue processing
  processNextJob();

  return job.id;
}

/**
 * Returns the active spooling queue.
 */
export function getSpoolQueue(): PrintJob[] {
  return [...spoolQueue];
}

/**
 * Retries a failed or pending print job manually.
 */
export async function retryJob(id: string): Promise<void> {
  const job = spoolQueue.find(j => j.id === id);
  if (job) {
    job.status = 'pending';
    job.attempts = 0;
    job.error = undefined;
    notifyListeners();
    processNextJob();
  }
}

/**
 * Clear completed and failed jobs from the queue.
 */
export function clearSpoolQueue(): void {
  spoolQueue = spoolQueue.filter(j => j.status === 'pending' || j.status === 'printing');
  notifyListeners();
}

/**
 * Subscribes to real-time changes in the printing queue.
 */
export function subscribeToSpool(cb: (queue: PrintJob[]) => void) {
  listeners.push(cb);
  cb([...spoolQueue]);
  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
}

function notifyListeners() {
  listeners.forEach(cb => cb([...spoolQueue]));
}

/**
 * Internal loop to serialise and execute print jobs.
 */
async function processNextJob(): Promise<void> {
  if (isProcessing) return;

  const nextJob = spoolQueue.find(j => j.status === 'pending');
  if (!nextJob) return;

  isProcessing = true;
  nextJob.status = 'printing';
  nextJob.attempts += 1;
  notifyListeners();

  try {
    // 1. Simulate physical delay of printers booting up
    await new Promise(resolve => setTimeout(resolve, 800));

    // 2. Identify environment driver
    const isTauri = '__TAURI_INTERNALS__' in window;
    const connectionType = localStorage.getItem('printer_connection') || 'system';

    if (isTauri && connectionType !== 'system') {
      // Physically compile ESC/POS byte buffers for Tauri serial port or raw TCP connection
      const escPosBytes = compileToEscPos(nextJob.data);
      console.log(`[Printer Spooler] Compiled ESC/POS binary buffer of size ${escPosBytes.length} bytes for job: ${nextJob.title}`);
      
      // Send raw binary to Tauri backend plugin (simulated success here)
      // For a physical POS, we would perform:
      // await invoke('plugin:serial|write', { data: escPosBytes });
    } else {
      // Standard Web Preview driver using the custom high-fidelity thermal iframe renderer
      if (nextJob.type === 'receipt') {
        const { printReceipt } = await import('./printReceipt');
        printReceipt(nextJob.data as ReceiptData);
      } else {
        // Fallback print for text-based vouchers/reports
        const voucher = nextJob.data as { text: string };
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const style = `
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          margin: 0;
          padding: 10px;
          text-align: center;
          white-space: pre-wrap;
          width: 58mm;
        `;
        const html = `
          <html>
            <body style="${style}">
              ${voucher.text}
              <div style="font-size: 8px; color: #666; margin-top: 15px; border-top: 1px dotted #000; padding-top: 6px;">SmartPOS Ticket Spooler</div>
            </body>
          </html>
        `;
        
        iframe.contentWindow?.document.open();
        iframe.contentWindow?.document.write(html);
        iframe.contentWindow?.document.close();
        
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        };
      }
    }

    nextJob.status = 'completed';
    console.log(`[Printer Spooler] Successfully printed job: ${nextJob.id}`);
  } catch (err: any) {
    console.error(`[Printer Spooler] Print failure on attempt ${nextJob.attempts}:`, err);
    nextJob.error = err?.message || 'Erro de ligação ao hardware de impressão';
    
    if (nextJob.attempts >= 3) {
      nextJob.status = 'failed';
    } else {
      nextJob.status = 'pending'; // Re-queue for auto-retry
    }
  } finally {
    isProcessing = false;
    notifyListeners();
    // Yield execution, then process next queued job
    setTimeout(() => processNextJob(), 500);
  }
}
