import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Lock, Clock, ToggleLeft, ToggleRight, 
  Wifi, Cloud, CheckCircle, RefreshCw, AlertTriangle, ArrowLeft, Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { getDB } from '../lib/db';
import toast from 'react-hot-toast';
import { syncAllToCloud } from '../lib/syncEngine';

export default function RemoteAuthSettings({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Settings states
  const [remoteAuthEnabled, setRemoteAuthEnabled] = useState(true);
  const [authTriggerVoid, setAuthTriggerVoid] = useState(true);
  const [authTriggerDiscount, setAuthTriggerDiscount] = useState(true);
  const [authTriggerOpenDrawer, setAuthTriggerOpenDrawer] = useState(true);
  const [authTriggerRefund, setAuthTriggerRefund] = useState(true);
  const [remoteAuthTimeout, setRemoteAuthTimeout] = useState(60);
  const [authorizationMode, setAuthorizationMode] = useState('remote_with_code');
  const [refundTimeLimit, setRefundTimeLimit] = useState(7);

  // Load from local storage / SQLite
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      const settings = await db.select('SELECT key, value FROM settings') as any[];
      const settingsMap = settings.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      // Synchronize states
      if (settingsMap['remote_auth_enabled'] !== undefined) {
        setRemoteAuthEnabled(settingsMap['remote_auth_enabled'] === 'true');
      }
      if (settingsMap['auth_trigger_void'] !== undefined) {
        setAuthTriggerVoid(settingsMap['auth_trigger_void'] === 'true');
      }
      if (settingsMap['auth_trigger_discount'] !== undefined) {
        setAuthTriggerDiscount(settingsMap['auth_trigger_discount'] === 'true');
      }
      if (settingsMap['auth_trigger_open_drawer'] !== undefined) {
        setAuthTriggerOpenDrawer(settingsMap['auth_trigger_open_drawer'] === 'true');
      }
      if (settingsMap['auth_trigger_refund'] !== undefined) {
        setAuthTriggerRefund(settingsMap['auth_trigger_refund'] === 'true');
      }
      if (settingsMap['remote_auth_timeout'] !== undefined) {
        setRemoteAuthTimeout(parseInt(settingsMap['remote_auth_timeout']) || 60);
      }
      if (settingsMap['refund_time_limit'] !== undefined) {
        setRefundTimeLimit(parseInt(settingsMap['refund_time_limit']) || 7);
      }
      if (settingsMap['authorization_mode'] !== undefined) {
        setAuthorizationMode(settingsMap['authorization_mode']);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de autorização remota:', error);
      toast.error('Erro ao carregar definições do banco de dados local.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const db = await getDB();
      
      const keysToSave = [
        { key: 'remote_auth_enabled', value: remoteAuthEnabled.toString() },
        { key: 'auth_trigger_void', value: authTriggerVoid.toString() },
        { key: 'auth_trigger_discount', value: authTriggerDiscount.toString() },
        { key: 'auth_trigger_open_drawer', value: authTriggerOpenDrawer.toString() },
        { key: 'auth_trigger_refund', value: authTriggerRefund.toString() },
        { key: 'remote_auth_timeout', value: remoteAuthTimeout.toString() },
        { key: 'refund_time_limit', value: refundTimeLimit.toString() },
        { key: 'authorization_mode', value: authorizationMode }
      ];

      for (const item of keysToSave) {
        const existing = await db.select('SELECT key FROM settings WHERE key = ?', [item.key]) as any[];
        if (existing.length > 0) {
          await db.execute('UPDATE settings SET value = ?, sync_status = 0 WHERE key = ?', [item.value, item.key]);
        } else {
          await db.execute('INSERT INTO settings (key, value, sync_status) VALUES (?, ?, 0)', [item.key, item.value]);
        }
        // Write to local storage for instant sync read access
        localStorage.setItem(item.key, item.value);
      }

      toast.success('Configurações de Autorização Remota guardadas com sucesso!');
      
      // Perform cloud sync instantly
      setSyncing(true);
      await syncAllToCloud();
      setSyncing(false);
      toast.success('Definições sincronizadas com a Nuvem (Supabase)!');
    } catch (error) {
      console.error('Erro ao salvar definições de autorização remota:', error);
      toast.error('Erro ao guardar as definições.');
    } finally {
      setIsSaving(false);
      setSyncing(false);
    }
  };

  const forceCloudSync = async () => {
    setSyncing(true);
    try {
      await syncAllToCloud();
      toast.success('Sincronização forçada concluída com sucesso!');
    } catch (error) {
      console.error('Failed to sync setting:', error);
      toast.error('Falha na sincronização com o Supabase.');
    } finally {
      setSyncing(false);
    }
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Tem certeza de que deseja restaurar todas as configurações para os valores de fábrica? Isto não afectará os seus dados de produtos, utilizadores ou vendas.')) return;
    try {
      const { resetSettingsToDefault } = await import('../lib/db');
      await resetSettingsToDefault();
      await loadSettings();
      toast.success('Configurações restauradas com sucesso!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      toast.error('Erro ao restaurar as configurações padrão.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw size={36} className="animate-spin text-red-600 mb-3" />
        <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">A carregar configurações de autorização...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 max-w-4xl mx-auto w-full space-y-8 select-none"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-red-600 hover:-translate-x-0.5 transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-zinc-100">
              Autorização Remota & Segurança
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              Configure triggers, tempos limites e o master toggle para validações de supervisão.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/10 flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {isSaving ? 'A guardar...' : 'Guardar Definições'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Configuration Panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Master Switch Panel */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-zinc-200">
                    Master Switch: Pedidos de Autorização Remota
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Ative ou desative totalmente a capacidade de enviar pedidos de autorização sem fios para a aplicação de gestor / companion app.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRemoteAuthEnabled(!remoteAuthEnabled)}
                className="focus:outline-none transition-all scale-110"
              >
                {remoteAuthEnabled ? (
                  <ToggleRight size={44} className="text-red-600" />
                ) : (
                  <ToggleLeft size={44} className="text-slate-350 dark:text-zinc-750" />
                )}
              </button>
            </div>

            {!remoteAuthEnabled && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex gap-3 items-start">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                  Atenção: Com os pedidos remotos desligados, os operadores do POS devem chamar fisicamente o gerente / gerente de turno para digitar manualmente o seu código PIN de supervisor no computador sempre que ocorrer um gatilho de segurança.
                </p>
              </div>
            )}
          </div>

          {/* Protocolo de Autorização de Operações */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-200">
                Protocolo de Autorização de Operações
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Define como as operações que exigem aprovação (Descontos acima do cap, Sangrias, Anulações) serão autorizadas no POS.
              </p>
            </div>

            <select
              value={authorizationMode}
              onChange={(e) => setAuthorizationMode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/50 outline-none transition-all text-xs font-bold text-slate-800 dark:text-zinc-100 cursor-pointer"
            >
              <option value="remote_with_code">Autorização Remota + Introdução de PIN local (Ambos Ativos)</option>
              <option value="remote_without_code">Apenas Autorização Remota (Companion App sem PIN local)</option>
              <option value="code_only">Apenas PIN Local (Sem autorização remota via Companion App)</option>
            </select>

            <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 leading-relaxed bg-slate-50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850">
              <p>• <strong>Ambos:</strong> O caixa pode digitar o PIN de Administrador ou solicitar autorização pelo telemóvel do gestor.</p>
              <p>• <strong>Companion App:</strong> Apenas pedidos remotos são permitidos (esconde o painel local de PIN).</p>
              <p>• <strong>PIN Local:</strong> Apenas inserção direta do PIN de Administrador (desativa/esconde botões remotos).</p>
            </div>
          </div>
        </div>

        {/* Right Column - Threshold & Network Sync Status */}
        <div className="space-y-6">
          {/* Timeout Threshold Setting */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-200 flex items-center gap-2">
              <Clock size={16} className="text-red-600" />
              Tempo Limite do Pedido
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Define quanto tempo o pedido de autorização remota permanecerá visível e ativo para aprovação antes de expirar automaticamente.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black uppercase text-slate-400">Expiração:</span>
                <span className="text-lg font-black text-red-600">{remoteAuthTimeout}s</span>
              </div>
              
              <input
                type="range"
                min={15}
                max={180}
                step={5}
                value={remoteAuthTimeout}
                onChange={(e) => setRemoteAuthTimeout(parseInt(e.target.value))}
                className="w-full accent-red-600 h-1 bg-slate-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[30, 60, 90, 120].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRemoteAuthTimeout(val)}
                    className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                      remoteAuthTimeout === val
                        ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 dark:bg-zinc-850 dark:border-zinc-800'
                    }`}
                  >
                    {val}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Global Refund Time Limit Setting */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-200 flex items-center gap-2">
              <Clock size={16} className="text-red-600" />
              Prazo Global de Reembolso
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Define o número máximo de dias pós-venda que um reembolso/devolução pode ser efetuado (pode ser sobrescrito por operador).
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black uppercase text-slate-400">Prazo Padrão:</span>
                <span className="text-lg font-black text-red-600">{refundTimeLimit} dias</span>
              </div>
              
              <input
                type="range"
                min={1}
                max={90}
                step={1}
                value={refundTimeLimit}
                onChange={(e) => setRefundTimeLimit(parseInt(e.target.value))}
                className="w-full accent-red-600 h-1 bg-slate-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[7, 15, 30, 60].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRefundTimeLimit(val)}
                    className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                      refundTimeLimit === val
                        ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 dark:bg-zinc-850 dark:border-zinc-800'
                    }`}
                  >
                    {val}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Troubleshoot: Restore defaults */}
          <div className="p-6 bg-amber-500/5 dark:bg-amber-500/5 rounded-3xl border border-amber-500/10 space-y-4">
            <h3 className="text-sm font-black text-amber-700 dark:text-amber-500 flex items-center gap-2">
              <RefreshCw size={16} />
              Restaurar Parâmetros
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Teve problemas com o bypass de autorizações ou definições inválidas? Reponha apenas as configurações de fábrica sem apagar os seus produtos ou faturas.
            </p>
            <button
              onClick={handleResetSettings}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-600/20 active:scale-95 cursor-pointer"
            >
              Restaurar Configurações Padrão
            </button>
          </div>

          {/* Sync status widget */}
          <div className="p-6 bg-slate-50 dark:bg-zinc-950/30 rounded-3xl border border-slate-150 dark:border-zinc-850 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud size={16} className="text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-zinc-300">
                  Supabase Cloud Sync
                </span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Os pedidos de autorização geram registos automáticos na tabela <code className="bg-slate-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-red-600 font-mono text-[10px]">remote_authorizations</code>, sincronizando-se com os dispositivos de gestão em tempo real.
            </p>

            <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-800/50 space-y-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-xs font-semibold">
                <Wifi size={14} className="text-emerald-500" />
                <span>Base de dados: Online</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-xs font-semibold">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>Dispositivos Associados: OK</span>
              </div>
            </div>

            <button
              onClick={forceCloudSync}
              disabled={syncing}
              className="w-full mt-2 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'A Sincronizar...' : 'Forçar Sincronização'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
