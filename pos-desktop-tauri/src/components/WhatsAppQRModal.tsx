import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappUrl: string;
}

export function WhatsAppQRModal({ isOpen, onClose, whatsappUrl }: WhatsAppQRModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl p-6 overflow-hidden border border-slate-200 dark:border-white/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6 mt-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Scan to Share</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Point customer's camera at this QR code to open WhatsApp.
              </p>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-2xl mx-auto border border-slate-100 mb-6 w-fit">
              <QRCodeSVG value={whatsappUrl} size={200} level="M" includeMargin={false} />
            </div>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium rounded-xl transition-colors border border-emerald-200 dark:border-emerald-500/20"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied Link' : 'Copy WhatsApp Link'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
