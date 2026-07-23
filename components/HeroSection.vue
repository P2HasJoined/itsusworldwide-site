<template>
  <section id="home" class="hero">
    <!-- DOM video fallback when the WebGL stage is off (mobile / reduced motion).
         Decided after mount so SSR and first client render agree (no hydration
         mismatch); the media is decorative, so SEO loses nothing. -->
    <div v-if="showFallback" class="hero__media" aria-hidden="true">
      <!-- scrub-driven like the WebGL texture: scrolling turns the planet -->
      <video
        ref="fallbackVideo"
        class="hero__video"
        muted
        playsinline
        preload="auto"
        poster="/media/hero-poster.jpg"
      >
        <source src="/media/hero-planet.mp4" type="video/mp4" />
      </video>
      <div class="hero__scrim"></div>
    </div>

    <!-- giant wordmark: sits BELOW the canvas so the planet breaks out of it -->
    <h1 ref="wordmark" class="hero__wordmark display" aria-label="ItsUsWorldwide">
      <span class="hero__wordmark-line">ItsUs</span>
      <span class="hero__wordmark-line hero__wordmark-line--2">Worldwide</span>
    </h1>

    <div class="hero__intro above-canvas">
      <p ref="headline" class="hero__headline">It&rsquo;s a project about, well&hellip; us.</p>
      <p ref="sub" class="hero__sub">
        A personal growth project that begins with you and expands outward to the people around
        you, your community, and society.
      </p>
    </div>

    <HeroMessage />

    <a ref="card" class="hero__card above-canvas" href="#season" data-magnetic @click.prevent="engine && engine.scrollTo('#season')">
      <img src="/media/hero-poster.jpg" alt="" width="52" height="52" />
      <span class="hero__card-text"><em class="px">New</em>Season of Discovery <span class="hero__card-arrow" aria-hidden="true">&rarr;</span></span>
    </a>

    <p ref="cue" class="hero__cue above-canvas">Welcome to Us <span class="hero__cue-arrow" aria-hidden="true">&darr;</span></p>
  </section>
</template>

<script setup>
const engine = useScrollEngine()
/* start false so SSR and first client render agree (no hydration mismatch);
   a watcher below keeps it the inverse of use3D. Crucially it must flip back
   to false if use3D turns on after mount, or the DOM fallback video renders
   on top of the WebGL canvas (the duplicate-planet bug). */
const showFallback = ref(false)

const wordmark = ref(null)
const headline = ref(null)
const sub = ref(null)
const card = ref(null)
const cue = ref(null)
const fallbackVideo = ref(null)

let ctx
onMounted(() => {
  if (engine) {
    watch(() => engine.use3D.value, (on) => (showFallback.value = !on), { immediate: true })
  } else {
    showFallback.value = true
  }
  if (!engine || engine.reduced) return
  ctx = engine.gsap.context(() => {
    const split = new engine.SplitText(wordmark.value.querySelectorAll('.hero__wordmark-line'), {
      type: 'chars',
    })
    engine.gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .from(split.chars, { yPercent: 110, autoAlpha: 0, duration: 0.9, stagger: 0.035 }, 0.15)
      .from(headline.value, { y: 24, autoAlpha: 0, duration: 0.6 }, '-=0.45')
      .from(sub.value, { y: 20, autoAlpha: 0, duration: 0.6 }, '-=0.4')
      .from(card.value, { y: 30, autoAlpha: 0, duration: 0.5 }, '-=0.35')
      .from(cue.value, { autoAlpha: 0, duration: 0.5 }, '-=0.2')

    /* the wordmark drifts up slightly faster than the page — cheap depth */
    engine.gsap.to(wordmark.value, {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true },
    })

    /* mobile fallback video is scrubbed by scroll, same as the GL texture */
    nextTick(() => {
      const fv = fallbackVideo.value
      if (!fv) return
      fv.load()
      engine.ScrollTrigger.create({
        trigger: '#home',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          if (!fv.duration) return
          const t = self.progress * Math.max(0, fv.duration - 0.05)
          if (Math.abs(t - fv.currentTime) > 0.034) fv.currentTime = t
        },
      })
    })
  })
})
onBeforeUnmount(() => ctx && ctx.revert())
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: var(--nav-h) clamp(20px, 5vw, 72px) 90px;
  overflow: hidden;
}

.hero__media { position: absolute; inset: 0; }
.hero__video { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.hero__scrim {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(14, 26, 20, 0.68), rgba(14, 26, 20, 0.3) 45%, rgba(14, 26, 20, 0.55));
}

.hero__wordmark {
  position: relative;
  z-index: 3; /* above the fixed canvas (z2): the globe sits BEHIND the letters */
  text-align: left;
  font-size: clamp(52px, 11vw, 165px);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.94;
  color: var(--neutral-cream);
  user-select: none;
}
.hero__wordmark-line { display: block; overflow: hidden; }
.hero__wordmark-line--2 { color: var(--neutral-clay); }

.hero__intro { max-width: 480px; margin-top: clamp(26px, 4vh, 50px); text-align: left; text-shadow: 0 1px 8px rgba(14, 26, 20, 0.85); }
.hero__headline { font-family: var(--font-display); font-weight: 700; font-size: clamp(20px, 2.5vw, 26px); letter-spacing: -0.02em; }
.hero__sub { color: var(--text-muted); margin-top: 10px; font-size: 16px; }

.hero__card {
  position: absolute;
  left: clamp(16px, 3vw, 40px);
  bottom: clamp(20px, 4vh, 44px);
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 18px 12px 12px;
  box-shadow: var(--shadow-soft);
  transition: border-color 0.2s ease;
}
.hero__card:hover { border-color: var(--neutral-clay); }
.hero__card img { border-radius: 8px; object-fit: cover; width: 52px; height: 52px; image-rendering: pixelated; }
.hero__card-text { font-weight: 700; font-size: 14px; line-height: 1.45; display: block; max-width: 175px; }
.hero__card-text em {
  display: block;
  font-style: normal;
  font-size: 8px;
  color: var(--ink);
  background: var(--accent-warm);
  padding: 3px 6px 4px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.hero__card-arrow { color: var(--accent-warm-2); }

.hero__cue {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: clamp(18px, 3.5vh, 36px);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--neutral-cream);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}
.hero__cue-arrow { display: inline-block; animation: cue-bounce 1.7s ease-in-out infinite; }
@keyframes cue-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

@media (max-width: 899px) {
  .hero__card { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hero__cue-arrow { animation: none; }
}
</style>
