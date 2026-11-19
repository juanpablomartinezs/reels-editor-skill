"""Keep only the newest N reels in the project, when the creator wants the space back (references/creator.md, "Keep").
Usage: prune.py N [--dry]   (from the project root)
Every older reel's edit/<name>/ and raw/<name>.* go to the system Trash (recoverable until it is emptied), newest by
when edit/<name>/ was made. remotion/ stays whole: later reels reuse its code and media. Needs the `trash` command
(macOS 14+ ships it; elsewhere: pip install trash-cli, which installs `trash-put` — the script tries both)."""
import pathlib, shutil, subprocess, sys

KEEP = int(sys.argv[1])
reels = sorted((p for p in pathlib.Path("edit").iterdir() if p.is_dir()),
               key=lambda p: getattr(p.stat(), "st_birthtime", p.stat().st_ctime))
old, kept = reels[:-KEEP] if KEEP else reels, reels[-KEEP:] if KEEP else []
paths = [str(p) for r in old for p in [r, *pathlib.Path("raw").glob(r.name + ".*")]]
print("keep:", " ".join(r.name for r in kept) or "nothing")
print("trash:", " ".join(paths) or "nothing")
if paths and "--dry" not in sys.argv:
    tool = shutil.which("trash") or shutil.which("trash-put")
    if not tool:
        sys.exit("no trash command found; nothing moved")
    subprocess.run([tool, *paths], check=True)
