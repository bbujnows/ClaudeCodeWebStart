# brandon-apps

Personal apps monorepo. One repo, many apps, two machines.

## Layout

Each app lives in its own top-level folder and is otherwise independent (its
own `package.json` / `requirements.txt`, its own dependencies, its own dev
server). No workspaces yet — just plain folders. We can add npm/pnpm
workspaces later if dependency duplication becomes annoying.

```
brandon-apps/
  reef-portfolio/    # portfolio tracker
  mr-bujis/          # recipes
  blues-harp/        # harmonica practice tool
  nola-randomizer/   # New Orleans restaurant picker
  wd-calc-sim/       # Workday calculated field simulator
  README.md
  .gitignore
```

## Two-machine workflow

**Legion (home, VS Code + Claude Code in the terminal)** — active coding.
Open the whole `brandon-apps` folder as one workspace. Claude Code sees every
app at once, so cross-app refactors ("apply the Recharts pattern from
reef-portfolio to mr-bujis") actually work.

**Work laptop (Claude Code on the web)** — async delegation. Connect this
same repo through the GitHub App at claude.ai/code. Fire off tasks during
downtime ("bump React to 19 across all apps, one branch per app"), walk away,
review the PRs from your phone.

Both machines push to the same GitHub repo. Sync rule: `git pull` before you
start, `git push` when you stop. If the web has an open PR, merge or close it
before you start a related task on the Legion so you don't fight yourself.

## How to add a new app

1. From the repo root: `mkdir my-new-app && cd my-new-app`
2. Initialize it however that app wants to be initialized (`npm create vite@latest .`, `python -m venv .venv`, etc.).
3. Add a one-paragraph `README.md` at the top of the folder explaining what
   the app does and how to run it locally.
4. If the app needs ignores beyond the root `.gitignore`, add a local
   `.gitignore` inside the folder.
5. Commit and push.

## How to migrate an existing app

1. Copy the existing project folder into the corresponding slot here
   (e.g. paste your local `wd-calc-sim` checkout into `wd-calc-sim/`).
2. Delete the inner `.git` directory — the monorepo's git is the source of
   truth now.
3. Make sure the app's own `node_modules/`, `.venv/`, build output, etc. are
   covered by the root `.gitignore` (or add a local one).
4. From the repo root, run the app once to confirm it still works:
   `cd wd-calc-sim && npm install && npm run dev` (or whatever it uses).
5. Commit with a message like `migrate wd-calc-sim into monorepo`.

## Good first tasks for Claude Code on the web

- Migrate one app per PR (start with the smallest one).
- Write a top-level `index.html` landing page that lists every app with a
  one-line description and a link.
- Audit each app for unused dependencies.
- Extract a shared `lib/` for things every app reinvents (storage helpers,
  date formatting, etc.) once two or more apps actually exist here.
