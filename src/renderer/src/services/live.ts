// Live-class signaling backend. Uses our own Supabase project's Realtime
// (broadcast + presence) for WebRTC signaling — no third-party video SaaS.
// Configure with a Bold Life Supabase URL + anon key (Realtime only; no tables
// or auth needed). Unconfigured -> the Live Class runs local-only (you see your
// own camera and controls, but no one else joins).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ''

export const liveConfigured = (): boolean => !!(SUPABASE_URL && SUPABASE_ANON_KEY)

// STUN for NAT discovery (no media flows through it). For a fully-owned stack or
// strict/symmetric NATs, point this at a self-hosted coturn (STUN + TURN).
export const iceServers: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
]

let client: SupabaseClient | null = null
export function getSupabase(): SupabaseClient | null {
  if (!liveConfigured()) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  }
  return client
}
