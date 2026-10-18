# The Bold Life backends

Two Edge Functions, our own infra — no third-party assistant or marketing SaaS the client sees.

- **`functions/agent`** — the AI agent. Takes a skill/prompt, calls the foundation model
  (Anthropic) with the key held here, answers as *The Bold Life assistant* in her voice.
- **`functions/send-email`** — the sender. Fans broadcasts out through Resend.

The live-class video signaling uses the same project's **Realtime** (no function needed).

## What's needed to go live (values only James holds)

1. **A Supabase project** — a dedicated Bold Life project (clean), or reuse an existing one.
   Need its **ref** and **anon key** (Project Settings → API).
2. **Supabase PAT** (`SUPABASE_ACCESS_TOKEN`) — to deploy via token, not `supabase login`.
3. **`ANTHROPIC_API_KEY`** — the agent's model key.
4. **`RESEND_API_KEY`** — the email transport. For delivery to any address, verify
   `theboldlifecoaching.com` in Resend and set **`BOLD_FROM`**; until then Resend's sandbox
   sender reaches your own verified address for testing.

## Deploy

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...      # PAT
export BOLD_SUPABASE_REF=xxxxxxxxxxxx     # project ref
export ANTHROPIC_API_KEY=sk-ant-...       # agent model
export RESEND_API_KEY=re_...              # email transport
# optional: export BOLD_FROM="The Bold Life <hello@theboldlifecoaching.com>"
./supabase/deploy-functions.sh
```

Then put the printed `VITE_*` URLs (plus `VITE_SUPABASE_ANON_KEY`) into the app's `.env`
(see `../.env.example`) and `npm run build:web`. The cockpit's **Connections** panel will
flip each row to **Connected**, and the agent + newsletter run for real.
