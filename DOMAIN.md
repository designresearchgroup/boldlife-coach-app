# Putting the app on your domain (GoDaddy)

The app is live on GitHub Pages at
`https://designresearchgroup.github.io/boldlife-coach-app/`. The cleanest way to
put it on The Bold Life's domain is to point a subdomain at Pages — keeps the
auto-deploy, adds free HTTPS, no server to run. (The build uses relative paths, so
it works at a domain root too.)

## Recommended: `app.theboldlifecoaching.com` → GitHub Pages

1. **In GoDaddy** (DNS for `theboldlifecoaching.com` → *Manage DNS*), add:
   - Type **CNAME**, Name **app**, Value **designresearchgroup.github.io**, TTL default.
2. **In GitHub** (repo *Settings → Pages → Custom domain*), enter
   **app.theboldlifecoaching.com** and save. GitHub verifies the CNAME and
   provisions HTTPS (a few minutes). Leave "Enforce HTTPS" on.
3. Done — the app serves at **https://app.theboldlifecoaching.com**.

That's the only part that needs your GoDaddy login; once the CNAME is in, I can set
the GitHub side by API if you'd rather I do it.

## If you want it on GoDaddy hosting instead (cPanel)

Not recommended (you'd lose the auto-deploy), but doable: build with
`npm run build:web` and upload the contents of `dist-web/` to the GoDaddy web root
via FTP/File Manager. If you choose this, share the GoDaddy FTP host/user and I'll
add a deploy script (same pattern as the humandata.id site), then you run it.

## Apex (`theboldlifecoaching.com`) instead of a subdomain

Only if the app should be the main site (it likely shouldn't — her brand site is).
Apex needs four A records at GoDaddy pointing to GitHub Pages
(`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`),
then the same custom-domain step in GitHub.
