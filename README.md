# Civic Shift — First Failure: Civic Square

A browser-playable, static Level 01 proof of concept for **Civic Shift**.

This build is intentionally self-contained: it uses only HTML, CSS, JavaScript, and the original Civic Pip character-sheet art. There are no accounts, analytics, API calls, ads, databases, tracking pixels, or third-party game libraries.

## What this prototype proves

- The first Level 01 loop: stalled bus → LENS traffic-lock → ambulance → rain → service-van pressure.
- Four meaningful city-coordination roles, merged into one keyboard-and-mouse player for a first feedback build.
- Original Civic Pip visual language: rounded-square helmets, dot eyes, raincoat bodies, separate boots, and role-specific gear.
- The basic question that matters before online multiplayer: **do players understand the emergency, feel pressure, and want to retry?**

It does **not** include real remote multiplayer. A shared online city needs a separate matchmaking/simulation service later; do not pretend this static build has it.

## Play controls

| Control | Action |
|---|---|
| Mouse | Click glowing map targets and intersections. |
| `1` | Dispatcher — authorize hospital priority. |
| `2` | Signal Operator — change traffic-light phases. |
| `3` | Route Planner — open Bluebird Alley. |
| `4` | Field Crew — repair the bus or delivery van. |
| `M` | Toggle sound. |
| `R` | Restart the current shift. |

## The intended first play

1. Start a **Quick test** shift.
2. Select **Field Crew** (`4`) and repair the stopped school bus.
3. Select **Route Planner** (`3`) and open Bluebird Alley if traffic is backing up.
4. When the ambulance arrives, select **Dispatcher** (`1`) and authorize hospital priority.
5. Select **Signal Operator** (`2`), click Civic Square until east–west is green, then click Northgate until north–south is green.
6. Keep traffic moving until the ambulance reaches Northgate Hospital.

## Put it on GitHub Pages

### Simplest browser-only method

1. Create a new GitHub repository named `civic-shift-level-01`.
2. Make it **Public**. GitHub Free Pages requires a public repository.
3. Upload the **contents** of this folder to the repository root. You should see `index.html`, `styles.css`, `src/`, `assets/`, and `.nojekyll` at the top level of the repository.
4. Open the repository’s **Settings** → **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose branch **main** and folder **/(root)**, then press **Save**.
7. Wait for the Pages deployment confirmation. Your game will be available at:

   ```text
   https://YOUR-GITHUB-USERNAME.github.io/civic-shift-level-01/
   ```

8. Open the link in an incognito/private browser window before sharing it with friends.

### Git command-line method

From inside this folder, after creating an empty public GitHub repository:

```bash
git init
git add .
git commit -m "Launch Civic Shift Level 01 proof of concept"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/civic-shift-level-01.git
git push -u origin main
```

Then enable Pages through **Settings → Pages**, using `main` and `/(root)`.

## Before sharing it

- Test the published link on desktop Chrome or Firefox.
- Give friends only the game link plus three questions:
  1. What did you think you were supposed to do?
  2. When did you feel pressure or confusion?
  3. Did you want to retry? Why or why not?
- Do not ask whether they “like the idea.” Ask what they actually did, misunderstood, and wanted to do next.

## Important GitHub Pages limits

- A public Pages repository exposes the source files. Never add passwords, API keys, private notes, or future server secrets.
- This prototype works because it is entirely static. GitHub Pages cannot host the real-time multiplayer backend later.
- GitHub Pages is suitable for a free demo and feedback build, not the permanent live-service infrastructure of a commercial multiplayer game.

## Project structure

```text
civic-shift-level-01/
├── index.html                         # game screen and UI
├── styles.css                         # responsive visual system
├── src/game.js                        # all Level 01 gameplay, art, audio, and logic
├── assets/civic-pips-character-sheet.png
├── .nojekyll                          # prevents GitHub Pages from processing files as Jekyll
└── README.md
```

## Next technical milestone

If friend feedback is positive, keep this client as the browser front end and add a small real-time room service separately. Do not build that service until the single-player role loop is fun enough to earn it.

