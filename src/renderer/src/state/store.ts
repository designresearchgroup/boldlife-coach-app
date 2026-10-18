import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  PROGRAM,
  PASS_MARK,
  ENTITLEMENT_ACADEMY,
  type Role,
  type Level,
  type Module
} from '@renderer/data/curriculum'
import type { Contact, Broadcast, Sequence } from '@renderer/services/email'

export type View =
  | 'dashboard'
  | 'learn'
  | 'lesson'
  | 'quiz'
  | 'certificate'
  | 'session'
  | 'liveclass'
  | 'pricing'
  | 'coach'
  | 'email'

export interface Recording {
  id: string
  name: string
  at: number
  savedPath?: string
}

export interface Nav {
  view: View
  levelId?: string
  moduleId?: string
  lessonId?: string
}

export interface State {
  role: Role
  theme: 'dark' | 'light' | null
  learnerName: string
  completedLessons: Record<string, boolean>
  lessonPos: Record<string, number> // lessonId -> seconds watched (resume point)
  quizScores: Record<string, number> // moduleId -> best %
  entitlements: Record<string, boolean>
  recordings: Recording[]
  contacts: Contact[]
  broadcasts: Broadcast[]
  sequences: Sequence[]
  nav: Nav

  setRole: (r: Role) => void
  toggleTheme: () => void
  setName: (n: string) => void
  go: (view: View, p?: Partial<Omit<Nav, 'view'>>) => void
  completeLesson: (id: string) => void
  setLessonPos: (id: string, seconds: number) => void
  recordQuiz: (moduleId: string, score: number) => void
  enroll: (key: string) => void
  addRecording: (r: Recording) => void
  addContact: (c: Contact) => void
  removeContact: (id: string) => void
  addBroadcast: (b: Broadcast) => void
  updateBroadcast: (id: string, patch: Partial<Broadcast>) => void
  addSequence: (seq: Sequence) => void
  updateSequence: (id: string, patch: Partial<Sequence>) => void
  removeSequence: (id: string) => void
  resetProgress: () => void
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      role: 'client',
      theme: null,
      learnerName: 'Alex Rivera',
      completedLessons: {},
      lessonPos: {},
      quizScores: {},
      entitlements: {},
      recordings: [],
      contacts: [],
      broadcasts: [],
      sequences: [],
      nav: { view: 'dashboard' },

      setRole: (role) => set({ role }),
      toggleTheme: () =>
        set((s) => {
          // Light is the default; dark is the opt-in. First toggle goes to dark.
          const cur = s.theme ?? 'light'
          return { theme: cur === 'dark' ? 'light' : 'dark' }
        }),
      setName: (learnerName) => set({ learnerName }),
      go: (view, p) => set({ nav: { view, ...p } }),
      completeLesson: (id) =>
        set((s) => ({ completedLessons: { ...s.completedLessons, [id]: true } })),
      setLessonPos: (id, seconds) =>
        set((s) => ({ lessonPos: { ...s.lessonPos, [id]: seconds } })),
      recordQuiz: (moduleId, score) =>
        set((s) => ({
          quizScores: {
            ...s.quizScores,
            [moduleId]: Math.max(score, s.quizScores[moduleId] ?? 0)
          }
        })),
      enroll: (key) => set((s) => ({ entitlements: { ...s.entitlements, [key]: true } })),
      addRecording: (r) => set((s) => ({ recordings: [r, ...s.recordings] })),
      addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      addBroadcast: (b) => set((s) => ({ broadcasts: [b, ...s.broadcasts] })),
      updateBroadcast: (id, patch) =>
        set((s) => ({ broadcasts: s.broadcasts.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      addSequence: (seq) => set((s) => ({ sequences: [seq, ...s.sequences] })),
      updateSequence: (id, patch) =>
        set((s) => ({ sequences: s.sequences.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
      removeSequence: (id) => set((s) => ({ sequences: s.sequences.filter((q) => q.id !== id) })),
      resetProgress: () =>
        set({ completedLessons: {}, lessonPos: {}, quizScores: {}, entitlements: {}, recordings: [] })
    }),
    {
      name: 'boldlife',
      // Don't persist transient navigation — always open on the dashboard.
      partialize: (s) => ({
        role: s.role,
        theme: s.theme,
        learnerName: s.learnerName,
        completedLessons: s.completedLessons,
        lessonPos: s.lessonPos,
        quizScores: s.quizScores,
        entitlements: s.entitlements,
        recordings: s.recordings,
        contacts: s.contacts,
        broadcasts: s.broadcasts,
        sequences: s.sequences
      })
    }
  )
)

// ---- derived helpers (pure) ----
type Progress = Pick<State, 'completedLessons' | 'quizScores' | 'entitlements'>

export function lessonDone(s: Progress, lessonId: string): boolean {
  return !!s.completedLessons[lessonId]
}
export function quizPassed(s: Progress, moduleId: string): boolean {
  return (s.quizScores[moduleId] ?? 0) >= PASS_MARK
}
export function moduleComplete(s: Progress, m: Module): boolean {
  return m.lessons.every((l) => s.completedLessons[l.id]) && quizPassed(s, m.id)
}
export function levelCertified(s: Progress, lvl: Level): boolean {
  return lvl.modules.every((m) => moduleComplete(s, m))
}
export function hasAccess(s: Progress, lvl: Level): boolean {
  return !lvl.paid || !!s.entitlements[ENTITLEMENT_ACADEMY]
}
// Percent of a level's sub-items done (lessons + a passed quiz per module).
export function levelPct(s: Progress, lvl: Level): number {
  let total = 0
  let done = 0
  for (const m of lvl.modules) {
    total += m.lessons.length + 1
    done += m.lessons.filter((l) => s.completedLessons[l.id]).length
    if (quizPassed(s, m.id)) done += 1
  }
  return total === 0 ? 0 : Math.round((done / total) * 100)
}
export function academyPct(s: Progress): number {
  const levels = PROGRAM.levels
  const sum = levels.reduce((acc, l) => acc + levelPct(s, l), 0)
  return Math.round(sum / levels.length)
}
export function certifiedLevels(s: Progress): Level[] {
  return PROGRAM.levels.filter((l) => levelCertified(s, l))
}
