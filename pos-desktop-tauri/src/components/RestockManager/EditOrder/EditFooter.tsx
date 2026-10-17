import React from 'react';
import { Save } from 'lucide-react';
import { useI18n } from '../../../i18n';

interface EditFooterProps {
  onClose: () => void;
  isSaving: boolean;
}

export function EditFooter({ onClose, isSaving }: EditFooterProps) {
  const t = useI18n();

  return (
    <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
      >
        {t.cancel || 'Cancelar'}
      </button>
      <button
        type="submit"
        form="edit-po-form"
        disabled={isSaving}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border-0 flex items-center gap-1.5 disabled:opacity-50"
      >
        <Save size={14} />
        <span>{isSaving ? (t.saving || 'A guardar...') : (t.saveChanges || 'Guardar Alterações')}</span>
      </button>
    </div>
  );
}
