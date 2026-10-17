// The Bold Life agent — the AI that runs a coaching business. It markets the
// coach, finds and intakes clients, schedules classes, and drafts the follow-up.
// It is HERS: branded, grounded in her data, acting on the platform's own tools.
// The model underneath is a rented foundation model reached through OUR endpoint
// (VITE_AGENT_URL, a Supabase Edge Function that holds the model key) — never a
// third-party assistant the client sees. Unconfigured, each skill returns the
// concrete plan it would run, so the cockpit is useful before the model is wired.

export type SkillId =
  | 'find-clients'
  | 'market-skill'
  | 'intake'
  | 'schedule'
  | 'newsletter'
  | 'recap'

export interface Skill {
  id: SkillId
  title: string
  blurb: string
  prompt: string // what the agent is asked to do
  /** a screen to jump to after/instead, when the work lives in a tool */
  route?: 'email' | 'liveclass' | 'coach'
}

export const SKILLS: Skill[] = [
  {
    id: 'find-clients',
    title: 'Find clients',
    blurb: 'Fill the pipeline — who to reach, where, and the first message.',
    prompt:
      'Act as my growth agent. Propose a concrete plan to find 10 new coaching clients this month: channels, the ideal-client profile, and 3 ready-to-send outreach messages in my voice.'
  },
  {
    id: 'market-skill',
    title: 'Market the skill',
    blurb: 'Position what you teach — hooks, posts, and a one-line pitch.',
    prompt:
      'Act as my marketing agent. Write my positioning: a one-line pitch, 3 social hooks, and a short post that sells the transformation I coach — in my brand voice.'
  },
  {
    id: 'intake',
    title: 'Client intake',
    blurb: 'Onboard and qualify a new client — questions, tags, next step.',
    prompt:
      'Act as my intake agent. Give me a short intake questionnaire for a new coaching client, how to tag them, and the first-session plan based on their answers.'
  },
  {
    id: 'schedule',
    title: 'Schedule a class',
    blurb: 'Plan a live class, pick a time, and announce it.',
    prompt:
      'Act as my scheduling agent. Propose a live class: title, a good time this week, who to invite, and the announcement email + reminder.',
    route: 'liveclass'
  },
  {
    id: 'newsletter',
    title: 'Write a newsletter',
    blurb: 'Draft this week’s broadcast to your audience.',
    prompt:
      'Act as my email agent. Draft this week’s newsletter to my audience in my voice — subject + body — with one clear call to action.',
    route: 'email'
  },
  {
    id: 'recap',
    title: 'Session recap',
    blurb: 'Turn a session into notes, action items, and a follow-up.',
    prompt:
      'Act as my follow-up agent. Turn my last coaching session into client-ready notes, 3 action items, and a warm follow-up message.'
  }
]

const AGENT_URL = (import.meta.env.VITE_AGENT_URL as string | undefined) || ''
export const agentConfigured = (): boolean => !!AGENT_URL

export interface AgentContext {
  coach?: string
  program?: string
  clients?: number
  audience?: number
}

// Fallback plans so a skill is still useful before the model is connected.
const PLANS: Record<SkillId, string> = {
  'find-clients':
    '• Define the ideal client (role, pain, where they are).\n• Pick 2 channels you already touch.\n• Send 3 warm outreach notes a day for 2 weeks.\n• Offer a free clarity call as the first step.\n\nConnect your agent to generate the profile + the messages in your voice.',
  'market-skill':
    '• One-line pitch: the transformation, not the method.\n• 3 hooks from real client wins.\n• One short post + a call to action.\n\nConnect your agent to write these in your brand voice.',
  intake:
    '• 6-question intake: goal, blocker, past attempts, timeline, success picture, commitment.\n• Tag by goal + readiness.\n• First-session plan from the answers.\n\nConnect your agent to tailor it per client.',
  schedule:
    '• Pick a title + a time this week.\n• Create the class in Live class.\n• Announce by email, remind the day before.\n\nConnect your agent to draft the announcement and pick the best time.',
  newsletter:
    '• One idea, one story, one call to action.\n• Keep it short and in your voice.\n\nConnect your agent to draft it, or open the composer to write it now.',
  recap:
    '• 3 things that landed.\n• 3 action items.\n• One warm follow-up message.\n\nConnect your agent to generate it from the session.'
}

export interface AgentResult {
  text: string
  live: boolean
}

export async function runAgent(skill: Skill, ctx: AgentContext): Promise<AgentResult> {
  if (!agentConfigured()) {
    return { text: PLANS[skill.id], live: false }
  }
  try {
    const res = await fetch(AGENT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ skill: skill.id, prompt: skill.prompt, context: ctx })
    })
    if (!res.ok) return { text: 'The agent hit an error (' + res.status + '). ' + PLANS[skill.id], live: false }
    const data = await res.json().catch(() => ({}))
    return { text: (data && (data.text || data.output)) || PLANS[skill.id], live: true }
  } catch {
    return { text: PLANS[skill.id], live: false }
  }
}

export async function askAgent(question: string, ctx: AgentContext): Promise<AgentResult> {
  if (!agentConfigured()) {
    return {
      text:
        'I can plan this out now, and run it for real once your agent is connected (VITE_AGENT_URL). Tell me which to start with: find clients, market the skill, intake, schedule a class, or the newsletter.',
      live: false
    }
  }
  try {
    const res = await fetch(AGENT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ask: question, context: ctx })
    })
    const data = await res.json().catch(() => ({}))
    return { text: (data && (data.text || data.output)) || 'Done.', live: true }
  } catch {
    return { text: 'Could not reach the agent just now.', live: false }
  }
}
