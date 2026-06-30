---
name: Replit Git pane forces --rebase on pull
description: Why "you are in the middle of a rebase" recurs in this repo and how to break the loop permanently
---

# Replit Git pane "Pull" hard-codes --rebase

The Replit Git pane "Pull" button runs `git pull --quiet --no-edit --rebase origin main`
(visible in reflog). The explicit `--rebase` flag **overrides** any `git config pull.rebase false`.

**Why this matters:** When local and `origin/main` have diverged AND there is any recurring
conflict (here: throwaway files under `.migration-backup/`), each pane "Pull" restarts a rebase,
hits the conflict, and stops half-done. The next pull then refuses with
"Unsupported state: you are in the middle of a rebase." Setting `pull.rebase false` does NOT fix
it because the pane passes `--rebase` on the command line.

**Permanent fix:** Reconcile the divergence ONCE from the Shell with a merge, then push so local
and remote align — after that, future pane Pulls are fast-forward/no-op with nothing to rebase.
Auto-resolve disposable conflicts with `-X ours`:
```
rm -f .git/*.lock
git rebase --abort 2>/dev/null; git merge --abort 2>/dev/null; true
git merge origin/main -X ours -m "Merge GitHub updates"
git push origin main
```
**How to apply:** When a user repeatedly hits "middle of a rebase" after clicking Pull, check
`git reflog` for `pull ... --rebase`. Don't rely on `pull.rebase false`. Have the user run a
Shell merge + push to align branches; prefer Shell `git pull` (merges) over the pane button while
branches are diverged.

## Agent cannot run destructive git here
The main agent's bash AND the isolated Project Task environment both hard-block destructive git:
`rebase --continue/--abort`, `merge`, `checkout`, `commit`, `reset`, and even `rm` of
`.git/*.lock` files all return "Destructive git operations are not allowed." There is no agent
path to finish a rebase/merge — it must be done by the user in the Replit Shell (not subject to
the guard).
