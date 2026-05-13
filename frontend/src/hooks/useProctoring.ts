import { useEffect } from 'react';
import { sendProctoringEvent } from '@/api/proctoring';
import type { LocalProctoringEntry, User } from '@/types';
import { saveLocalProctoringEvent } from '@/utils/localHistory';

interface UseProctoringOptions {
  olympiadId: string;
  enabled: boolean;
  user: User | null;
}

export function useProctoring({ olympiadId, enabled, user }: UseProctoringOptions) {
  useEffect(() => {
    if (!enabled || !olympiadId) return;

    let active = true;

    const emit = (eventType: LocalProctoringEntry['eventType'], metadata: string) => {
      if (!active) return;

      const payload = {
        olympiadId,
        eventType: eventType as 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'FACE_MISSING' | 'SUSPICIOUS_FLAG',
        metadata,
      };

      saveLocalProctoringEvent({
        id: crypto.randomUUID(),
        olympiadId,
        userEmail: user?.email ?? 'unknown',
        userName: user?.fullName ?? 'Неизвестный участник',
        eventType,
        metadata,
        createdAt: new Date().toISOString(),
        isFlagged: eventType !== 'TAB_SWITCH',
      });

      void sendProctoringEvent(payload).catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        emit('TAB_SWITCH', 'Пользователь переключил вкладку');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        emit('FULLSCREEN_EXIT', 'Пользователь вышел из полноэкранного режима');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, olympiadId, user?.email, user?.fullName]);
}
