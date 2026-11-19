# Reels editor skill

**Español** · [English](#english)

Una skill para Claude Code que edita tus reels de principio a fin. Le das tu video en bruto y te devuelve el reel
terminado, listo para publicar: elige la mejor historia, corta los silencios y las equivocaciones, mueve la cámara,
pone subtítulos sincronizados palabra por palabra, motion graphics, demos de tu app, efectos de sonido y el volumen
correcto. Con tu tipografía, tus colores y tu estilo, y aprende de cada nota que le das.

Hecha por Juan Pablo ([@juan.pabloms](https://www.instagram.com/juan.pabloms)) · First & Last Studio. Es la versión
abierta del sistema con el que edito mi serie de reels.

## Cómo funciona
1. Grabas tu video (en el celular o en cámara, vertical u horizontal, con todas las tomas que necesites) y lo pones
   en `raw/`.
2. Le dices a Claude "edita este reel". Transcribe tu voz en tu computador (Whisper) y arma la historia: pone el
   gancho más fuerte al inicio, se queda con la última toma buena de cada frase y quita muletillas, silencios y frases
   que no terminas. La primera vez te muestra la lista de cortes antes de seguir.
3. Corta todo sobre el audio (nunca en la mitad de una palabra, sin aire entre frases), alterna dos encuadres para que
   los cortes se vean intencionales, encuentra tu cara para no taparla y diseña los gráficos.
4. Renderiza el reel en [Remotion](https://www.remotion.dev), revisa su propio trabajo (sincronía, márgenes, zonas
   seguras de Instagram y TikTok, volumen a -14 LUFS) y te entrega `edit/<nombre>/<nombre>_v1.mp4`.
5. Le das notas como a un editor ("los subtítulos más pequeños", "corta más rápido al inicio", "pon la pantalla de mi
   app en 0:12"). Las aplica, saca la v2 y guarda la regla para los próximos reels.

## Requisitos
- [Claude Code](https://claude.com/claude-code)
- macOS o Linux (en Windows, WSL)
- [ffmpeg](https://ffmpeg.org), [Node](https://nodejs.org) 20 o más nuevo, Python 3.10-3.12
- ~6 GB libres para los modelos y paquetes (se descargan una vez)

## Instalar
```bash
git clone https://github.com/juanpablomartinezs/reels-editor-skill ~/.claude/skills/reels-editor
```
Abre Claude Code en la carpeta donde vas a guardar tus reels y dile: **"configura el editor de reels"**. Instala lo que
falta, te pregunta tu nombre, tu idioma, tu tipografía y tus colores, y te muestra un ejemplo para que ajustes el
estilo de los subtítulos. Desde ahí, cada reel es: poner tu video en `raw/` y decir "edita este reel".

## Qué hace en cada reel
- **La historia**: el gancho primero, la última toma buena de cada frase, fuera las muletillas y lo que se repite.
- **Cortes al frame**: cada frase empieza 0,05 s antes de tu primer sonido y termina 0,07 s después de tu voz; las
  pausas largas bajan a 0,12 s. Sin aire, sin palabras cortadas.
- **Cámara**: dos encuadres que se alternan en cada frase y un zoom suave en las palabras clave, siempre centrado en tu
  cara.
- **Subtítulos** de máximo 3 palabras, sincronizados al frame con tu voz (alineados sobre el audio, no solo con
  Whisper), con la palabra clave de cada línea más grande. Nunca terminan en "de" o "la".
- **Gráficos**: el número del gancho contando, el contador de tu serie ("Día 12 de 40"), cuenta regresiva, stickers
  inclinados, el banner de tu app, tarjetas de palabra, comentarios reales apilándose.
- **Demos de tu app**: tu grabación de pantalla dentro de un iPhone, con la cámara yendo a lo que nombras y un
  spotlight que se desliza de botón en botón.
- **Color y sonido**: tu video sin filtros (los videos HDR del iPhone se pasan bien a SDR), la voz a -14 LUFS como
  piden las plataformas, efectos de sonido por debajo de tu voz.
- **Reglas de diseño** aprendidas en decenas de reels: tamaños, márgenes, tiempos de lectura, movimiento con resortes
  y una lista de lo que se ve barato.

## Efectos de sonido y música
No vienen incluidos (las librerías de sonido tienen licencia). Usa los tuyos: tu librería, Epidemic Sound, Artlist,
o gratis de Pixabay o Mixkit. Claude te explica cómo agregarlos. Sin música, salvo que la pidas.

## Créditos y licencias
- El código de esta skill: licencia MIT (ver `LICENSE`).
- Inspirada en la skill reel-editor de [@buildwithdarius.ai](https://www.instagram.com/buildwithdarius.ai).
- [Remotion](https://www.remotion.dev/license): gratis para personas y empresas de hasta 3 personas; empresas más
  grandes necesitan su licencia.
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT) y Whisper de OpenAI (MIT) para transcribir.
- El alineador de palabras usa el modelo MMS de Meta (CC BY-NC 4.0). Si esa licencia no sirve para tu uso,
  `transcribe.py --no-align` usa solo los tiempos de Whisper (menos exactos).
- [Inter](https://rsms.me/inter/) (SIL Open Font License).

---

## English

A Claude Code skill that edits your reels from start to finish. Give it your raw video and it hands back the finished
reel, ready to post: it picks the best story, cuts the silences and mistakes, moves the camera, adds captions synced
word by word, motion graphics, demos of your app, sound effects and the right loudness. In your font, your colours and
your style, and it learns from every note you give it.

Made by Juan Pablo ([@juan.pabloms](https://www.instagram.com/juan.pabloms)) · First & Last Studio. It is the open
version of the system I edit my own reel series with.

### How it works
1. Record your video (phone or camera, vertical or horizontal, as many takes as you need) and put it in `raw/`.
2. Tell Claude "edit this reel". It transcribes your voice on your computer (Whisper) and builds the story: the
   strongest hook first, the last good take of every sentence, no filler words, silences or unfinished sentences. The
   first time, it shows you the cut list before going on.
3. It cuts everything on the audio (never mid-word, no air between sentences), alternates two framings so the cuts look
   intentional, finds your face so nothing covers it, and designs the graphics.
4. It renders the reel in [Remotion](https://www.remotion.dev), checks its own work (sync, margins, Instagram and
   TikTok safe zones, loudness at -14 LUFS) and hands you `edit/<name>/<name>_v1.mp4`.
5. Give it notes like you would an editor ("captions smaller", "cut faster at the start", "put my app's screen at
   0:12"). It applies them, renders v2 and keeps the rule for the next reels.

### Requirements
- [Claude Code](https://claude.com/claude-code)
- macOS or Linux (on Windows, WSL)
- [ffmpeg](https://ffmpeg.org), [Node](https://nodejs.org) 20 or newer, Python 3.10-3.12
- ~6 GB free for the models and packages (downloaded once)

### Install
```bash
git clone https://github.com/juanpablomartinezs/reels-editor-skill ~/.claude/skills/reels-editor
```
Open Claude Code in the folder where you will keep your reels and say: **"set up the reels editor"**. It installs
what is missing, asks for your name, language, font and colours, and shows you an example to tune the caption style.
From then on each reel is: put your video in `raw/`, say "edit this reel".

### What it does on every reel
- **The story**: the hook first, the last good take of every sentence, out with filler words and repeats.
- **Frame-accurate cuts**: each sentence starts 0.05 s before your first sound and ends 0.07 s after your voice; long
  pauses come down to 0.12 s. No air, no clipped words.
- **Camera**: two framings alternating on each sentence and a soft punch-in on key words, always centred on your face.
- **Captions** of 3 words at most, synced to the frame with your voice (aligned on the audio, not just Whisper), with
  each line's key word larger. They never end on "the" or "a".
- **Graphics**: the hook's number counting up, your series counter ("Day 12 of 40"), a countdown, tilted stickers,
  your app's banner, word cards, real comments stacking up.
- **Your app's demos**: your screen recording inside an iPhone, the camera moving to what you name, and a spotlight
  gliding from button to button.
- **Colour and sound**: your video with no filters (iPhone HDR is converted to SDR properly), the voice at -14 LUFS as
  the platforms expect, sound effects under your voice.
- **Design rules** learned on dozens of reels: sizes, margins, reading times, spring motion, and a list of what looks
  cheap.

### Sound effects and music
Not included (sound libraries are licensed). Use your own: your library, Epidemic Sound, Artlist, or free ones from
Pixabay or Mixkit. Claude explains how to add them. No music unless you ask for it.

### Credits and licences
- This skill's code: MIT licence (see `LICENSE`).
- Inspired by the reel-editor skill by [@buildwithdarius.ai](https://www.instagram.com/buildwithdarius.ai).
- [Remotion](https://www.remotion.dev/license): free for individuals and companies of up to 3 people; bigger companies
  need its licence.
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT) and OpenAI's Whisper (MIT) to transcribe.
- The word aligner uses Meta's MMS model (CC BY-NC 4.0). If that licence does not fit your use,
  `transcribe.py --no-align` keeps Whisper's own times (less exact).
- [Inter](https://rsms.me/inter/) (SIL Open Font License).
