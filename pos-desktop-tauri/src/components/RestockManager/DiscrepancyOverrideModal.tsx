import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Lock, X } from 'lucide-react';
import { getDB } from '../../lib/db';
import { findUserByPin } from '../../lib/security/crypto';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n';

export function DiscrepancyOverrideModal({ 
  discrepancies, 
  onClose, 
  onConfirm 
}: { 
  discrepancies: any[], 
  onClose: () => void, 
  onConfirm: (managerName: string) => void 
}) {
  const t = useI18n();
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedBy, setAuthorizedBy] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  React.useEffect(() => {
    if (pin.length === 6 && !isAuthorized && !isVerifying) {
      handleVerify();
    }
  }, [pin, isAuthorized, isVerifying]);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose]);

  const handleVerify = async () => {
    if (pin.length < 6) return;
    
    setIsVerifying(true);
    try {
      const db = await getDB();
      const verifiedUser = await findUserByPin(db, pin);
      
      if (verifiedUser) {
        let isAuthorizedUser = false;

        if (verifiedUser.role === 'Admin' || verifiedUser.role === 'admin') {
          isAuthorizedUser = true;
        } else {
          // Parse permissions to check for supervisor permission
          const perms = verifiedUser.permissions_json ? JSON.parse(verifiedUser.permissions_json) : [];
          const userPermissions = Array.isArray(perms) ? perms : (perms.permissions || []);
          if (userPermissions.includes('supervisor')) {
            isAuthorizedUser = true;
          }
        }

        if (isAuthorizedUser) {
          setAuthorizedBy(verifiedUser.name);
          setIsAuthorized(true);
          toast.success(`Autenticado como ${verifiedUser.name}`);
        } else {
          toast.error('Este utilizador não tem permissões de Supervisão.');
          setPin('');
        }
      } else {
        toast.error('PIN inválido.');
        setPin('');
      }
    } catch (e) {
      toast.error('Erro na validação do PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div 
        className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative z-10 flex flex-col"
      >
        <div className="p-6 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-600 dark:text-rose-400">Divergência de Stock</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">O stock lido não corresponde à encomenda.</p>
          </div>
        </div>

        {isAuthorized ? (
          <>
            <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-center">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                ✓ Acesso Concedido a: {authorizedBy}
              </span>
            </div>
            <div className="p-6 overflow-y-auto max-h-60 bg-slate-50/50 dark:bg-zinc-900/30">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs text-slate-400 uppercase">
                    <th className="pb-2">{t.productName || 'Produto'}</th>
                    <th className="pb-2 text-center">{t.qtyOrdered || 'Esperado'}</th>
                    <th className="pb-2 text-center">{t.qtyReceived || 'Lido'}</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.map((d, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
                      <td className="py-2 font-bold text-slate-700 dark:text-zinc-300">{d.productName}</td>
                      <td className="py-2 text-center font-mono text-slate-500">{d.expected}</td>
                      <td className="py-2 text-center font-mono font-bold text-rose-600 dark:text-rose-400">{d.scanned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/10 flex justify-between gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                {t.cancel || 'Voltar/Corrigir'}
              </button>
              <button
                onClick={() => onConfirm(authorizedBy)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-rose-500/20"
              >
                Confirmar Divergência
              </button>
            </div>
          </>
        ) : (
          <div className="p-6 flex flex-col gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">
                Os dados de entrada físicos diferem do esperado.
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 font-bold uppercase tracking-wider">
                🔐 Requer Autenticação do Gerente para revelar desvios e autorizar
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
              <label className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
                <Lock size={12} />
                PIN do Gestor ou Admin
              </label>
              <div className="flex justify-center">
                <input
                  ref={inputRef}
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && pin.length === 6 && !isVerifying) {
                      handleVerify();
                    }
                  }}
                  className="w-32 text-center text-2xl tracking-[0.5em] font-black p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  placeholder="******"
                />
              </div>
            </div>
            
            <div className="flex justify-between gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                {t.cancel || 'Voltar'}
              </button>
              <button
                onClick={handleVerify}
                disabled={pin.length < 6 || isVerifying}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'A validar...' : 'Autenticar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
