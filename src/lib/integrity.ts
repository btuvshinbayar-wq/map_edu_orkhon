import type { IntegrityReport, LeaveEvent } from '../types';

type Kind = LeaveEvent['kinds'][number];

/**
 * Уралдааны шударга байдал: оролцогч өөр цонх, таб, апп руу шилжсэнийг илрүүлж бүртгэнэ.
 * Вэб хуудас Alt+Tab-ыг хориглож чадахгүй тул "хориглох" биш "илрүүлж, бүртгэж, хязгаарлах" зарчимтай.
 *
 * Нэг "гарсан" мөчлөг = аль нэг нөхцөл (таб далд, цонхны фокус алдагдсан) эхэлснээс бүх нөхцөл арилах хүртэл.
 * `hidden` (таб/апп солигдсон) нь шууд тооцогдоно. Зөвхөн фокус алдагдсан (`blur`) нь богино (ойролцоогоор 0.7 сек-ээс
 * бага) бол мэдэгдэл, санамсаргүй товшилт гэж үзэж тооцохгүй.
 */
export class IntegrityTracker {
  private active = false;
  private cond = new Set<Kind>();
  private kinds = new Set<Kind>();
  private since = 0;
  private question = 0;
  private leaves = 0;
  private awayMs = 0;
  private events: LeaveEvent[] = [];
  private blocked = 0;
  private fullscreen = false;
  private terminated: IntegrityReport['terminatedReason'] | null = null;

  constructor(private graceMs = 700, private maxEvents = 50) {}

  start(): void {
    this.active = true;
    this.cond.clear(); this.kinds.clear();
    this.leaves = 0; this.awayMs = 0; this.events = []; this.blocked = 0; this.fullscreen = false; this.terminated = null;
  }

  stop(now: number): void {
    if (this.active && this.cond.size > 0) this.settle(now);
    this.active = false;
  }

  get isActive() { return this.active; }
  get isAway() { return this.cond.size > 0; }
  get count() { return this.leaves; }
  get totalAwayMs() { return this.awayMs; }

  setQuestion(i: number) { this.question = i; }
  markFullscreen() { this.fullscreen = true; }
  markTerminated(reason: NonNullable<IntegrityReport['terminatedReason']>) { this.terminated = reason; }
  blockedAction() { if (this.active) this.blocked += 1; }

  /** Нөхцөл эхэлнэ. Мөчлөг шинээр эхэлсэн бол true */
  leave(kind: Kind, now: number): boolean {
    if (!this.active) return false;
    const was = this.cond.size > 0;
    this.cond.add(kind);
    this.kinds.add(kind);
    if (!was) this.since = now;
    return !was;
  }

  /** Нөхцөл арилна. Мөчлөг дуусч бүртгэгдсэн бол тэр үйл явдлыг буцаана */
  clear(kind: Kind, now: number): LeaveEvent | null {
    if (!this.active || !this.cond.has(kind)) return null;
    this.cond.delete(kind);
    return this.cond.size === 0 ? this.settle(now) : null;
  }

  /** Бүтэн дэлгэцээс гарсан (нэг удаагийн үйл явдал) */
  fullscreenExit(now: number): LeaveEvent | null {
    if (!this.active || !this.fullscreen) return null;
    this.leaves += 1;
    const ev: LeaveEvent = { at: now, ms: 0, kinds: ['fullscreen_exit'], question: this.question };
    this.push(ev);
    return ev;
  }

  private settle(now: number): LeaveEvent | null {
    const ms = Math.max(0, now - this.since);
    const kinds = Array.from(this.kinds);
    this.cond.clear(); this.kinds.clear();
    if (ms < this.graceMs && !kinds.includes('hidden')) return null; // богино фокус алдалт
    this.leaves += 1;
    this.awayMs += ms;
    const ev: LeaveEvent = { at: this.since, ms, kinds, question: this.question };
    this.push(ev);
    return ev;
  }

  private push(ev: LeaveEvent) {
    if (this.events.length < this.maxEvents) this.events.push(ev);
  }

  report(): IntegrityReport {
    return {
      windowLeaves: this.leaves,
      awayMs: this.awayMs,
      events: [...this.events],
      fullscreenUsed: this.fullscreen,
      blockedActions: this.blocked,
      terminated: this.terminated !== null,
      ...(this.terminated ? { terminatedReason: this.terminated } : {}),
    };
  }
}

/** Админы тохиргоо: цонх сольж болох дээд тоо (0 = зөвхөн бүртгэнэ) */
export const normalizeMaxLeaves = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(20, Math.max(0, n)) : 0;
};

export const limitExceeded = (leaves: number, max: number): boolean => max > 0 && leaves > max;
