# Our Compass

A free, private toolkit for autistic children and their families. Live at https://thespectrumtechengine.com/our-compass/

- **For the child:** colour check-in with their own calm ideas, calm corner (breathing), draw it, "Show a card", star chart, first/then board, visual timer, today list, "Coming up" stories, "What would you do?" moments, hidden rules, social battery, my wins, private notes.
- **Two versions, chosen at setup ("Whose device is this?").** The **parent's phone** opens straight into the parent side (no lock) and can also show the child's tools. A **child's own device** shows only the child's tools and "All about me": no parent's side, no settings, and the diary is never stored there. Phones set up before this keep the old times-table sum until they answer the question once.
- **For the parent:** diary of tricky and good moments, pattern finder, printable/shareable summary, "When it gets too much" calm card, 📱 Devices (linking), settings, backup file.
- **Shared:** "All about me" passport, shared by QR code (the passport is packed into the link after `#`, so it never reaches a server), text or print.
- Low-demand (PDA-friendly) switch: invitations instead of instructions, no countdowns. "Simpler words" switch separate from age. Themes include pink & purple and ocean. Own photo or drawing as the profile picture.
- Several children per family, each with their own age group, theme, tools and data.

Saved on each device in localStorage key `oc_data_v1` (`D.role` = parent / child / '' for old installs).

**Linked devices (`sync.js`):** the child's device shows a QR code (`#pair=<code>`) and its 8-letter one-time code; the parent scans or types it, and the parent's phone leaves the key in `ocPair/` for 15 minutes, scrambled with that code, for the child's device to pick up (it checks every few seconds). Each linked child has a random 256-bit key; data is AES-GCM encrypted on the device and stored in Firestore (project **ste-owner**, anonymous auth) at `ocSync/<sha256(key|p or c)>`: box **p** = parent to child (settings, tools, star chart, stories, own moments/rules, passport, calm ideas, plan, shown wins), box **c** = child to parent (check-ins, battery, child's wins, plus passport/photo, newest wins). A child's phone and tablet share box c and merge it. Box **d** = the child's newest 15 drawings, child to parent (the parent keeps up to 40). Never synced: diary, patterns, summary, private notes. Rules: `ste-owner/firestore.rules` (no list, size limits). Local test: two tabs with `?mock&dev=parent` and `?mock&dev=kid` (pretend server in localStorage). Supports, doesn't replace, professional help.

Files: `index.html` (page + styles), `content.js` (all ready-made words, scenarios and cards), `app.js` (logic), `sync.js` (scrambling + Firestore for linked devices), `passport.html` (QR viewer), `privacy.html`, `sw.js` (offline copy: bump the cache name on every release), `android-app/` (APK builder).
