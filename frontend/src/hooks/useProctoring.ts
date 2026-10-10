import { useEffect, useRef, useState } from 'react';
import { sendProctoringEvent } from '@/api/proctoring';
import type { ProctoringEventType } from '@/types';

/** Fire-and-forget: a lost event must never break the attempt. */
export function reportProctoringEvent(olympiadId: string, eventType: ProctoringEventType, metadata: string) {
  void sendProctoringEvent({ olympiadId, eventType, metadata }).catch(() => undefined);
}

interface BrowserSignals {
  tabSwitches: number;
  isFullscreen: boolean;
}

/** Tab visibility, fullscreen and clipboard paste during an attempt. */
export function useBrowserProctoring(olympiadId: string, enabled: boolean): BrowserSignals {
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const lastPasteAt = useRef(0);

  useEffect(() => {
    if (!enabled || !olympiadId) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitches((count) => count + 1);
        reportProctoringEvent(olympiadId, 'TAB_SWITCH', 'Пользователь переключил вкладку');
      }
    };

    const onFullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        reportProctoringEvent(olympiadId, 'FULLSCREEN_EXIT', 'Выход из полноэкранного режима');
      }
    };

    const onPaste = (event: ClipboardEvent) => {
      const length = event.clipboardData?.getData('text')?.length ?? 0;
      // Short pastes (a variable name) are noise; also collapse bursts into one event.
      if (length < 20 || Date.now() - lastPasteAt.current < 10_000) return;
      lastPasteAt.current = Date.now();
      reportProctoringEvent(olympiadId, 'COPY_PASTE', `Вставка из буфера обмена: ${length} символов`);
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('paste', onPaste);
    };
  }, [enabled, olympiadId]);

  return { tabSwitches, isFullscreen };
}

export async function enterFullscreen() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    // The browser may refuse (iframe, iOS Safari). The attempt still works.
  }
}

export async function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    // Already closing.
  }
}
