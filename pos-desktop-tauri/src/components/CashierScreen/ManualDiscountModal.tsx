import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Percent, DollarSign, ShieldAlert, Check, HelpCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';
import { getDB } from '../../lib/db';
import { findUserByPin } from '../../lib/security/crypto';
import { CartItem } from './hooks/useCart';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';

interface ManualDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  onApplyDiscount: (itemId: string, discountType: 'none' | 'percent' | 'value', discountValue: number, authorizedBy?: string) => void;
}

export function ManualDiscountModal({ isOpen, onClose, item, onApplyDiscount }: ManualDiscountModalProps) {
  const { pos: t, common: commonT } = useI18n();
  const { currentUser } = useAuth();
  const [discountType, setDiscountType] = useState<'percent' | 'value'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscountCap, setMaxDiscountCap] = useState(20); // default cap 20%
  const [presets, setPresets] = useState<string[]>(['5%', '10%', '15%', '-50', '-100']);
  const [adminPin, setAdminPin] = useState('');
  const [isPinVerifying, setIsPinVerifying] = useState(false);
  const [authTriggerDiscount, setAuthTriggerDiscount] = useState(true);

  useEffect(() => {
    if (isOpen && item) {
      setDiscountValue('');
      setDiscountType('percent');
      setAdminPin('');
      loadDiscountSettings();
    }
  }, [isOpen, item]);

  const loadDiscountSettings = async () => {
    try {
      const db = await getDB();
      const capRes = await db.select('SELECT value FROM settings WHERE key = "max_discount_cap"') as any[];
      if (capRes.length > 0) {
        setMaxDiscountCap(parseFloat(capRes[0].value) || 20);
      }
      
      const presetsRes = await db.select('SELECT value FROM settings WHERE key = "discount_presets"') as any[];
      if (presetsRes.length > 0 && presetsRes[0].value) {
        setPresets(presetsRes[0].value.split(',').map((s: string) => s.trim()));
      }

      // Load specific security and authorization settings
      const safetyRes = await db.select(
        'SELECT key, value FROM settings WHERE key = "auth_trigger_discount"'
      ) as any[];

      safetyRes.forEach((row: any) => {
        if (row.key === 'auth_trigger_discount') {
          setAuthTriggerDiscount(row.value === 'true');
        }
      });
    } catch (e) {
      console.error('Failed to load discount settings', e);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const val = parseFloat(discountValue) || 0;
    
    if (val <= 0) {
      toast.error('Insira um valor de desconto válido.');
      return;
    }

    const calculatedDiscountAmount = discountType === 'percent' 
      ? (item.price * val) / 100 
      : val;
    
    const discountPercentage = discountType === 'percent'
      ? val
      : (val / item.price) * 100;

    if (discountPercentage >= 100) {
      toast.error('O desconto não pode ser superior ou igual a 100%.');
      return;
    }

    let authorizedBy = undefined;

    // Check if authorization is required
    const requiresAuth = authTriggerDiscount && discountPercentage > maxDiscountCap;
    
    if (requiresAuth) {
      if (!adminPin) {
        toast.error('Este desconto excede o limite máximo. Insira o PIN do Administrador.');
        return;
      }

      setIsPinVerifying(true);
      try {
        const db = await getDB();
        const adminUser = await findUserByPin(db, adminPin, ['Admin']);

        if (adminUser && !adminUser.__role_mismatch) {
          authorizedBy = adminUser.name;
          toast.success(`Desconto autorizado por ${authorizedBy}!`);
        } else {
          // Check emergency tokens by code first
          const tokens = await db.select(
            'SELECT * FROM emergency_tokens WHERE code = ? AND is_used = 0',
            [adminPin]
          ) as any[];
          
          // Find the token matching this cashier and not expired, or allow fallback for simulated/unauthenticated cashiers in testing mode
          const matchedToken = tokens.find(t => 
            (!t.expires_at || new Date(t.expires_at) > new Date()) &&
            (!t.cashier_id || 
             !currentUser?.id || 
             t.cashier_id === currentUser?.id || 
             currentUser?.id === 'sim-cashier' || 
             currentUser?.id === 'unknown')
          );

          if (matchedToken) {
            // Verify emergency limits for this cashier
            let emergencyMaxDiscount = 10; // Default fallback
            
            // Load limit from the database for the user who owns this token (or current user as fallback)
            const targetUserId = matchedToken.cashier_id || currentUser?.id;
            if (targetUserId) {
              const tokenUserRows = await db.select('SELECT permissions_json FROM users WHERE id = ?', [targetUserId]) as any[];
              const permSource = tokenUserRows.length > 0 ? tokenUserRows[0] : currentUser;
              if (permSource?.permissions_json) {
                try {
                  const parsed = JSON.parse(permSource.permissions_json);
                  if (parsed && typeof parsed === 'object' && parsed.emergency_max_discount !== undefined) {
                    emergencyMaxDiscount = parseFloat(parsed.emergency_max_discount);
                  }
                } catch {}
              }
            }
            
            if (discountPercentage > emergencyMaxDiscount) {
              toast.error(`Código válido, mas desconto excede o limite de emergência (${emergencyMaxDiscount}%). Requer Admin físico.`);
              setIsPinVerifying(false);
              return;
            }
            
            // Mark token as used
            await db.execute(
              'UPDATE emergency_tokens SET is_used = 1, used_at = CURRENT_TIMESTAMP, used_amount = ?, used_for = ?, sync_status = 0 WHERE id = ?', 
              [discountPercentage, `Desconto: ${discountPercentage}%`, matchedToken.id]
            );
            authorizedBy = 'Código de Emergência';
            toast.success('Desconto autorizado via código de emergência.');
          } else {
            toast.error('PIN de Administrador ou Código de Emergência inválido!');
            setIsPinVerifying(false);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to verify admin PIN', error);
        toast.error('Erro ao verificar o PIN de segurança.');
        setIsPinVerifying(false);
        return;
      } finally {
        setIsPinVerifying(false);
      }
    }

    onApplyDiscount(item.id, discountType, val, authorizedBy);
    onClose();
  };

  if (!item) return null;

  const currentPrice = item.price;
  const inputVal = parseFloat(discountValue) || 0;
  
  const discountAmount = discountType === 'percent' 
    ? (currentPrice * inputVal) / 100 
    : inputVal;
  
  const finalPrice = Math.max(0, currentPrice - discountAmount);
  
  const currentPercentage = discountType === 'percent' 
    ? inputVal 
    : (inputVal / currentPrice) * 100;

  const needsAuth = authTriggerDiscount && currentPercentage > maxDiscountCap;
  const hasPromoPrice = item.original_price_mt && item.original_price_mt > item.price;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 "
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden z-10 border border-slate-200 dark:border-zinc-800"
        >
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <Percent size={22} className="text-indigo-500" />
                  {t.manualDiscountTitle || 'Desconto Manual'}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1 truncate max-w-[250px]">
                  {item.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {hasPromoPrice ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 mb-6">
                <HelpCircle className="w-5 h-5 mb-2 text-amber-500" />
                <span className="font-bold block mb-1">{t.promoDiscountWarningTitle || 'Atenção!'}</span>
                {t.promoDiscountWarningDesc || 'Este artigo já se encontra com um preço promocional/especial. Não é possível aplicar descontos adicionais a artigos em promoção.'}
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-6">
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      discountType === 'percent'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Percent size={16} /> {t.percentage || 'Percentagem'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('value')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      discountType === 'value'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <DollarSign size={16} /> {t.fixedValue || 'Valor Fixo'}
                  </button>
                </div>

                {presets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {presets.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          if (p.includes('%')) {
                            setDiscountType('percent');
                            setDiscountValue(p.replace('%', ''));
                          } else {
                            setDiscountType('value');
                            setDiscountValue(p.replace('-', ''));
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-2xl text-2xl font-black text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                      placeholder="0.00"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
                      {discountType === 'percent' ? <Percent size={20} /> : <span className="font-bold text-lg">MT</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">{t.originalPrice || 'Preço Original'}</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-bold font-mono">{formatCurrency(currentPrice)} MT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">{t.appliedDiscount || 'Desconto Aplicado'}</span>
                    <span className="text-rose-500 dark:text-rose-400 font-bold font-mono">- {formatCurrency(discountAmount)} MT</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-500/20 flex justify-between text-base">
                    <span className="text-indigo-900 dark:text-indigo-300 font-black">{t.finalPrice || 'Preço Final'}</span>
                    <span className="text-indigo-700 dark:text-indigo-400 font-black font-mono">{formatCurrency(finalPrice)} MT</span>
                  </div>
                </div>

                {needsAuth && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 space-y-3">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="text-amber-500 mt-0.5 shrink-0" size={18} />
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                        {t.discountExceedsLimit || 'Este desconto excede o limite permitido sem autorização.'}
                      </p>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        placeholder={t.pinOrEmergencyPlaceholder || "PIN ou Código de Emergência..."}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                        maxLength={8}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    {commonT.cancel || 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    disabled={isPinVerifying}
                    className="flex-1 flex items-center justify-center gap-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/15 transition-all cursor-pointer"
                  >
                    <Check size={16} />
                    {isPinVerifying ? (t.verifying || 'Verificando...') : (t.applyDiscount || 'Aplicar')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
