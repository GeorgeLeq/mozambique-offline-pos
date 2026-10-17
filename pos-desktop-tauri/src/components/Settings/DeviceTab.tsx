import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Laptop, ShieldAlert, Lock, Clock, UserCheck, CreditCard, 
  RefreshCw, Printer, CheckCircle2, ShieldCheck, HelpCircle,
  Download, MessageCircle, Sparkles, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsI18n } from '../../i18n';
import { getDB } from '../../lib/db';
import { findUserByPin } from '../../lib/security/crypto';
import { syncAllToCloud } from '../../lib/syncEngine';
import { subscribeToSpool, retryJob, clearSpoolQueue, PrintJob } from '../../lib/printSpooler';
import { useAppUpdate } from '../../contexts/UpdateContext';

interface DeviceTabProps {
  shopId: string;
  deviceId: string;
  showDeactivateConfirm: boolean;
  setShowDeactivateConfirm: (val: boolean) => void;
  deactivateDevice: () => Promise<void>;
  onOpenInfo?: () => void;
}

export default function DeviceTab({
  shopId,
  deviceId,
  showDeactivateConfirm,
  setShowDeactivateConfirm,
  deactivateDevice,
  onOpenInfo,
}: DeviceTabProps) {
  const t = useSettingsI18n();
  const { 
    updateInfo, 
    isChecking: isCheckingUpdate, 
    isUpdating, 
    checkForUpdates, 
    startUpdate, 
    openWhatsAppSupport, 
    simulateVersionRule, 
    resetSimulatedVersion 
  } = useAppUpdate();

  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Dynamic Refund Policy settings
  const [refundTimeLimit, setRefundTimeLimit] = useState('-1');
  const [refundAuthLevel, setRefundAuthLevel] = useState('manager');
  const [refundMethod, setRefundMethod] = useState('any');

  // Print Spool Queue State
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToSpool((queue) => {
      setPrintQueue(queue);
    });
    return () => unsubscribe();
  }, []);

  const loadRefundSettings = async () => {
    try {
      const db = await getDB();
      const res = await db.select('SELECT key, value FROM settings WHERE key IN ("refund_time_limit", "refund_auth_level", "refund_method")') as any[];
      if (res && res.length > 0) {
        res.forEach(item => {
          if (item.key === 'refund_time_limit') setRefundTimeLimit(item.value);
          if (item.key === 'refund_auth_level') setRefundAuthLevel(item.value);
          if (item.key === 'refund_method') setRefundMethod(item.value);
        });
      }
    } catch (e) {
      console.warn('Failed to load refund settings:', e);
    }
  };

  useEffect(() => {
    loadRefundSettings();
  }, []);

  const handleResetSettings = async () => {
    if (!window.confirm('Tem certeza de que deseja restaurar todas as configurações para os valores de fábrica? Isto não afectará os seus dados de produtos, utilizadores ou vendas.')) return;
    try {
      const { resetSettingsToDefault } = await import('../../lib/db');
      await resetSettingsToDefault();
      await loadRefundSettings();
      toast.success('Configurações restauradas com sucesso!');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      toast.error('Erro ao restaurar as configurações padrão.');
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const db = await getDB();
      await db.execute('INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 0)', [key, value]);
      localStorage.setItem(key, value);

      if (key === 'refund_time_limit') setRefundTimeLimit(value);
      if (key === 'refund_auth_level') setRefundAuthLevel(value);
      if (key === 'refund_method') setRefundMethod(value);
      
      toast.success('Definição de reembolso guardada!');
      syncAllToCloud();
    } catch (e) {
      console.error('Failed to update refund setting:', e);
      toast.error('Erro ao salvar a definição.');
    }
  };

  const handleDeactivate = async () => {
    if (!adminPin || adminPin.length < 6) {
      setPinError('Insira o PIN de 6 dígitos do Administrador.');
      return;
    }

    setIsValidating(true);
    setPinError('');

    try {
      const db = await getDB();
      const admin = await findUserByPin(db, adminPin, ['Admin', 'Manager']);

      if (!admin || admin.__role_mismatch) {
        setPinError('PIN incorreto ou utilizador sem permissões de Administrador.');
        toast.error('Acesso Negado: Apenas Administradores podem resetar o terminal!');
        setIsValidating(false);
        return;
      }

      await deactivateDevice();
      toast.success('Dispositivo desassociado com sucesso!');
    } catch (e) {
      console.error('Failed to deactivate device:', e);
      toast.error('Erro de base de dados ao validar de-associação.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      key="device"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col justify-between space-y-4"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Laptop size={22} className="text-indigo-600 dark:text-indigo-400" />
            {t.deviceTitle || 'Políticas de Devolução & Gestão do Terminal'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
            {t.deviceSubtitle || 'Regras de reembolso e devolução, gestão da fila do spooler de impressão e segurança de terminal.'}
          </p>
        </div>

        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
          >
            <HelpCircle size={15} className="text-indigo-500" />
            <span>{t.helpGuide || 'Guia de Ajuda'}</span>
          </button>
        )}
      </div>

      {/* 2-Column Balanced Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0">
        {/* Col 1: Políticas de Reembolso & Fila de Impressão */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Políticas de Reembolso Card */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
              <ShieldAlert size={16} className="text-rose-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                {t.refundPoliciesTitle || 'Políticas de Reembolso & Devolução'}
              </h3>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1">
                  <Clock size={13} className="text-indigo-500" />
                  {t.refundTimeLimitLabel || 'Prazo Limite para Aceitar Devoluções'}
                </label>
                <select
                  value={refundTimeLimit}
                  onChange={(e) => handleUpdateSetting('refund_time_limit', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 outline-none cursor-pointer"
                >
                  <option value="-1">{t.refundLimitUnlimited || 'Sem Limite (Ilimitado - Qualquer Data)'}</option>
                  <option value="0">{t.refundLimitSameDay || 'Apenas no Mesmo Dia da Compra'}</option>
                  <option value="7">{t.refundLimit7Days || 'Até 7 Dias Corridos'}</option>
                  <option value="15">{t.refundLimit15Days || 'Até 15 Dias Corridos'}</option>
                  <option value="30">{t.refundLimit30Days || 'Até 30 Dias Corridos'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1">
                    <UserCheck size={13} className="text-indigo-500" />
                    {t.refundAuthLevelLabel || 'Autorização Exigida'}
                  </label>
                  <select
                    value={refundAuthLevel}
                    onChange={(e) => handleUpdateSetting('refund_auth_level', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 outline-none cursor-pointer"
                  >
                    <option value="any">{t.authAnyOperator || 'Qualquer Operador'}</option>
                    <option value="manager">{t.authManager || 'Gestor / Gerente'}</option>
                    <option value="admin_only">{t.authAdminOnly || 'Apenas Administrador'}</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1">
                    <CreditCard size={13} className="text-indigo-500" />
                    {t.refundMethodLabel || 'Método de Devolução'}
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => handleUpdateSetting('refund_method', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 outline-none cursor-pointer"
                  >
                    <option value="any">{t.refundMethodAny || 'Qualquer (Misto)'}</option>
                    <option value="original">{t.refundMethodOriginal || 'Mesmo Original'}</option>
                    <option value="cash">{t.refundMethodCash || 'Sempre Numerário'}</option>
                  </select>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">
              {t.refundHelpText || 'Estas regras bloqueiam ou exigem PIN de supervisor no ecrã de Devoluções do POS.'}
            </span>
          </div>

          {/* Fila de Impressão Rápida */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Printer size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                  {t.printSpoolerQueueTitle || 'Fila do Spooler de Impressão'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block mt-0.5">
                  {printQueue.length === 0 ? (t.printSpoolerEmpty || 'Sem tarefas pendentes (Fila vazia)') : `${printQueue.length} ${t.printSpoolerPendingTasks || 'tarefas na fila de impressão'}`}
                </span>
              </div>
            </div>
            {printQueue.length > 0 && (
              <button
                onClick={clearSpoolQueue}
                className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {t.clearQueue || 'Limpar Fila'}
              </button>
            )}
          </div>
        </div>

        {/* Col 2: Manutenção & Ações Perigosas (Reset / Deactivate) */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Actualizações Over-The-Air (OTA) & Versão do Sistema */}
          <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                    Actualizações do Sistema (OTA)
                  </h4>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/20">
                  v{updateInfo?.currentVersion || '1.0.0'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-3">
                Gestão centralizada via Supabase. Todos os terminais recebem actualizações automáticas de segurança, fiscalidade e correções.
              </p>

              {/* Version Badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium bg-white dark:bg-zinc-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">Última Versão:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-bold font-mono">v{updateInfo?.latestVersion || '1.0.0'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">Mínima Exigida:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-bold font-mono">v{updateInfo?.minVersion || '1.0.0'}</span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="mt-2 text-xs">
                {updateInfo?.isHardBlocked ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Versão obsoleta! Actualização obrigatória.
                  </span>
                ) : updateInfo?.isSoftUpdateAvailable ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles size={14} />
                    Nova versão disponível para instalação.
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    O sistema está actualizado na versão mais recente.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isCheckingUpdate || isUpdating}
                onClick={async () => {
                  toast.loading('A verificar servidor de actualizações...', { id: 'ota-check' });
                  const res = await checkForUpdates();
                  if (res.isHardBlocked) {
                    toast.error('Versão expirada! É obrigatório atualizar.', { id: 'ota-check' });
                  } else if (res.isSoftUpdateAvailable) {
                    toast.success(`Nova versão v${res.latestVersion} encontrada!`, { id: 'ota-check' });
                  } else {
                    toast.success('O sistema já se encontra na versão mais recente.', { id: 'ota-check' });
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={isCheckingUpdate ? 'animate-spin' : ''} />
                <span>{isCheckingUpdate ? 'A verificar...' : 'Verificar Agora'}</span>
              </button>

              {updateInfo?.isSoftUpdateAvailable && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={startUpdate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>{isUpdating ? 'A instalar...' : 'Instalar Atualização'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => openWhatsAppSupport('Informações sobre actualizações')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                <MessageCircle size={13} />
                <span>WhatsApp (+258 87 166 8217)</span>
              </button>
            </div>
          </div>

          {/* Restaurar Definições Padrão */}
          <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw size={16} className="text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                  {t.factoryResetTitle || 'Restaurar Definições de Fábrica'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {t.factoryResetDesc || 'Repõe os parâmetros operacionais, moedas e limites de descontos aos padrões de fábrica. Não apaga vendas, utilizadores nem produtos.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSettings}
              className="self-start px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              {t.factoryResetButton || 'Restaurar Valores Padrão'}
            </button>
          </div>

          {/* Desassociar / Reset de Terminal */}
          <div className="p-4 bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-rose-500/20 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className="text-rose-600 dark:text-rose-400" />
                <h4 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                  {t.deactivateDeviceTitle || 'Desassociar Terminal / Reset de Setup'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {t.deactivateDeviceDesc || 'Remove a autorização do dispositivo para permitir re-configurar a loja ou vincular a outro estabelecimento.'}
              </p>
            </div>

            {!showDeactivateConfirm ? (
              <button
                type="button"
                onClick={() => {
                  setShowDeactivateConfirm(true);
                  setAdminPin('');
                  setPinError('');
                }}
                className="self-start px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {t.deactivateDeviceButton || 'Desassociar Terminal'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    placeholder={t.adminPinPlaceholder || 'PIN Admin (6 Dígitos)'}
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={isValidating}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isValidating ? '...' : (t.confirm || 'Confirmar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeactivateConfirm(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {t.cancel || 'Cancelar'}
                  </button>
                </div>
                {pinError && <p className="text-xs font-bold text-rose-500">{pinError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
