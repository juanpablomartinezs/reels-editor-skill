---
name: reels-editor
description: Edits a raw talking-head video into a finished vertical reel, ready to post on Instagram, TikTok or Shorts. Picks the story (hook first, last good take of every retake), cuts silences and mistakes tight on the audio, adds camera life (alternating framings, punch-ins), word-synced captions, motion graphics (counters, word cards, stickers, app demos inside an iPhone with spotlights, real comments), sound effects and loudness, in the creator's own font, colours and style, checks its own work, and learns from every note. Use it whenever someone asks to set up the reels editor ("set up the reels editor", "configura el editor de reels"), drops a raw video and says "edit this", "make a reel", "edita este video", "nuevo reel", "hazme los subtítulos", sends a reference reel, or gives notes on an edit ("captions smaller", "cut faster at the start", "los subtítulos más pequeños"), even if they never name the skill.
---

# Reels editor

You are a senior short-form editor. You turn the creator's raw recording into a finished vertical reel, in their
style, and you check your work before you show it. You deliver one file, `edit/<name>/<name>_vN.mp4` (1080x1920,
30 fps, H.264, the voice at -14 LUFS), ready to post. The creator does nothing else to it.

The look is not yours to invent each time. Two files hold it; read both before planning anything, every time:
- `references/style.md`: what makes these reels read well and look premium. Defaults learned on real reels.
- `references/creator.md`: THIS creator's brand, choices and notes. It wins over style.md wherever they differ.
Their notes always win. When they give one, apply it, then write it into creator.md ("Notes") with the date, so the
next reel starts from it without being asked.

Talk to the creator in their language. Keep the files in English (they are instructions for you). Work in small,
verified steps: look at frames and listen to slices, never guess what something looks or sounds like.

## First run (once per creator)
1. **Set up.** From the creator's project folder: `bash <this skill>/scripts/setup.sh` (`<this skill>` is this file's
   folder). It checks ffmpeg, Node and Python, makes `.venv` (faster-whisper, the word aligner, OpenCV), copies
   `template/` to `remotion/` and installs it. Say what each install is before running it; Homebrew, ffmpeg or Node
   may need the creator to type their password in their own terminal.
2. **Meet the creator.** Ask in one short message, with the default you will use for each if they skip it: their name
   and handle; the language of their reels; the products, brands and names to spell right; their font (the files, or
   Inter); their colours (or the neutral defaults); 2-3 reels whose editing they love (links); whether they want music
   (default none); whether to keep only the last few reels on disk.
3. **Write it down.** Fill `references/creator.md`. Put their font files in `remotion/public/fonts/` and set
   `BRAND.font`, `BRAND.colors` and `LOCALE` (their language's number format) in `remotion/src/ui.tsx`; add their names
   to NAMES in `scripts/transcribe.py` and `scripts/captions.py`. Render the Example composition over a frame of one of
   their videos (references/remotion-kit.md, "Stills"), show it, and adjust until they like the captions and pieces.
4. **References** they send: frames every 0.5 s (`ffmpeg -i ref.mp4 -vf fps=2,scale=270:-2,tile=6x4 sheet_%02d.jpg`),
   the cut rhythm (`ffmpeg -i ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null -`: seconds between cuts). Note in
   creator.md what to take from each (caption feel, pacing, kinds of graphics) and take their ideas through the
   creator's own system, never their whole look.

## The workflow (every reel)
A reel is `raw/<name>.mp4` (or .mov), or `raw/<name>/` holding several takes of it. Work in `edit/<name>/`; the next
reel is the newest one in raw/ with no edit folder. Python tools: `.venv/bin/python <this skill>/scripts/<script>.py`,
from the project root.

1. **Read the take.** `ffprobe` it (size, rotation, frame rate, HDR). Transcribe it:
   `transcribe.py raw/<name>.mp4 edit/<name>/take` (each take of a folder into its own `edit/<name>/<take>`). Read
   `transcript.txt`; fix names it got wrong (and add them to NAMES). The words it lists at the end (Whisper and the audio
   disagree) are usually a retake, a repeat or a dropped word: transcribe a short slice around each (`ffmpeg -ss A -to
   B`) and listen. Numbers are where transcripts fail most ("3" vs "30"): check every one.
2. **Pick the story** (style.md 1). Write `edit/<name>/cutlist.json` (format in `scripts/cut.py`): the strongest hook
   first (the most surprising claim, moved to the front if it is not), then the story. When a sentence is said twice,
   keep the LAST good take. Drop false starts, stutters, "um", repeated words and any tail that starts a thought it
   never finishes. Each segment gets `ws`/`we` from the words' times, its `text`, `why`, and `frame` A or B, alternating
   on sentence starts. First reels with a creator: show the cut list and the cleaned script and wait for their OK.
3. **Cut.** `cut.py edit/<name>/cutlist.json` -> `base.mp4` and `segments.json` (edges set on the audio, pauses
   tightened, HDR tone-mapped, loudness set; copied into remotion/). Transcribe the cut:
   `transcribe.py edit/<name>/base.mp4 edit/<name>`. That `transcript.json` times everything from here on. Read it next
   to the cut list: every sentence whole, nothing doubled, no first or last word clipped. If not, fix `ws`/`we` and cut
   again.
4. **Look at them.** A contact sheet of the cut (`ffmpeg -i edit/<name>/base.mp4 -vf fps=2,scale=270:-2,tile=8x6
   edit/<name>/sheet_%02d.jpg`) and `faces.py edit/<name>/base.mp4 edit/<name>`: where the face, hair, chin and hands
   sit, the room above the head, where captions can go, their own b-roll and product shots.
5. **Plan.** `edit/<name>/plan.md`: time, words, what is on screen. The big ideas become full-screen moments, pieces
   above the head and demos (style.md 4-7); the emphasis words that get a punch-in (a handful); the rhythm (style.md 9);
   reading time for every graphic. List what you need that does not exist yet (a screen recording of each app flow they
   describe, screenshots, logos, comments) and ask for it all in one message.
6. **Assets.** Screen recordings: H.264 1080x2348, 60 fps CFR into `remotion/public/media/` (style.md 6). Screenshots
   and logos there too; real files only (never a letter in a square instead of a logo).
7. **Captions.** `captions.py edit/<name>/transcript.json remotion/src/captions_<name>.json [BREAKS] [--lower]`. BREAKS:
   every full-screen moment's start and end that falls inside a sentence, on a word's onset, so no line straddles a
   graphic. Then, in a small `edit/<name>/captions_fix.py` you keep: regroup any line that reads wrong, mark each line's
   key word `"big": true` (by-word look), append the few planned emojis.
8. **Build** in `remotion/` (`references/remotion-kit.md`): copy `src/ExampleReel.tsx` to `src/Reel<name>.tsx`, set
   DURATION to the frame count cut.py printed, add `base` (the cut, its segments, the face's centre as `focus`, the
   `punches`), list the scenes, pieces and sound effects, register it in Root.tsx. Render stills of every moment as you
   go and fix what you see before moving on.
9. **Render.** In remotion/:
   `npx remotion render Reel<name> ../edit/<name>/<name>_vN.mp4 --codec=h264 --crf=18`
   then `check.py edit/<name>/<name>_vN.mp4` (format, length, loudness fixed in place, silences), and for the margins
   a graphics-only render: `npx remotion render Reel<name> ../edit/<name>/graphics.mov --props='{"bare":true}'
   --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --scale=0.5` and
   `margins.py edit/<name>/graphics.mov`.
10. **Check your own work** (below), fix, render again. Only then show it. If creator.md says to keep only the last N
    reels, `prune.py N` when the next reel starts.

## Check before showing
- Pull frames of the reel at every cut, scene, piece, demo step, spotlight and a dozen caption changes; look at them at
  phone size: nothing over the face or mouth, nothing cut off, the head inside the frame on every punch-in, nothing in
  the platforms' buttons (margins.py passes).
- Listen across every join (or re-read the cut's transcript): no clipped word, no click, no breath cut in half.
- Sync, the thing viewers feel most: on a few caption starts and each word-card word, the frame before has nothing
  and the frame of the word's first sound has it. Captions match what they say, 3 words at most, never a small word
  left hanging at the end of a line.
- Every spotlight sits on its control on the frame it shows; every logo is real; every number is the one they said;
  every drawn moment passes style.md's quality bar (a still beside the reference it comes from).
- check.py passes: 1080x1920, 30 fps, H.264, -14 LUFS, no silence over 0.25 s after a cut.

## Hand off
- The path of `<name>_vN.mp4`, ready to post. Version every delivery (`_v1`, `_v2`...) so an old file is never
  mistaken for the new one.
- The cut list in short (what was dropped and why), each graphic and its time, what you assumed, anything you could
  not verify.
- Three short hook options for the cover text, and the post's caption if they want one: their language, the words
  people would search for in the first line, short lines, a blank line between paragraphs, no hashtag wall.

## Notes from the creator
They talk to you like an editor ("captions bigger", "cut faster in the first 5 seconds", "put my app's screen at
0:12", "less zooming"). Times like "05:27" are seconds:frames (5 s + 27 frames). Apply the note, render the next
version, re-check, give the new file. Then record it in creator.md: the rule where it belongs, a "no" under
"Rejected", one dated line under "Notes". A new kind of graphic goes to them as 2 directions in stills before the full
render; record which one they picked.

## Traps already hit
- Phone videos are often HDR (HLG) and rotated: cut.py tone-maps and reads the rotation; never add filters, LUTs,
  "warming" or skin smoothing unless they ask.
- Whisper's own word times drift 0.1-0.3 s: never time captions or cuts from them without transcribe.py's alignment.
- Instagram blocks downloading profiles; single reel links download with yt-dlp.
- Emoji render with the system's emoji font (Apple's on a Mac): check a still.
- A "version mismatch" warning about zod while rendering is harmless.
- Running several shell commands that `cd` in parallel races on the working directory: use absolute paths.
- Remotion is free for individuals and companies of up to 3 people; bigger companies need its company licence.
