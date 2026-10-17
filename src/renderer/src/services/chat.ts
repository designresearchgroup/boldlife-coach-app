// Live-session chat. In demo mode the "coach" is a local responder so the room
// feels alive with no backend. Production swaps this for realtime messaging
// (Supabase Realtime / WebSocket) behind the same send/subscribe surface.
import { demoMode } from './env'

export interface ChatMessage {
  id: string
  from: 'me' | 'coach'
  who: string
  text: string
  at: number
}

const OPENERS = [
  'Great to see you. What do you most want to get out of our time today?',
  "Welcome back. Where did you land after last session's one bold step?"
]

const REFLECTIONS = [
  'Say more about that — what makes it feel hard right now?',
  'If you weren’t worried about the outcome, what would you do first?',
  'What would “bold” look like here, specifically?',
  'Notice you said “should.” What do you actually want?',
  'Let’s make it concrete — what’s one step you could take before Friday?',
  "That's real. What's the story you're telling yourself about it?"
]

let turn = 0

export function coachOpener(): string {
  return OPENERS[Math.floor(Math.random() * OPENERS.length)]
}

// A lightly context-aware demo reply. Not pretending to be a real coach — just
// enough to make the room feel live while testing.
export function coachReply(userText: string): string {
  const t = userText.toLowerCase()
  if (/thank|thanks|appreciate/.test(t)) return 'Of course. You did the work — I just held the mirror.'
  if (/don't know|not sure|unsure|confused/.test(t))
    return "That's a fine place to start. What's one thing you DO know about it?"
  if (/\?$/.test(userText.trim()))
    return 'Good question to sit with. What’s your instinct telling you?'
  const r = REFLECTIONS[turn % REFLECTIONS.length]
  turn++
  return r
}

export const chatMode = (): 'demo' | 'live' => (demoMode ? 'demo' : 'live')
