<template>
  <!-- The love habit moment. The phrase sits centered and starts out blurred
       and scrambled; it DECODES letter by letter as the cursor passes over it
       (desktop) or as the reader keeps scrolling (touch / small screens).
       The real text is always in the DOM and in the aria-label, so screen
       readers, reduced-motion users and no-JS visitors just get it plainly.
       A full-bleed picture (the campfire) can sit behind it: see SHOW_PICTURE. -->
  <section
    ref="section"
    class="break"
    :class="{
      'break--scrub': heartMode,
      'break--bare': !SHOW_PICTURE,
      'break--decode-scroll': scrollMode,
    }"
    :aria-label="BREAK_PHRASE"
  >
    <div class="break__stage">
      <video
        v-if="SHOW_PICTURE"
        ref="video"
        class="break__video"
        :class="{ 'break__video--ambient': !heartMode, 'break__video--heart': heartMode }"
        muted
        playsinline
        :preload="heartMode ? 'auto' : 'metadata'"
        :poster="poster"
        aria-hidden="true"
        data-mask
      >
        <source :src="src" type="video/mp4" />
      </video>

      <div class="break__center above-canvas">
        <p ref="decode" class="break__decode" :class="{ 'is-armed': armed }" aria-hidden="true">
          <span v-for="(line, li) in lines" :key="li" class="break__line">
            <span v-for="(word, wi) in line" :key="wi" class="break__word"
              ><span v-for="(ch, ci) in word" :key="ci" class="ch">{{ ch }}</span></span
            >
          </span>
        </p>
        <p v-if="armed" class="break__hint" :class="{ 'is-started': started }" aria-hidden="true">{{ hint }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { BREAK_PHRASE, BREAK_PHRASE_LEFT, BREAK_PHRASE_RIGHT } from '~/data/site'

/* The full-bleed picture (campfire clip) behind the phrase is switched OFF for
   now: the phrase sits straight on the page's own background. Flip to true to
   bring the campfire back; its files and loading logic are untouched. */
const SHOW_PICTURE = false

const src = ref('/media/pixel-earth.mp4')
const poster = ref('/media/pixel-earth-poster.jpg')
const heartMode = ref(false)
const section = ref(null)
const video = ref(null)
const decode = ref(null)
const engine = useScrollEngine()

/* the phrase as lines > words > characters (words stay whole so a wrapped
   line never breaks mid-word) */
const lines = [`${BREAK_PHRASE_LEFT},`, BREAK_PHRASE_RIGHT].map((l) => l.split(' ').map((w) => w.split('')))

const armed = ref(false) /* true once the text has been scrambled (client only) */
const scrollMode = ref(false) /* decode by scrolling instead of hovering */
const started = ref(false) /* hides the hint after the first decoded letter */
const hint = ref('')

async function probe(url) {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    const type = head.headers.get('content-type') || ''
    return head.ok && type.startsWith('video/')
  } catch (e) {
    return false
  }
}

/* ---------------------------- decode machinery --------------------------- */
const GLYPHS = 'abcdefghijklmnopqrstuvwxyz#%&*+=?/<>~'
const rand = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

let chars = [] /* { el, on, timer } */
let ticker = null
let io = null
let moveRaf = 0
let onMove = null

function reveal(c) {
  if (c.on) return
  c.on = true
  c.el.classList.add('is-dec')
  let n = 0
  c.timer = setInterval(() => {
    n++
    if (n >= 5) {
      clearInterval(c.timer)
      c.timer = null
      c.el.classList.add('is-on')
      c.el.classList.remove('is-dec')
    } else {
      c.el.setAttribute('data-s', rand())
    }
  }, 50)
}

function hide(c) {
  if (!c.on) return
  if (c.timer) clearInterval(c.timer)
  c.timer = null
  c.on = false
  c.el.classList.remove('is-on', 'is-dec')
  c.el.setAttribute('data-s', rand())
}

function armDecode(hoverMode) {
  chars = Array.from(decode.value.querySelectorAll('.ch')).map((el) => ({ el, on: false, timer: null }))
  chars.forEach((c) => c.el.setAttribute('data-s', rand()))
  armed.value = true

  /* the scramble only churns while the section is on screen */
  io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !ticker) {
      ticker = setInterval(() => {
        for (const c of chars) if (!c.on) c.el.setAttribute('data-s', rand())
      }, 110)
    } else if (!e.isIntersecting && ticker) {
      clearInterval(ticker)
      ticker = null
    }
  })
  io.observe(section.value)

  if (hoverMode) {
    let x = 0
    let y = 0
    onMove = (e) => {
      x = e.clientX
      y = e.clientY
      if (moveRaf) return
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0
        const R = Math.max(70, Math.min(110, window.innerWidth * 0.06))
        for (const c of chars) {
          if (c.on) continue
          const r = c.el.getBoundingClientRect()
          const dx = x - (r.left + r.width / 2)
          const dy = y - (r.top + r.height / 2)
          if (dx * dx + dy * dy < R * R) {
            reveal(c)
            started.value = true
          }
        }
      })
    }
    section.value.addEventListener('pointermove', onMove)
  }
}

let ctx
onMounted(async () => {
  let v = null
  if (SHOW_PICTURE) {
    /* the campfire replaced the heart checklist as the break's mood piece */
    if (await probe('/media/campfire.mp4')) {
      src.value = '/media/campfire.mp4'
      poster.value = '/media/campfire-poster.jpg'
    } else if (await probe('/media/heart-checklist.mp4')) {
      heartMode.value = true
      src.value = '/media/heart-checklist.mp4'
      poster.value = '/media/heart-poster.jpg'
    } else if (await probe('/media/motion-break.mp4')) {
      src.value = '/media/motion-break.mp4'
    }
    await nextTick()
    v = video.value
    v.load()
  }

  if (!engine) return

  if (engine.reduced) {
    /* no scramble, no motion: the phrase simply reads plainly */
    if (v) v.pause()
    return
  }

  if (v && !heartMode.value) {
    /* legacy ambient loop */
    v.autoplay = true
    v.loop = true
    v.setAttribute('data-motion-video', '')
    if (!engine.motionPaused.value) v.play().catch(() => {})
  }

  /* hover to decode on a real mouse; scroll to decode on touch / small screens */
  const hoverMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !engine.isMobile()
  scrollMode.value = !hoverMode
  hint.value = hoverMode ? 'move your cursor across the words' : 'keep scrolling'
  armDecode(hoverMode)
  await nextTick() /* let the taller scroll-mode section lay out first */

  ctx = engine.gsap.context(() => {
    if (v && heartMode.value) {
      /* scrub the drawing of the checkmarks to scroll progress, and beat the
         heart AS A FUNCTION OF SCROLL (sharp thumps that freeze when the
         reader stops) — no free-running timer. The clip draws its four ticks
         unevenly (checks 2 and 3 burst together ~2.5–2.9s); remapping scroll
         to video time gives each checkmark its own slice, all landing by
         p=0.6 while the heart is still centered. */
      const P = [0, 0.16, 0.31, 0.45, 0.6]
      const T = [0.8, 1.9, 2.7, 3.05, 5.6]
      const remap = (p) => {
        for (let i = 1; i < P.length; i++) {
          if (p <= P[i]) return T[i - 1] + ((p - P[i - 1]) / (P[i] - P[i - 1])) * (T[i] - T[i - 1])
        }
        return T[T.length - 1]
      }
      engine.ScrollTrigger.create({
        trigger: section.value,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const t = remap(self.progress)
          if (Math.abs(t - v.currentTime) > 0.02) v.currentTime = t
          const beat = Math.pow(Math.abs(Math.sin(self.progress * Math.PI * 7)), 6) * 0.07
          engine.gsap.set(v, { scale: 1 + beat, transformOrigin: 'center' })
        },
      })
    }

    if (scrollMode.value) {
      /* decode left to right as the reader scrolls through the (taller)
         section; finishes at 80% of the travel so the full phrase holds on
         screen for a beat before it scrolls away. Scrolling back re-scrambles. */
      engine.ScrollTrigger.create({
        trigger: section.value,
        start: 'top 20%',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const n = Math.round(Math.min(1, self.progress / 0.8) * chars.length)
          chars.forEach((c, i) => (i < n ? reveal(c) : hide(c)))
          if (n > 0) started.value = true
        },
      })
    }
  })

  /* This section mounts late and sits below the pinned philosophy section,
     whose pin-spacer shifts everything down. Triggers computed against a stale
     layout freeze at their end state — refresh once the DOM has settled. */
  const refresh = () => engine.ScrollTrigger.refresh()
  requestAnimationFrame(() => requestAnimationFrame(refresh))
  setTimeout(refresh, 400)
  setTimeout(refresh, 1200)
})

onBeforeUnmount(() => {
  ctx && ctx.revert()
  if (ticker) clearInterval(ticker)
  if (io) io.disconnect()
  if (moveRaf) cancelAnimationFrame(moveRaf)
  if (onMove && section.value) section.value.removeEventListener('pointermove', onMove)
  chars.forEach((c) => c.timer && clearInterval(c.timer))
})
</script>

<style scoped>
.break {
  position: relative;
  z-index: 3; /* above the canvas */
  height: 100vh;
}
/* scrub mode: extra runway so the checkmarks draw at a readable pace */
.break--scrub { height: 175vh; }
/* scroll-decode mode: extra runway (the stage below is sticky, so the phrase
   holds still while the reader scrolls it into focus) */
.break--decode-scroll { height: 190vh; }

.break__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.break__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}
.break__video--ambient { animation: slow-zoom 26s ease-in-out infinite alternate; }
@keyframes slow-zoom {
  from { transform: scale(1); }
  to { transform: scale(1.09); }
}

/* the heart's beat is driven by scroll (see the scrub onUpdate in script),
   so it thumps only as the reader moves and freezes when they stop */
.break__video--heart { transform-origin: center; }

/* ---- the centered phrase ---- */
.break__center {
  position: relative;
  z-index: 1;
  width: min(1100px, 90vw);
  text-align: center;
}
.break__decode {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: clamp(34px, 6vw, 84px);
  line-height: 1.14;
  color: var(--neutral-cream);
  text-shadow: 0 2px 18px rgba(14, 26, 20, 0.75), 0 1px 4px rgba(14, 26, 20, 0.6);
}
.break__line { display: block; }
.break__word { display: inline-block; white-space: nowrap; }
.break__word:not(:last-child) { margin-right: 0.26em; }
.ch { position: relative; display: inline-block; transition: filter 0.45s ease, opacity 0.45s ease; }

/* scrambled state: the real letter stays in place (transparent) so every
   word keeps its true width, and a random glyph is painted over it from the
   data-s attribute — no layout jitter while it churns. */
.is-armed .ch:not(.is-on) {
  color: transparent;
  text-shadow: none;
}
.is-armed .ch:not(.is-on)::before {
  content: attr(data-s);
  position: absolute;
  inset: 0;
  text-align: center;
  color: var(--neutral-cream);
  text-shadow: 0 2px 18px rgba(14, 26, 20, 0.75), 0 1px 4px rgba(14, 26, 20, 0.6);
}
/* hidden: blurred and faint. decoding (is-dec): sharp but still churning. */
.is-armed .ch:not(.is-on):not(.is-dec) {
  filter: blur(7px);
  opacity: 0.45;
}

.break__hint {
  margin-top: clamp(22px, 4vh, 40px);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--neutral-cream);
  opacity: 0.6;
  text-shadow: 0 1px 8px rgba(14, 26, 20, 0.8);
  transition: opacity 0.6s ease;
}
.break__hint.is-started { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .break__video--ambient { animation: none; }
}
</style>
