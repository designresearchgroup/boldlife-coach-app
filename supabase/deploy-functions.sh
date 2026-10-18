#!/usr/bin/env bash
#
# Deploy The Bold Life backends (agent + sender) to Supabase — via access token,
# never `supabase login` (that keeps authenticating the wrong account).
#
# Required env:
#   SUPABASE_ACCESS_TOKEN   your Supabase personal access token (PAT)
#   BOLD_SUPABASE_REF       the project ref (e.g. abcd1234...)
#
# Secrets to set once (only those you export are pushed):
#   ANTHROPIC_API_KEY   the model key for the agent (yours to paste)
#   RESEND_API_KEY      the email transport key
#   BOLD_FROM           e.g. "The Bold Life <hello@theboldlifecoaching.com>" (needs a verified domain)
#   AGENT_MODEL         optional model id override
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...          # your PAT
#   export BOLD_SUPABASE_REF=xxxxxxxxxxxx         # project ref
#   export ANTHROPIC_API_KEY=sk-ant-...           # agent model
#   export RESEND_API_KEY=re_...                  # email transport
#   ./supabase/deploy-functions.sh
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?set SUPABASE_ACCESS_TOKEN (your Supabase PAT)}"
: "${BOLD_SUPABASE_REF:?set BOLD_SUPABASE_REF (project ref)}"
export SUPABASE_ACCESS_TOKEN
cd "$(dirname "$0")/.."

SECRETS=()
[ -n "${ANTHROPIC_API_KEY:-}" ] && SECRETS+=("ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY")
[ -n "${RESEND_API_KEY:-}" ]    && SECRETS+=("RESEND_API_KEY=$RESEND_API_KEY")
[ -n "${BOLD_FROM:-}" ]         && SECRETS+=("BOLD_FROM=$BOLD_FROM")
[ -n "${AGENT_MODEL:-}" ]       && SECRETS+=("AGENT_MODEL=$AGENT_MODEL")
if [ ${#SECRETS[@]} -gt 0 ]; then
  echo "Setting ${#SECRETS[@]} secret(s)…"
  supabase secrets set "${SECRETS[@]}" --project-ref "$BOLD_SUPABASE_REF"
fi

echo "Deploying functions…"
supabase functions deploy agent      --project-ref "$BOLD_SUPABASE_REF" --no-verify-jwt
supabase functions deploy send-email --project-ref "$BOLD_SUPABASE_REF" --no-verify-jwt

echo
echo "Done. Put these in the app's .env, then rebuild:"
echo "  VITE_SUPABASE_URL=https://$BOLD_SUPABASE_REF.supabase.co"
echo "  VITE_AGENT_URL=https://$BOLD_SUPABASE_REF.supabase.co/functions/v1/agent"
echo "  VITE_EMAIL_FUNCTION_URL=https://$BOLD_SUPABASE_REF.supabase.co/functions/v1/send-email"
echo "  (VITE_SUPABASE_ANON_KEY=… from the project's API settings, for live classes)"
