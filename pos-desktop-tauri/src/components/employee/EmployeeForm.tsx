import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserPlus, 
  Shield, 
  Lock, 
  RefreshCw, 
  Edit2, 
  Maximize2, 
  Minimize2, 
  Loader2, 
  Sparkles,
  Info,
  SlidersHorizontal,
  Wallet,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { User } from '../../types';
import { getAvailablePermissions } from './constants';
import { PinVoucher } from './PinVoucher';
import { EmployeeGuideModal } from './EmployeeGuideModal';
import { useSubscription } from '../../subscription/subscriptionContext';
import { useEmployeesI18n } from '../../i18n';
import { getPermissionCategoryStyle } from './PermissionBadge';

interface PermissionCardProps {
  id: string;
  label: string;
  desc: string;
  accessSummary?: string;
  category?: 'vendas' | 'catalogo' | 'financeiro' | 'seguranca' | 'operacoes';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isChecked: boolean;
  disabled: boolean;
  onChange: (id: string, checked: boolean) => void;
}

const PermissionCard = React.memo(({ 
  id, 
  label, 
  desc, 
  accessSummary, 
  category, 
  icon: PermIcon, 
  isChecked, 
  disabled, 
  onChange 
}: PermissionCardProps) => {
  const catStyle = getPermissionCategoryStyle(category);

  return (
    <label 
      className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all select-none ${
        isChecked 
          ? 'bg-indigo-50/90 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 shadow-2xs' 
          : 'bg-slate-50/80 dark:bg-zinc-900/40 border-slate-200/70 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-zinc-400'
      }`}
    >
      <input 
        type="checkbox"
        disabled={disabled}
        checked={isChecked}
        onChange={(e) => onChange(id, e.target.checked)}
        className="w-4 h-4 mt-1 text-indigo-600 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <PermIcon size={14} className={isChecked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'} />
            <span className={`text-xs font-bold leading-none truncate ${isChecked ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-700 dark:text-zinc-300'}`}>
              {label}
            </span>
          </div>
          <span className={`text-[8.5px] px-1.5 py-0.2 rounded border font-bold uppercase tracking-wider shrink-0 ${catStyle.badgeBg}`}>
            {catStyle.label}
          </span>
        </div>

        {/* Access Summary scope */}
        {accessSummary && (
          <div className={`mt-1.5 px-2 py-1 rounded-lg text-[10.5px] font-medium leading-snug flex items-start gap-1.5 ${
            isChecked 
              ? 'bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200/50 dark:border-indigo-800/50' 
              : 'bg-slate-100 dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 border border-slate-200/50 dark:border-zinc-700/50'
          }`}>
            <KeyRound size={11} className="shrink-0 mt-0.5 text-amber-500" />
            <span>{accessSummary}</span>
          </div>
        )}

        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1">
          {desc}
        </p>
      </div>
    </label>
  );
});

PermissionCard.displayName = 'PermissionCard';

interface EmployeeFormProps {
  onClose: () => void;
  formMode: 'create' | 'edit';
  selectedUser: User | null;
  initialName: string;
  initialRole: 'Admin' | 'Cashier';
  initialPin: string;
  initialPermissions: string[];
  initialOpeningCash: string;
  initialNeedsShiftCash: boolean;
  onSave: (data: {
    name: string;
    role: 'Admin' | 'Cashier';
    pin: string;
    permissions: string[];
    openingCash: string;
    needsShiftCash: boolean;
  }) => Promise<void> | void;
  onGeneratePin: () => Promise<string>;
  generatedPin: string | null;
  clearGeneratedPin: () => void;
}

export function EmployeeForm({
  onClose,
  formMode,
  selectedUser,
  initialName,
  initialRole,
  initialPin,
  initialPermissions,
  initialOpeningCash,
  initialNeedsShiftCash,
  onSave,
  onGeneratePin,
  generatedPin,
  clearGeneratedPin,
}: EmployeeFormProps) {
  const t = useEmployeesI18n();
  const availablePermissions = useMemo(() => getAvailablePermissions(t), [t]);
  const { isFeatureUnlocked, openFeatureLockModal } = useSubscription();
  const hasCustomPermissions = isFeatureUnlocked('custom_permissions');

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'permissoes'>('dados');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Local form states
  const [localName, setLocalName] = useState(initialName);
  const [localRole, setLocalRole] = useState(initialRole);
  const [localPin, setLocalPin] = useState(initialPin);
  const [localPermissions, setLocalPermissions] = useState(initialPermissions);
  const [localOpeningCash, setLocalOpeningCash] = useState(initialOpeningCash);
  const [localNeedsShiftCash, setLocalNeedsShiftCash] = useState(initialNeedsShiftCash);

  const handlePermissionToggle = useCallback((permId: string, checked: boolean) => {
    if (!hasCustomPermissions) {
      openFeatureLockModal(
        'custom_permissions',
        t.lockCustomPermTitle || 'Módulo de Permissões Granulares',
        t.lockCustomPermDesc || 'Por padrão, todos os operadores têm acesso de Caixa. O controlo individual e granular de permissões (descontos, relatórios, anulações) é vendido separadamente.'
      );
      return;
    }
    setLocalPermissions(prev => {
      if (checked) {
        if (prev.includes(permId)) return prev;
        return [...prev, permId];
      } else {
        return prev.filter(id => id !== permId);
      }
    });
  }, [hasCustomPermissions, openFeatureLockModal, t]);

  // Sync state if initial props change while mounted
  useEffect(() => {
    setLocalName(initialName);
    setLocalRole(initialRole);
    setLocalPin(initialPin);
    setLocalPermissions(initialPermissions);
    setLocalOpeningCash(initialOpeningCash);
    setLocalNeedsShiftCash(initialNeedsShiftCash);
    setIsSaving(false);
  }, [initialName, initialRole, initialPin, initialPermissions, initialOpeningCash, initialNeedsShiftCash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave({
        name: localName,
        role: localRole,
        pin: localPin,
        permissions: localPermissions,
        openingCash: localOpeningCash,
        needsShiftCash: localNeedsShiftCash,
      });
    } catch (err) {
      console.error('[EmployeeForm] Error saving operator:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePin = async () => {
    try {
      const pin = await onGeneratePin();
      setLocalPin(pin);
    } catch (err) {
      console.error('[EmployeeForm] Error generating PIN:', err);
    }
  };

  const handleModalClose = () => {
    clearGeneratedPin();
    onClose();
  };

  return createPortal(
    <div key="employee-modal-overlay" className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop overlay (smooth fade) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={handleModalClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm"
      />

        {/* Modal Drawer Sheet (Instant open, no translation lag) */}
        <div
          className={`relative ${
            isFullScreen ? 'w-full max-w-full' : 'w-full sm:w-[540px] md:w-[600px] lg:w-[640px]'
          } bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full z-10 text-slate-900 dark:text-zinc-100 transition-all overflow-hidden`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-500/20">
                {formMode === 'create' ? (t.badgeNewRecord || 'Novo Registo') : (t.badgeEditRecord || 'Editar Registo')}
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  {formMode === 'create' ? (
                    <>
                      <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{t.addOperator || 'Adicionar Operador'}</span>
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{(t.editOperatorTitle || 'Editar Operador: {0}').replace('{0}', selectedUser?.name || '')}</span>
                    </>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {t.formSubtitle || 'Configure os dados, função, caixa e permissões de venda'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Info Guide button */}
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                title={t.guideTooltip || 'Abrir Guia de Gestão de Operadores'}
              >
                <Info size={15} />
                <span className="hidden sm:inline">{t.guideBtn || 'Guia'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={isFullScreen ? (t.restoreSize || 'Restaurar Tamanho') : (t.expandWindow || 'Expandir Janela')}
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="p-2 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={t.closeBtn || 'Fechar'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Subheader Navigation: Tabs in Normal Mode, Full-Width Indicator in Expanded Mode */}
          {!generatedPin && !isFullScreen && (
            <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-zinc-950/60 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('dados')}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dados'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-zinc-700'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <UserPlus size={14} />
                <span>{t.generalDataTab || 'Dados Gerais'}</span>
              </button>

              {/* Permissões tab aligned to far right */}
              <button
                type="button"
                onClick={() => setActiveTab('permissoes')}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto ${
                  activeTab === 'permissoes'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-zinc-700'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Shield size={14} />
                <span>{t.permissionsTab || 'Permissões'}</span>
                {!hasCustomPermissions ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black">
                    <Lock size={10} />
                    <span>{t.locked || 'Bloqueado'}</span>
                  </span>
                ) : localRole === 'Cashier' && (
                  <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-black">
                    {localPermissions.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Form Body / Success Pin View */}
          <form onSubmit={handleSubmit} id="employee-form-elem" className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-700 dark:text-zinc-300 space-y-4">
              {generatedPin ? (
                /* Success & PIN Voucher Presentation */
                <div className="space-y-6 max-w-md mx-auto py-4">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full mb-2">
                      <Sparkles size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                      {t.operatorCreatedSuccess || 'Operador Criado com Sucesso!'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {t.operatorCreatedDesc || 'O acesso foi registado localmente. Entregue o seguinte PIN confidencial ao colaborador para início de funções.'}
                    </p>
                  </div>

                  <PinVoucher generatedPin={generatedPin} />

                  <div className="pt-4 text-center">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      {t.doneBtn || 'Concluído'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Form Inputs (2-Grid in Expanded, Tabbed in Normal) */
                <div 
                  className={`grid ${isFullScreen ? 'grid-cols-1 lg:grid-cols-2 gap-5' : 'grid-cols-1 gap-4'} items-start`}
                >
                  {/* SECTION 1: Dados Gerais (Rendered if expanded OR if activeTab === 'dados') */}
                  {(isFullScreen || activeTab === 'dados') && (
                    <div className="space-y-4 bg-slate-50/70 dark:bg-zinc-950/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800">
                        <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <UserPlus size={14} />
                          <span>{t.generalDataTab || 'Dados Gerais'}</span>
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                          {t.requiredInfo || 'Informações Obrigatórias'}
                        </span>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                          {t.operatorFullName || 'Nome Completo do Operador'}
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSaving}
                          value={localName}
                          onChange={e => setLocalName(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 disabled:opacity-50 font-medium"
                          placeholder={t.operatorNamePlaceholder || 'Ex: Maria Silva'}
                        />
                      </div>

                      {/* Role Choice Buttons */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                          {t.roleLabel || 'Função / Nível de Acesso'}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setLocalRole('Cashier')}
                            className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              localRole === 'Cashier' 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-slate-900 dark:hover:text-zinc-200'
                            }`}
                          >
                            <Shield size={13} />
                            <span>{t.cashierRoleWithScope || 'Operador (Caixa)'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSaving || (formMode === 'edit' && selectedUser?.role === 'Admin')}
                            onClick={() => {
                              setLocalRole('Admin');
                              setLocalPermissions(availablePermissions.map(p => p.id));
                            }}
                            className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              localRole === 'Admin' 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-slate-900 dark:hover:text-zinc-200 disabled:opacity-50'
                            }`}
                          >
                            <Lock size={13} />
                            <span>{t.adminRole || 'Administrador'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Opening Cash Specific for Operator */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                          {t.openingCashLabel || 'Fundo de Caixa Inicial (MT)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            disabled={isSaving}
                            value={localOpeningCash}
                            onChange={e => setLocalOpeningCash(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 font-medium"
                            placeholder={t.useStoreDefaultPlaceholder || 'Usar padrão do estabelecimento'}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold text-xs">MT</span>
                        </div>
                        <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-1 block leading-normal">
                          {t.openingCashHint || 'Fundo próprio atribuído na abertura. Se em branco, herda o valor geral da loja.'}
                        </span>
                      </div>

                      {/* Toggle Shift Required */}
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/70 dark:border-zinc-800">
                        <div className="flex flex-col gap-0.5 pr-4">
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            {t.requireShiftManagement || 'Exigir Gestão de Caixa / Turno'}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                            {t.requireShiftHint || 'Operadores comuns abrem/fecham turnos. Administradores podem ser isentos.'}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                          <input 
                            type="checkbox" 
                            disabled={isSaving}
                            checked={localNeedsShiftCash} 
                            onChange={(e) => setLocalNeedsShiftCash(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-10 h-5 bg-slate-200 dark:bg-zinc-800 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 rounded-full shadow-inner"></div>
                        </label>
                      </div>

                      {/* Manual/Edit PIN field (only in edit mode) */}
                      {formMode === 'edit' && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800">
                          <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                            {t.changePinLabel || 'Mudar Código PIN (6 dígitos)'}
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                              <input
                                type="text"
                                maxLength={6}
                                disabled={isSaving}
                                value={localPin}
                                onChange={e => setLocalPin(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 font-mono font-bold tracking-widest text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                                placeholder={t.keepCurrentPinPlaceholder || 'Manter PIN atual'}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleGeneratePin}
                              disabled={isSaving}
                              className="px-3 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-zinc-800 cursor-pointer shadow-xs"
                              title={t.generatePinTooltip || 'Gerar PIN Aleatório'}
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 2: Permissões (Rendered if expanded OR if activeTab === 'permissoes') */}
                  {(isFullScreen || activeTab === 'permissoes') && (
                    <div className="space-y-3.5 bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
                      {localRole === 'Cashier' ? (
                        <>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800">
                            <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Shield size={14} />
                              <span>{t.authorizedPermissions || 'Permissões Autorizadas'}</span>
                            </label>
                            <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                              {(t.permissionsActiveCount || '{0} de {1} Ativas').replace('{0}', String(localPermissions.length)).replace('{1}', String(availablePermissions.length))}
                            </span>
                          </div>

                          {!hasCustomPermissions && (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 my-1.5">
                              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                <Lock size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                    {t.separatePermModule || 'Módulo de Permissões Separado'}
                                  </h5>
                                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                    {t.customizationLocked || 'Personalização Bloqueada'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                                  {t.permModuleDesc || 'Por padrão, os operadores recebem o perfil padrão de Caixa (vendas e turnos normais). A personalização granular de permissões (descontos, anulações e relatórios) é um módulo separado.'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => openFeatureLockModal(
                                    'custom_permissions',
                                    t.lockCustomPermTitle || 'Módulo de Permissões Granulares',
                                    t.lockCustomPermDesc || 'Por padrão, todos os operadores têm acesso de Caixa. O controlo individual e granular de permissões (descontos, relatórios, anulações) é vendido separadamente.'
                                  )}
                                  className="mt-2.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Sparkles size={12} />
                                  <span>{t.unlockPermModuleBtn || 'Desbloquear Módulo de Permissões'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 max-h-[380px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
                            {availablePermissions.map((p) => (
                              <PermissionCard
                                key={p.id}
                                id={p.id}
                                label={p.label}
                                desc={p.desc}
                                accessSummary={p.accessSummary}
                                category={p.category}
                                icon={p.icon}
                                isChecked={localPermissions.includes(p.id)}
                                disabled={isSaving}
                                onChange={handlePermissionToggle}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="py-12 px-6 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
                            <Shield size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                              {t.adminTotalAccessTitle || 'Administrador - Acesso Total'}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal max-w-sm mx-auto">
                              {t.adminTotalAccessDesc || 'Os administradores têm acesso irrestrito concedido automaticamente pelo sistema. Não requer sub-permissões manuais.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!generatedPin && (
              <div className="px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  {t.footerSqliteNotice || 'Operador seguro com SQLite Local'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleModalClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {t.cancelBtn || 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    form="employee-form-elem"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer border-0 flex items-center gap-1.5 active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-white" />
                        <span>{t.saving || 'A guardar...'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        <span>{formMode === 'create' ? (t.generatePinAndSave || 'Gerar PIN & Salvar') : (t.saveRecord || 'Salvar Registo')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Embedded Employee Guide Modal */}
        <EmployeeGuideModal 
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </div>,
    document.body
  );
}
