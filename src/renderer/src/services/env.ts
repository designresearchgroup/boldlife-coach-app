// Where are we running, and in which mode? The whole app flips between a
// zero-setup demo and live providers from these flags alone.
export const isElectron = typeof window !== 'undefined' && !!window.bold
export const platform = isElectron ? window.bold!.platform : 'web'

export const supabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL
export const dailyConfigured = !!import.meta.env.VITE_DAILY_API_KEY
export const stripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Demo mode = nothing external wired yet. Every integration has a working mock,
// so the app runs fully offline; drop in keys to go live.
export const demoMode = !supabaseConfigured
