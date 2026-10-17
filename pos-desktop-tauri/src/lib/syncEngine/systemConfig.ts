import { getDB } from '../db';
import { supabase, isSupabaseConfigured } from '../supabase';

export interface SystemConfig {
  id: string;
  latest_version: string;
  minimum_required_version: string;
  update_notes?: string;
  download_url?: string;
  support_whatsapp: string;
  updated_at?: string;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  minVersion: string;
  updateNotes: string;
  downloadUrl: string;
  supportWhatsapp: string;
  isHardBlocked: boolean;
  isSoftUpdateAvailable: boolean;
}

export const CURRENT_APP_VERSION = '1.0.0';
export const DEFAULT_SUPPORT_WHATSAPP = '+258871668217';

/**
 * Parses and compares two semver strings (e.g. "1.2.0" vs "1.1.0").
 * Returns:
 *  -1 if v1 < v2
 *   0 if v1 === v2
 *   1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = (v1 || '0.0.0').replace(/^v/, '').trim();
  const clean2 = (v2 || '0.0.0').replace(/^v/, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}

/**
 * Background synchronization of system_config from Supabase into local SQLite.
 * Uses defensive fallback if the dedicated table does not exist in Supabase yet.
 */
export async function syncSystemConfigFromCloud(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const db = await getDB();

    // 1. Try querying dedicated 'system_config' table in Supabase
    let cloudConfig: any = null;
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      cloudConfig = data;
    } else if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      // Fallback: Check 'settings' table in Supabase for version keys
      const { data: sData } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['latest_version', 'minimum_required_version', 'update_notes', 'download_url', 'support_whatsapp']);

      if (sData && sData.length > 0) {
        const mapped: Record<string, string> = {};
        sData.forEach(row => { mapped[row.key] = row.value; });
        cloudConfig = {
          id: 'app_ota_config',
          latest_version: mapped.latest_version || CURRENT_APP_VERSION,
          minimum_required_version: mapped.minimum_required_version || CURRENT_APP_VERSION,
          update_notes: mapped.update_notes || '',
          download_url: mapped.download_url || '',
          support_whatsapp: mapped.support_whatsapp || DEFAULT_SUPPORT_WHATSAPP,
          updated_at: new Date().toISOString()
        };
      }
    }

    if (!cloudConfig) {
      return false;
    }

    // Save into local SQLite
    await db.execute(
      `INSERT OR REPLACE INTO system_config 
       (id, latest_version, minimum_required_version, update_notes, download_url, support_whatsapp, updated_at, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        cloudConfig.id || 'app_ota_config',
        cloudConfig.latest_version || CURRENT_APP_VERSION,
        cloudConfig.minimum_required_version || CURRENT_APP_VERSION,
        cloudConfig.update_notes || 'Melhorias de desempenho e actualização do sistema',
        cloudConfig.download_url || '',
        cloudConfig.support_whatsapp || DEFAULT_SUPPORT_WHATSAPP,
        cloudConfig.updated_at || new Date().toISOString()
      ]
    );

    console.log('[System Config] Synced cloud configuration successfully:', cloudConfig.latest_version);
    return true;
  } catch (err: any) {
    console.warn('[System Config] Sync failed (offline or network error):', err?.message || err);
    return false;
  }
}

/**
 * Retrieves the currently active system config from local SQLite.
 */
export async function getLocalSystemConfig(): Promise<SystemConfig> {
  try {
    const db = await getDB();
    const rows = await db.select(
      "SELECT * FROM system_config WHERE id = 'app_ota_config' LIMIT 1"
    ) as SystemConfig[];

    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (e) {
    console.warn('[System Config] Could not read local system_config:', e);
  }

  // Default fallback if table is empty
  return {
    id: 'app_ota_config',
    latest_version: CURRENT_APP_VERSION,
    minimum_required_version: CURRENT_APP_VERSION,
    update_notes: 'Melhorias de estabilidade e actualizações de segurança.',
    download_url: '',
    support_whatsapp: DEFAULT_SUPPORT_WHATSAPP
  };
}

/**
 * Checks for app updates, pulling latest cloud rules if online,
 * and comparing with current version.
 */
export async function checkAppUpdate(): Promise<UpdateCheckResult> {
  // If online, perform quick sync to get freshest rules
  if (navigator.onLine && isSupabaseConfigured()) {
    await syncSystemConfigFromCloud();
  }

  const config = await getLocalSystemConfig();
  const currentVersion = CURRENT_APP_VERSION;
  const latestVersion = config.latest_version || CURRENT_APP_VERSION;
  const minVersion = config.minimum_required_version || CURRENT_APP_VERSION;

  const isHardBlocked = compareVersions(currentVersion, minVersion) < 0;
  const isSoftUpdateAvailable = !isHardBlocked && compareVersions(currentVersion, latestVersion) < 0;

  return {
    currentVersion,
    latestVersion,
    minVersion,
    updateNotes: config.update_notes || 'Melhorias de desempenho e correções gerais.',
    downloadUrl: config.download_url || '',
    supportWhatsapp: config.support_whatsapp || DEFAULT_SUPPORT_WHATSAPP,
    isHardBlocked,
    isSoftUpdateAvailable
  };
}

/**
 * Generates and opens a WhatsApp support deep link with pre-filled POS details.
 */
export async function openSupportWhatsApp(details?: {
  shopName?: string;
  terminalName?: string;
  currentVersion?: string;
  requiredVersion?: string;
  reason?: string;
  phoneNumber?: string;
}): Promise<void> {
  let shopName = details?.shopName;
  let terminalName = details?.terminalName;

  try {
    const db = await getDB();
    if (!shopName) {
      const s = await db.select("SELECT value FROM settings WHERE key = 'shop_name'") as { value: string }[];
      shopName = s?.[0]?.value || 'Minha Loja';
    }
    if (!terminalName) {
      const t = await db.select("SELECT value FROM settings WHERE key = 'terminal_name'") as { value: string }[];
      terminalName = t?.[0]?.value || 'Caixa 01';
    }
  } catch {}

  const rawPhone = details?.phoneNumber || DEFAULT_SUPPORT_WHATSAPP;
  const cleanPhone = rawPhone.replace(/\D/g, '');

  const msg = 
`*SOLICITAÇÃO DE SUPORTE - MOZAMBIQUE POS* 🇲🇿
--------------------------------------
*Loja:* ${shopName || 'Loja POS'}
*Terminal:* ${terminalName || 'Terminal'}
*Versão Actual:* v${details?.currentVersion || CURRENT_APP_VERSION}
*Versão Necessária:* v${details?.requiredVersion || '1.0.0'}
*Situação:* ${details?.reason || 'Actualização Obrigatória de Sistema'}
--------------------------------------
_Olá equipa de suporte, preciso de assistência técnica para atualizar o meu terminal POS._`;

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}

/**
 * Initiates the OTA update download using Tauri v2 plugin or browser simulation.
 */
export async function downloadAndInstallTauriUpdate(
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<{ success: boolean; message: string }> {
  const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);

  if (isTauri) {
    try {
      onProgress?.(10, 'A verificar assinatura de segurança no servidor...');
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (!update) {
        return { success: false, message: 'Nenhuma actualização detectada no servidor.' };
      }

      onProgress?.(25, 'A descarregar pacote OTA...');
      let downloadedBytes = 0;
      let totalBytes = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === 'Started' && event.data.contentLength) {
          totalBytes = event.data.contentLength;
          onProgress?.(30, `A descarregar actualização (${Math.round(totalBytes / 1024 / 1024)} MB)...`);
        } else if (event.event === 'Progress') {
          downloadedBytes += event.data.chunkLength;
          const percent = totalBytes > 0 
            ? Math.min(95, Math.round(30 + (downloadedBytes / totalBytes) * 65))
            : 60;
          onProgress?.(percent, `A descarregar actualização (${Math.round(downloadedBytes / 1024)} KB)...`);
        } else if (event.event === 'Finished') {
          onProgress?.(98, 'Actualização descarregada. A preparar reinício...');
        }
      });

      onProgress?.(100, 'Actualização instalada! A reiniciar o sistema...');
      
      // Wait 1 second before relaunch so user sees 100% completion
      setTimeout(async () => {
        try {
          const { relaunch } = await import('@tauri-apps/plugin-process');
          await relaunch();
        } catch (e) {
          console.warn('[Updater] Relaunch failed, please restart app manually:', e);
        }
      }, 1000);

      return { success: true, message: 'Actualização instalada com sucesso!' };
    } catch (err: any) {
      console.error('[Updater] Tauri OTA update failed:', err);
      return { 
        success: false, 
        message: err?.message || 'Falha ao descarregar a actualização. Verifique a sua ligação à internet.' 
      };
    }
  }

  // Browser / Development Mode Simulation
  return new Promise((resolve) => {
    onProgress?.(15, 'Modo Web/Simulação: A ligar ao servidor de actualizações...');
    setTimeout(() => {
      onProgress?.(45, 'A descarregar patch diferencial (4.2 MB)...');
      setTimeout(() => {
        onProgress?.(80, 'A verificar integridade criptográfica SHA-256...');
        setTimeout(() => {
          onProgress?.(100, 'Actualização pronta! (Em ambiente Windows real, o sistema reiniciaria agora).');
          resolve({
            success: true,
            message: 'Simulação de actualização concluída com sucesso!'
          });
        }, 1200);
      }, 1200);
    }, 1000);
  });
}
