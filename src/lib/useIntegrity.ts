import { useCallback, useEffect, useRef, useState } from 'react';
import { IntegrityTracker, limitExceeded } from './integrity';
import type { LeaveEvent } from '../types';

interface Options {
  /** Одоо уралдаан үргэлжилж байна (эхэлсэн, дуусаагүй) */
  active: boolean;
  /** Одоо хэддүгээр асуулт дээр байгаа (бүртгэлд орно) */
  question: number;
  /** Цонх сольж болох дээд тоо. 0 = зөвхөн бүртгэнэ */
  maxLeaves: number;
  /** Эхлэх мөчид бүтэн дэлгэцэд орохыг оролдоно (хэрэглэгчийн товшилтын дараа) */
  fullscreenOnStart?: boolean;
  /** Дээд тоо хэтэрсэн үед нэг удаа дуудагдана */
  onLimit?: () => void;
  /** Цонхоос буцаж ирэхэд бүртгэгдсэн үйл явдал */
  onLeave?: (ev: LeaveEvent, count: number) => void;
}

const BLOCKED_KEYS = new Set(['c', 'v', 'x', 'p', 's', 'u']);

/**
 * Уралдааны үед цонх/таб солилтыг илрүүлж бүртгэнэ, бүтэн дэлгэцийг дэмжинэ, хуулах/буулгах/баруун товшилтыг хаана.
 * Анхаар: хөтөч Alt+Tab, өөр төхөөрөмж ашиглахыг ХОРИГЛОЖ чадахгүй, зөвхөн илрүүлж бүртгэнэ.
 */
export function useIntegrity({ active, question, maxLeaves, onLimit, onLeave, fullscreenOnStart }: Options) {
  const tracker = useRef(new IntegrityTracker()).current;
  const [leaves, setLeaves] = useState(0);
  const [awayMs, setAwayMs] = useState(0);
  const [isAway, setIsAway] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const limitFired = useRef(false);
  const cb = useRef({ onLimit, onLeave, maxLeaves });
  cb.current = { onLimit, onLeave, maxLeaves };

  const sync = useCallback(() => {
    setLeaves(tracker.count);
    setAwayMs(tracker.totalAwayMs);
    setIsAway(tracker.isAway);
  }, [tracker]);

  useEffect(() => { tracker.setQuestion(question); }, [tracker, question]);

  const record = useCallback((ev: LeaveEvent | null) => {
    sync();
    if (!ev) return;
    cb.current.onLeave?.(ev, tracker.count);
    if (!limitFired.current && limitExceeded(tracker.count, cb.current.maxLeaves)) {
      limitFired.current = true;
      cb.current.onLimit?.();
    }
  }, [sync, tracker]);

  /** Хэрэглэгчийн товшилтоор бүтэн дэлгэцэд орно (ингэж л хөтөч зөвшөөрдөг) */
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      if (!document.documentElement.requestFullscreen) return false;
      await document.documentElement.requestFullscreen();
      tracker.markFullscreen();
      setFullscreen(true);
      return true;
    } catch {
      return false;
    }
  }, [tracker]);

  useEffect(() => {
    if (!active) return;
    tracker.start();
    limitFired.current = false;
    sync();
    if (fullscreenOnStart) void enterFullscreen();

    const onVisibility = () => {
      if (document.hidden) { tracker.leave('hidden', Date.now()); sync(); }
      else record(tracker.clear('hidden', Date.now()));
    };
    const onBlur = () => { tracker.leave('blur', Date.now()); sync(); };
    const onFocus = () => record(tracker.clear('blur', Date.now()));
    const onFullscreen = () => {
      setFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) record(tracker.fullscreenExit(Date.now()));
    };
    const block = (e: Event) => { e.preventDefault(); tracker.blockedAction(); };
    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || '').toLowerCase();
      if (((e.ctrlKey || e.metaKey) && BLOCKED_KEYS.has(k)) || k === 'f12' || k === 'printscreen') block(e);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('fullscreenchange', onFullscreen);
    for (const t of ['copy', 'cut', 'paste', 'contextmenu', 'dragstart', 'selectstart']) document.addEventListener(t, block);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('fullscreenchange', onFullscreen);
      for (const t of ['copy', 'cut', 'paste', 'contextmenu', 'dragstart', 'selectstart']) document.removeEventListener(t, block);
      document.removeEventListener('keydown', onKey);
      tracker.stop(Date.now());
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
      sync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { tracker, leaves, awayMs, isAway, fullscreen, enterFullscreen };
}
