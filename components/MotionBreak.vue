<template>
  <!-- The love habit moment. When the heart-checklist clip exists, the section
       grows tall and the video is SCRUBBED by scroll: the checkmarks draw
       themselves as the reader moves through the page. Falls back to the
       ambient planet loop until the clip lands. -->
  <section ref="section" class="break" :class="{ 'break--scrub': heartMode }" :aria-label="BREAK_PHRASE">
    <div class="break__stage">
      <video
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
      <p ref="phraseLeft" class="break__phrase break__phrase--left above-canvas">{{ BREAK_PHRASE_LEFT }}</p>
      <p ref="phraseRight" class="break__phrase break__phrase--right above-canvas">{{ BREAK_PHRASE_RIGHT }}</p>
    </div>
  </section>
</template>

<script setup>
import { BREAK_PHRASE, BREAK_PHRASE_LEFT, BREAK_PHRASE_RIGHT } from '~/data/site'

const src = ref('/media/pixel-earth.mp4')
const poster = ref('/media/pixel-earth-poster.jpg')
const heartMode = ref(false)
const section = ref(null)
const video = ref(null)
const phraseLeft = ref(null)
const phraseRight = ref(null)
const engine = useScrollEngine()

async function probe(url) {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    const type = head.headers.get('content-type') || ''
    return head.ok && type.startsWith('video/')
  } catch (e) {
    return false
  }
}

let ctx
onMounted(async () => {
  /* the campfire replaced the heart checklist as the break's mood piece — an
     ambient loop (fire burns continuously; scrubbing a flame makes no sense).
     The heart scrub path remains as fallback if the campfire clip is absent. */
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
  const v = video.value
  v.load()

  if (!engine) return

  if (engine.reduced) {
    /* static frame: for the heart, the checked poster; never autoplay */
    v.pause()
    return
  }

  if (!heartMode.value) {
    /* legacy ambient loop */
    v.autoplay = true
    v.loop = true
    v.setAttribute('data-motion-video', '')
    if (!engine.motionPaused.value) v.play().catch(() => {})
  }

  ctx = engine.gsap.context(() => {
    if (heartMode.value) {
      /* scrub the drawing of the checkmarks to scroll progress, and beat the
         heart AS A FUNCTION OF SCROLL (sharp double-ish thumps that freeze
         when the reader stops) — no free-running timer */
      /* The clip draws its four ticks unevenly (checks 2 and 3 burst together
         ~2.5–2.9s). Remap scroll → video time so each checkmark gets its own
         even slice of the scroll, i.e. they tick strictly one by one.
         Anchors are (scrollProgress → videoSeconds) measured from the clip.
         The LAST anchor sits at p=0.7, not 1: the trigger spans until the
         section's bottom passes the viewport TOP, so at p=1 the heart is
         already off screen — all four ticks must land while it's still
         centered, then the fully-checked frame holds for the exit. */
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

    /* the two halves rise on either side of the heart, left leading */
    const riseTl = engine.gsap.timeline({
      scrollTrigger: {
        trigger: section.value,
        start: 'top 65%',
        end: 'bottom 20%',
        scrub: true,
      },
    })
    riseTl
      .fromTo(phraseLeft.value, { y: '46vh', autoAlpha: 0 }, { y: '-34vh', autoAlpha: 1, ease: 'none' }, 0)
      .fromTo(phraseRight.value, { y: '52vh', autoAlpha: 0 }, { y: '-28vh', autoAlpha: 1, ease: 'none' }, 0.08)
  })

  /* This section mounts late (after two async probes) and sits below the
     pinned philosophy section, whose pin-spacer shifts everything down. Its
     triggers were being computed against a stale layout and freezing at their
     end state — refresh once the DOM has settled so start/end are correct. */
  const refresh = () => engine.ScrollTrigger.refresh()
  requestAnimationFrame(() => requestAnimationFrame(refresh))
  setTimeout(refresh, 400)
  setTimeout(refresh, 1200)
})
onBeforeUnmount(() => ctx && ctx.revert())
</script>

<style scoped>
.break {
  position: relative;
  z-index: 3; /* covers the canvas, a pure full-bleed mood moment */
  height: 100vh;
}
/* scrub mode: extra runway so the checkmarks draw at a readable pace */
.break--scrub { height: 175vh; }

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

/* the two halves flank the heart so they never cover it; on the light
   daytime sky they read in ink with a soft cream lift */
.break__phrase {
  position: absolute;
  top: 50%;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: clamp(38px, 5.4vw, 76px);
  line-height: 1.14;
  max-width: 9ch;
  color: var(--ink);
  text-shadow: 0 1px 0 rgba(237, 232, 208, 0.4), 0 2px 12px rgba(237, 232, 208, 0.25);
}
.break__phrase--left { left: clamp(18px, 7vw, 120px); text-align: left; }
.break__phrase--right { right: clamp(18px, 7vw, 120px); text-align: right; }

@media (max-width: 899px) {
  /* narrow screens: above and below the heart instead of beside it */
  .break__phrase { max-width: 14ch; font-size: clamp(28px, 7.5vw, 42px); }
  .break__phrase--left { top: 16%; left: 20px; }
  .break__phrase--right { top: auto; bottom: 14%; right: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .break__video--ambient { animation: none; }
}
</style>
