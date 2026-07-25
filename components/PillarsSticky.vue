<template>
  <section id="pieces" ref="root" class="pillars above-canvas">
    <div class="container">
      <p class="eyebrow" data-reveal>How the pieces fit</p>
      <h2 class="section-title" data-split>One idea, three homes.</h2>

      <div class="pillars__grid">
        <ul class="pillars__list" aria-label="The three pillars">
          <li
            v-for="(p, i) in pillars"
            :key="p.id"
            class="pillars__item"
            :class="{ 'is-active': active === i }"
          >
            <button type="button" data-magnetic @click="goTo(i)">
              <span class="pillars__arrow" aria-hidden="true">&rarr;</span>{{ p.label }}
            </button>
          </li>
        </ul>

        <div class="pillars__panels">
          <article id="panel-podcast" class="pillars__panel">
            <p class="pillars__kicker">The voice</p>
            <h3 class="pillars__heading">UsWorldWide, the podcast</h3>
            <p>
              Hosted by Basie Comer. Warm, honest, a little playful. Every episode raises a
              question, makes it personal, laughs at it, deepens it, challenges it, and lands
              somewhere practical.
            </p>
            <p class="pillars__meta"><span class="rating">5.0 &#9733;</span> &middot; Health &amp; Fitness &middot; Weekly</p>
            <div class="pillars__actions">
              <a class="btn btn--warm" :href="SITE.links.spotify" target="_blank" rel="noopener" data-magnetic>Listen on Spotify</a>
              <a class="btn btn--warm" :href="SITE.links.apple" target="_blank" rel="noopener" data-magnetic>Listen on Apple</a>
            </div>
          </article>

          <article id="panel-website" class="pillars__panel">
            <p class="pillars__kicker">You are here</p>
            <h3 class="pillars__heading">The home for the whole idea</h3>
            <p>
              Everything lives here: the philosophy, the episode archive, written reflections that
              go deeper than the audio, and a place to ask questions back.
            </p>
            <p><a class="textlink" href="#ask" @click.prevent="engine && engine.scrollTo('#ask')">Ask Us something &rarr;</a></p>
          </article>

          <article id="panel-practice" class="pillars__panel">
            <p class="pillars__kicker">Coming soon</p>
            <h3 class="pillars__heading">USWorldWide, the app</h3>
            <p>A gamified companion app that turns this philosophy into a daily practice. Coming soon.</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { SITE } from '~/data/site'

const pillars = [
  { id: 'panel-podcast', label: ' The Podcast' },
  { id: 'panel-website', label: ' The Website' },
  { id: 'panel-practice', label: ' The Practice' },
]

const active = ref(0)
const root = ref(null)
const engine = useScrollEngine()

function goTo(i) {
  if (engine) engine.scrollTo('#' + pillars[i].id)
}

let ctx
onMounted(() => {
  if (!engine) return
  ctx = engine.gsap.context(() => {
    const panels = Array.from(root.value.querySelectorAll('.pillars__panel'))
    panels.forEach((panel, i) => {
      engine.ScrollTrigger.create({
        trigger: panel,
        start: 'top 58%',
        end: 'bottom 58%',
        onToggle: (self) => {
          if (self.isActive) active.value = i
        },
      })
      /* subtle depth shift between panels instead of a flat crossfade.
         MOBILE FIX (v7.2.1): the continuous scrub + 3D z-transform combo is
         a known-fragile pairing on real mobile Safari/Chrome compositing —
         it read as "not animating" on device even though the underlying
         ScrollTrigger math checked out fine in testing. Mobile now gets a
         simpler one-time reveal (no scrub, no z-depth) instead — same fade
         + rise, just driven by a single robust trigger instead of a
         continuously-sampled scroll position. Desktop keeps the original
         scrub-driven depth effect untouched. */
      if (!engine.reduced) {
        if (engine.isMobile()) {
          engine.gsap.fromTo(
            panel,
            { autoAlpha: 0.35, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: { trigger: panel, start: 'top 88%', once: true },
            }
          )
        } else {
          engine.gsap.fromTo(
            panel,
            { z: -60, autoAlpha: 0.35, y: 40 },
            {
              z: 0,
              autoAlpha: 1,
              y: 0,
              ease: 'power2.out',
              scrollTrigger: { trigger: panel, start: 'top 85%', end: 'top 45%', scrub: true },
            }
          )
        }
      }
    })
  })
})
onBeforeUnmount(() => ctx && ctx.revert())
</script>

<style scoped>
.pillars { padding: clamp(100px, 14vh, 170px) 0; }

.pillars__grid {
  display: grid;
  grid-template-columns: minmax(260px, 340px) 1fr;
  gap: clamp(40px, 6vw, 110px);
  align-items: start;
  perspective: 900px;
}

.pillars__list {
  position: sticky;
  top: calc(var(--nav-h) + 40px);
  display: grid;
  gap: 26px;
}
.pillars__item button {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: clamp(22px, 2.4vw, 30px);
  color: var(--text-dim);
  text-align: left;
  transition: color 0.25s ease;
  padding: 4px 0;
}
.pillars__arrow {
  display: inline-block;
  width: 0;
  overflow: hidden;
  vertical-align: baseline;
  transition: width 0.25s ease;
  color: var(--neutral-cream);
}
.pillars__item.is-active button { color: var(--neutral-cream); }
.pillars__item.is-active .pillars__arrow { width: 1.3em; }

.pillars__panels { display: grid; transform-style: preserve-3d; }
.pillars__panel {
  min-height: 52vh;
  padding: clamp(30px, 6vh, 70px) 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
.pillars__panel:last-child { border-bottom: 0; }
.pillars__kicker {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--neutral-clay);
  margin-bottom: 20px;
}
.pillars__heading {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: clamp(25px, 2.8vw, 34px);
  margin-bottom: 16px;
}
.pillars__panel p { color: var(--text-muted); max-width: 54ch; }
.pillars__meta { margin-top: 14px; font-weight: 700; }
.pillars__meta .rating { color: var(--accent-amber); }
.pillars__actions { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 28px; }

@media (max-width: 899px) {
  .pillars__grid { grid-template-columns: 1fr; }
  .pillars__list {
    position: static;
    grid-auto-flow: column;
    overflow-x: auto;
    gap: 20px;
    padding-bottom: 6px;
    /* MOBILE FIX (v7.2): "The Practice" was cutting off mid-word at the
       right edge with no hint the row scrolls — fade it instead of a hard
       clip. Desktop uses the sticky column layout above, never this rule. */
    -webkit-mask-image: linear-gradient(to right, black calc(100% - 28px), transparent 100%);
    mask-image: linear-gradient(to right, black calc(100% - 28px), transparent 100%);
  }
  .pillars__item button { font-size: 18px; white-space: nowrap; }
  .pillars__panel { min-height: 0; }
}
</style>
