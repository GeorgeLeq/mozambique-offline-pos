import { useState, useEffect, useCallback } from 'react';
import { getDB } from '../../../lib/db';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { PosAnnouncement, syncPosAnnouncementsToCloud, syncPosAnnouncementsFromCloud } from '../../../lib/syncEngine/posAnnouncements';
import toast from 'react-hot-toast';

// Gentle Web Audio API synthesizer chime for arrival of new broadcast messages
function playNotificationChime(isUrgent = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (isUrgent) {
      // High-priority two-tone alert
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1174.66, now + 0.15); // D6
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(587.33, now + 0.15);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } else {
      // Normal pleasant double chime
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);
    }
  } catch (e) {
    // AudioContext autoplay might be restricted before first click
  }
}

export function usePosAnnouncements(currentUser: any) {
  const [announcements, setAnnouncements] = useState<PosAnnouncement[]>([]);
  const [activeUrgentModal, setActiveUrgentModal] = useState<PosAnnouncement | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadAnnouncements = useCallback(async () => {
    try {
      const db = await getDB();
      const currentCashierId = currentUser?.id || '';

      const list = await db.select(`
        SELECT * FROM pos_announcements
        WHERE is_acknowledged = 0
          AND (cashier_id IS NULL OR cashier_id = '' OR cashier_id = ?)
        ORDER BY priority = 'urgent' DESC, created_at DESC
      `, [currentCashierId]) as PosAnnouncement[];

      setAnnouncements(list);
      setUnreadCount(list.length);

      // If there's an unacknowledged urgent announcement, prompt it
      const urgent = list.find(a => a.priority === 'urgent');
      if (urgent) {
        setActiveUrgentModal(urgent);
      } else {
        setActiveUrgentModal(null);
      }
    } catch (err) {
      console.warn('Failed to load local pos_announcements', err);
    }
  }, [currentUser]);

  // Acknowledge single announcement
  const acknowledgeAnnouncement = async (id: string) => {
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      await db.execute(
        'UPDATE pos_announcements SET is_acknowledged = 1, acknowledged_at = ?, sync_status = 0 WHERE id = ?',
        [now, id]
      );

      // Re-fetch
      await loadAnnouncements();

      // Background upload acknowledgment to Supabase
      syncPosAnnouncementsToCloud().catch(() => {});
      toast.success('Mensagem confirmada e dispensada.');
    } catch (err) {
      console.error('Failed to acknowledge announcement', err);
      toast.error('Erro ao confirmar leitura.');
    }
  };

  // Acknowledge all active announcements
  const acknowledgeAll = async () => {
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      const ids = announcements.map(a => a.id);
      if (ids.length === 0) return;

      const placeholders = ids.map(() => '?').join(',');
      await db.execute(
        `UPDATE pos_announcements SET is_acknowledged = 1, acknowledged_at = ?, sync_status = 0 WHERE id IN (${placeholders})`,
        [now, ...ids]
      );

      await loadAnnouncements();
      syncPosAnnouncementsToCloud().catch(() => {});
      toast.success('Todas as mensagens foram marcadas como lidas.');
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Failed to acknowledge all announcements', err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    syncPosAnnouncementsFromCloud().then(() => loadAnnouncements());

    // Listen to local engine dispatch
    const handleUpdate = () => {
      loadAnnouncements();
      playNotificationChime(false);
    };
    window.addEventListener('pos-announcements-updated', handleUpdate);

    // Setup Supabase Realtime channel subscription
    let channel: any = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel('pos_announcements_live_feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pos_announcements' },
          async (payload) => {
            console.log('[Realtime POS Announcement]', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const item = payload.new as any;
              const db = await getDB();
              await db.execute(
                `INSERT OR REPLACE INTO pos_announcements 
                 (id, shop_id, cashier_id, target_name, message, priority, is_acknowledged, acknowledged_at, created_at, sync_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                  item.id,
                  item.shop_id,
                  item.cashier_id || null,
                  item.target_name || 'All Cashiers',
                  item.message,
                  item.priority || 'normal',
                  item.is_acknowledged ? 1 : 0,
                  item.acknowledged_at || null,
                  item.created_at
                ]
              );
              await loadAnnouncements();
              playNotificationChime(item.priority === 'urgent');

              if (item.priority === 'urgent') {
                toast.error(`MENSAGEM URGENTE: ${item.message}`, { duration: 6000 });
              } else {
                toast(`Mensagem da Administração: ${item.message}`, {
                  icon: '📢',
                  duration: 5000
                });
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('pos-announcements-updated', handleUpdate);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadAnnouncements]);

  return {
    announcements,
    unreadCount,
    activeUrgentModal,
    setActiveUrgentModal,
    isDrawerOpen,
    setIsDrawerOpen,
    acknowledgeAnnouncement,
    acknowledgeAll,
    reloadAnnouncements: loadAnnouncements
  };
}
