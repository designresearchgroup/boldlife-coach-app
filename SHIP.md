# Shipping The Bold Life Coach (Windows + macOS)

How to get the desktop app in front of users. The app **builds today** — `npm run
typecheck` and `npm run build` both pass, the Bold Life app icon and the camera/mic
entitlements are in `build/`. What's left is packaging and the parts that need
**your** developer accounts (code-signing and store submission — I can't create or
sign with those).

## Two ways to "be where the users are"

**A. Direct download** (fastest — ship this week): a `.dmg` for Mac and a `.exe`
installer for Windows, downloaded from the site.
**B. App stores** (Mac App Store + Microsoft Store): more reach and trust, but each
needs a paid developer account and extra packaging.

Start with A; do B once accounts are set up.

---

## A. Direct-download installers

Already configured in `electron-builder.yml` (`dmg` for Mac, `nsis` for Windows).

```bash
npm run pack:mac    # builds out/ then a .dmg in release/   (run on a Mac)
npm run pack:win    # builds a .exe installer in release/    (build on Windows, or via CI)
```

Notes:
- **Build each OS on its own OS** (or in CI). A Mac can't produce a proper signed
  Windows build and vice-versa; the clean path is a CI runner per platform.
- **macOS signing + notarization** (so it opens without the "unidentified developer"
  wall): needs an **Apple Developer account ($99/yr)** and a **Developer ID
  Application** certificate. Set `CSC_LINK`/`CSC_KEY_PASSWORD` and notarize
  (`notarize` in electron-builder with an app-specific password or API key).
- **Windows signing** (so SmartScreen doesn't warn): needs a **code-signing
  certificate** (OV or EV). Unsigned `.exe` installs but shows a warning.
- Host the files anywhere (even the GitHub Pages site) and link them as downloads.

---

## B. App stores

### Mac App Store
- Needs the Apple Developer account + **Mac App Store** provisioning profile and the
  **Apple Distribution** / **Mac Installer Distribution** certificates.
- Add a `mas` target to `electron-builder.yml` and a MAS entitlements file
  (sandbox-enabled). The current `build/entitlements.mac.plist` is for direct/Developer
  ID; MAS needs its own with `com.apple.security.app-sandbox`.
- Submit the resulting `.pkg` through App Store Connect.
- **Live video caveat:** the MAS sandbox + review is stricter about camera/screen
  capture; direct-download (A) is the surer home for the live-session feature, with
  MAS carrying the recorded-curriculum experience.

### Microsoft Store
- Needs a **Microsoft Partner Center account** (one-time fee).
- Add an `appx`/MSIX target to `electron-builder.yml`; reserve the app name in Partner
  Center; submit the `.appx`.

---

## What I need from you to take this further
1. **Apple Developer** account + certificates (for Mac signing/notarization and MAS).
2. **Windows code-signing** certificate (and a Microsoft Partner Center account for the Store).
3. A decision: **direct download first** (A), or go straight for the **stores** (B)?

Give me the accounts/certs (or set them up) and I'll wire the signing config, add the
store targets, and stand up a per-platform CI build so every push produces installers.

---

## Status
- ✅ App builds (typecheck + `electron-vite build`), on-brand icon, entitlements.
- ✅ Features: live 1:1 video (camera/screen/record) + recorded-video curriculum player.
- ⏳ Packaging/signing/notarization — needs your accounts.
- ⏳ Not yet in version control with a remote + CI.
