# wd-calc-sim

Workday calculated field simulator. **First app to migrate.**

## How to migrate (from the Legion)

1. `cd` to wherever the existing project lives on your Legion.
2. Copy its contents (everything except its `.git/` folder) into this directory.
3. From the monorepo root: `git add wd-calc-sim && git commit -m "migrate wd-calc-sim into monorepo"`
4. Push, then verify the app still runs from inside this folder.

## How to migrate (from Claude Code on the web)

You can't — the source code lives on your Legion, not on GitHub yet. Do the
copy from the Legion first; after that, web sessions can work on it freely.
