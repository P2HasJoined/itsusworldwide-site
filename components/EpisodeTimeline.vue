<template>
  <section id="season" class="season above-canvas">
    <div class="season__band">
      <div class="season__band-inner">
        <!-- waterfall dropdown: pick a season -->
        <div class="season__dd" ref="dd">
          <button
            class="season__dd-btn"
            type="button"
            :aria-expanded="String(ddOpen)"
            aria-haspopup="listbox"
            data-magnetic
            @click="ddOpen = !ddOpen"
          >
            <h2 class="season__label display">{{ activeSeason.label }}</h2>
            <span class="season__dd-caret" aria-hidden="true">&#9662;</span>
          </button>

          <div v-show="ddVisible" ref="pour" class="season__pour">
            <!-- a quiet brand watermark tucked behind the waterfall/menu —
                 same family of color as the terracotta band, just enough
                 contrast to find if you look, not enough to compete with
                 the menu text -->
            <p class="season__love" aria-hidden="true"><span>L</span><span>O</span><span>V</span><span>E</span></p>

            <!-- the waterfall the bubbles pour out of -->
            <div class="season__fall" aria-hidden="true">
              <video
                v-if="waterfallSrc"
                class="season__fall-video"
                autoplay
                loop
                muted
                playsinline
                :src="waterfallSrc"
                data-motion-video
              ></video>
              <span v-else class="season__fall-css"></span>
            </div>

            <ul class="season__dd-menu" role="listbox" aria-label="Choose a season">
              <li v-for="s in SEASONS" :key="s.id">
                <button
                  type="button"
                  role="option"
                  :aria-selected="String(s.id === activeSeason.id)"
                  class="season__opt"
                  :class="{ 'is-active': s.id === activeSeason.id }"
                  @click="pick(s)"
                >
                  <span class="season__opt-label">{{ s.label }}</span>
                  <span v-if="s.status === 'now'" class="season__opt-tag px">now</span>
                  <span v-else-if="s.status === 'finale'" class="season__opt-tag px">finale</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <p class="season__count">{{ countLabel }}</p>
        <div class="season__controls">
          <button class="season__arrow" type="button" aria-label="Previous episodes" data-magnetic @click="move(-1)">&larr;</button>
          <button class="season__arrow" type="button" aria-label="Next episodes" data-magnetic @click="move(1)">&rarr;</button>
        </div>
      </div>
    </div>

    <div ref="viewport" class="season__viewport">
      <ul ref="track" class="season__track" aria-label="Episode timeline">
        <template v-if="seasonEpisodes.length">
          <li v-for="ep in seasonEpisodes" :key="ep.n" class="ep" :class="ep.status === 'published' ? 'ep--live' : 'ep--soon'">
            <span class="ep__num px">EP {{ pad(ep.n) }}</span>
            <template v-if="ep.status === 'published'">
              <h3 class="ep__title">{{ ep.title }}</h3>
              <p v-if="ep.subtitle" class="ep__subtitle">{{ ep.subtitle }}</p>
              <p class="ep__meta"><span class="px ep__stamp">{{ ep.dateLabel }} &middot; {{ ep.runtime }}</span></p>
              <p class="ep__desc">{{ ep.desc }}</p>
              <a class="ep__listen" :href="SITE.links.spotify" target="_blank" rel="noopener">Listen &#8599;</a>
            </template>
            <template v-else>
              <p class="ep__question">{{ ep.arc }}</p>
              <span class="chip-px">Coming soon</span>
            </template>
          </li>
        </template>
        <li v-else class="ep ep--soon ep--seasoncard">
          <p class="ep__question">{{ activeSeason.tagline }}</p>
          <span class="chip-px">{{ activeSeason.status === 'finale' ? 'The final season' : 'Coming soon' }}</span>
        </li>
      </ul>
    </div>
    <p class="season__hint">Drag the timeline, or use the arrows.</p>
  </section>
</template>

<script setup>
import { SITE, EPISODES, SEASONS } from '~/data/site'

const pad = (n) => String(n).padStart(2, '0')

const ddOpen = ref(false)
const ddVisible = ref(false)
const dd = ref(null)
const pour = ref(null)
const waterfallSrc = ref(null)
let ddTl = null
const activeSeason = ref(SEASONS[0])
const seasonEpisodes = computed(() => EPISODES.filter((e) => e.season === activeSeason.value.id))
const countLabel = computed(() => {
  if (!seasonEpisodes.value.length) return 'coming soon'
  const live = seasonEpisodes.value.filter((e) => e.status === 'published').length
  return `${live} of ${SITE.seasonGoal} episodes`
})

const viewport = ref(null)
const track = ref(null)
const engine = useScrollEngine()

let drag = null
let targetX = 0
let onResize, onDocClick, onKey

/* the pour: the waterfall falls first, then each season bubble drops out of
   it and bounces into place, top to bottom, like being poured */
watch(ddOpen, async (open) => {
  if (!engine || engine.reduced) {
    ddVisible.value = open
    return
  }
  const gsap = engine.gsap
  ddTl && ddTl.kill()

  if (open) {
    ddVisible.value = true
    await nextTick()
    const fall = pour.value.querySelector('.season__fall')
    const items = pour.value.querySelectorAll('.season__dd-menu li')
    ddTl = gsap.timeline()
    ddTl
      .fromTo(
        fall,
        { scaleY: 0, transformOrigin: '50% 0%' },
        { scaleY: 1, duration: 0.32, ease: 'power2.in' }
      )
      .fromTo(
        items,
        {
          y: (i) => -80 - i * 54 /* every row starts up at the spout */,
          autoAlpha: 0,
        },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.6,
          ease: 'bounce.out',
          stagger: 0.1,
        },
        '-=0.08'
      )
  } else {
    const fall = pour.value && pour.value.querySelector('.season__fall')
    const items = pour.value ? pour.value.querySelectorAll('.season__dd-menu li') : []
    ddTl = gsap.timeline({ onComplete: () => (ddVisible.value = false) })
    ddTl
      .to(items, { y: 34, autoAlpha: 0, duration: 0.2, ease: 'power2.in', stagger: 0.045 })
      .to(fall, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.2, ease: 'power2.out' }, '-=0.08')
  }
})

const stepSize = () => {
  const card = track.value && track.value.querySelector('.ep')
  return card ? card.offsetWidth + 24 : 340
}

function minX() {
  const pad2 = 2 * parseFloat(getComputedStyle(viewport.value).paddingLeft || 0)
  return Math.min(0, viewport.value.clientWidth - pad2 - track.value.scrollWidth)
}
const clampX = (x) => Math.max(minX(), Math.min(0, x))

function move(dir) {
  if (!engine || engine.reduced || !drag) {
    viewport.value.scrollBy({ left: dir * stepSize(), behavior: 'smooth' })
    return
  }
  targetX = clampX(targetX - dir * stepSize())
  engine.gsap.to(track.value, {
    x: targetX,
    duration: 0.55,
    ease: 'power3.out',
    onUpdate: () => drag && drag.update(),
  })
}

async function pick(season) {
  if (season.id === activeSeason.value.id) {
    ddOpen.value = false
    return
  }
  activeSeason.value = season
  ddOpen.value = false
  await nextTick()
  targetX = 0
  if (drag) {
    engine.gsap.set(track.value, { x: 0 })
    drag.update()
    drag.applyBounds({ minX: minX(), maxX: 0 })
  } else if (viewport.value) {
    viewport.value.scrollTo({ left: 0 })
  }
  engine && engine.ScrollTrigger.refresh()
}

onMounted(async () => {
  onDocClick = (e) => {
    if (ddOpen.value && dd.value && !dd.value.contains(e.target)) ddOpen.value = false
  }
  onKey = (e) => {
    if (e.key === 'Escape') ddOpen.value = false
  }
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)

  /* waterfall clip, once it exists (content-type check: dev server lies) */
  try {
    const head = await fetch('/media/waterfall.mp4', { method: 'HEAD' })
    const type = head.headers.get('content-type') || ''
    if (head.ok && type.startsWith('video/')) waterfallSrc.value = '/media/waterfall.mp4'
  } catch (e) { /* CSS fallback stream */ }

  if (!engine || engine.reduced || !engine.Draggable) {
    viewport.value.style.overflowX = 'auto'
    return
  }
  drag = engine.Draggable.create(track.value, {
    type: 'x',
    bounds: { minX: minX(), maxX: 0 },
    edgeResistance: 0.82,
    cursor: 'grab',
    activeCursor: 'grabbing',
    onDragEnd: function () {
      targetX = this.x
    },
  })[0]
  onResize = () => {
    drag.applyBounds({ minX: minX(), maxX: 0 })
    targetX = clampX(targetX)
  }
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  drag && drag.kill()
})
</script>

<style scoped>
.season { padding-bottom: clamp(90px, 12vh, 150px); }

/* the site's ONE terracotta band */
.season__band {
  position: sticky;
  top: 0;
  z-index: 90;
  background: var(--accent-warm);
  color: var(--ink);
}
.season__band-inner {
  max-width: 1240px;
  margin: 0 auto;
  padding: calc(var(--nav-h) + 14px) clamp(20px, 4vw, 48px) 20px;
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}
.season__label {
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 800;
  letter-spacing: -0.02em;
  display: inline;
}

/* ------------------------- waterfall dropdown -------------------------- */
.season__dd { position: relative; }
.season__dd-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.season__dd-caret { font-size: 20px; transition: transform 0.25s ease; }
.season__dd-btn[aria-expanded='true'] .season__dd-caret { transform: rotate(180deg); }

.season__pour {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 95;
  padding-bottom: 26px;
}

/* hidden brand watermark — off by default, only revealed in the mobile
   layout below where repositioning the waterfall frees up room for it */
.season__love {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  pointer-events: none;
}
.season__love span {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.03em;
  /* the site's own terracotta (--accent-warm, #C4673A) at partial opacity —
     the pour panel sits over the dark valley background, not the orange
     band, so it needs real brightness/warmth to read at all against that,
     while staying muted enough to feel like a found detail, not a label */
  color: rgba(196, 103, 58, 0.55);
}

/* the waterfall itself: generated pixel water, soft-masked at the edges */
.season__fall {
  position: absolute;
  top: -10px;
  left: 18px;
  width: 118px;
  height: calc(100% + 10px);
  z-index: 0;
  overflow: hidden;
  border-radius: 0 0 22px 22px;
  mask-image: radial-gradient(130% 96% at 50% 44%, #000 58%, transparent 97%);
  -webkit-mask-image: radial-gradient(130% 96% at 50% 44%, #000 58%, transparent 97%);
  filter: drop-shadow(0 8px 20px rgba(20, 40, 60, 0.45));
}
.season__fall-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}
/* CSS fallback stream until the clip lands */
.season__fall-css {
  display: block;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(90deg, rgba(62, 207, 142, 0.12), rgba(237, 232, 208, 0.5) 45%, rgba(59, 111, 160, 0.55) 60%, rgba(62, 207, 142, 0.12)),
    repeating-linear-gradient(180deg, rgba(237, 232, 208, 0.3) 0 8px, rgba(59, 111, 160, 0.3) 8px 20px);
  background-size: 100% 100%, 100% 40px;
  animation: fall-flow 0.4s linear infinite;
}
@keyframes fall-flow {
  to { background-position: 0 0, 0 40px; }
}

/* plain text options on a quiet glass panel beside the falls */
.season__dd-menu {
  position: relative;
  z-index: 1;
  margin-left: 148px;
  width: 252px;
  display: grid;
  gap: 2px;
  padding: 10px 8px;
  background: rgba(14, 26, 20, 0.8);
  border: 1px solid var(--border);
  border-radius: 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4);
}
.season__opt {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  padding: 12px 14px;
  border-radius: 8px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--neutral-cream);
  transition: background-color 0.15s ease;
}
.season__opt:hover { background: rgba(237, 232, 208, 0.09); }
.season__opt.is-active { background: rgba(237, 232, 208, 0.06); }
/* active dot, same treatment as the nav */
.season__opt.is-active .season__opt-label::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-warm);
  margin-right: 10px;
  vertical-align: middle;
}
.season__opt-tag { font-size: 7px; color: var(--neutral-clay); flex: 0 0 auto; }

.season__count { font-weight: 800; font-size: 14px; margin-left: auto; }
.season__controls { display: flex; gap: 8px; }
.season__arrow {
  width: 42px;
  height: 42px;
  background: var(--ink);
  color: var(--neutral-cream);
  border-radius: 8px;
  font-size: 18px;
  line-height: 1;
  transition: transform 0.12s ease;
}
.season__arrow:hover { transform: translateY(-2px); }
.season__arrow:focus-visible { outline-color: var(--ink); }

.season__viewport { overflow: hidden; padding: clamp(48px, 7vh, 80px) clamp(20px, 4vw, 48px) 20px; }
.season__track { display: flex; gap: 24px; width: max-content; cursor: grab; }

.ep {
  flex: 0 0 auto;
  width: min(320px, 78vw);
  border-radius: var(--radius);
  padding: 26px 26px 30px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.ep--live { background: var(--bg-surface-1); border: 1px solid var(--border); box-shadow: var(--shadow-soft); transition: transform 0.2s ease; }
.ep--live:hover { transform: translateY(-4px); }
.ep--soon { border: 2px dashed var(--border); }
.ep--seasoncard { width: min(560px, 86vw); }

.ep__num { font-size: 10px; color: var(--neutral-clay); margin-bottom: 18px; }
.ep__title {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 23px;
  line-height: 1.25;
  margin-bottom: 4px;
}
.ep__subtitle { font-weight: 700; font-size: 14px; color: var(--text-muted); margin-bottom: 8px; }
.ep__meta { margin-bottom: 12px; }
.ep__stamp { font-size: 8px; color: var(--text-muted); line-height: 1.8; }
.ep__desc { font-size: 15px; color: var(--text-muted); margin-bottom: 18px; }
.ep__listen { margin-top: auto; font-weight: 800; color: var(--accent-warm-2); }
.ep__listen:hover { color: var(--green-vitality); }

.ep--soon .ep__question {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
  font-size: 23px;
  line-height: 1.35;
  color: var(--text-dim);
  margin: auto 0;
}
.ep--seasoncard .ep__question { color: var(--text-muted); }
.ep--soon .chip-px { margin-top: 18px; }
.ep--seasoncard .ep__num { display: none; }

.season__hint { text-align: center; font-size: 13px; color: var(--text-dim); padding: 8px 20px 0; }

@media (max-width: 520px) {
  .season__count { display: none; }
  /* MOBILE FIX (v7.2): .season__dd-menu's desktop sizing (margin-left:148px
     + width:252px ≈ 400px of required horizontal room) genuinely ran the
     dropdown off the right edge of the screen on phones. First fix sat the
     waterfall BEHIND the full-width menu; user asked for it back beside the
     menu instead — so the waterfall shrinks and moves to the left, the menu
     takes the remaining width to its right, side by side, both fitting in
     the available ~335px. */
  .season__pour { left: 0; right: 0; max-width: calc(100vw - 40px); }
  .season__fall { left: 0; width: 62px; }
  .season__dd-menu { margin-left: 106px; width: calc(100% - 106px); max-width: 226px; }
  /* the LOVE watermark lives in the open gap between the waterfall and the
     menu — NOT behind either one: the waterfall video is fully opaque and
     the menu's dark glass turned out too opaque in practice to let a
     background color show through it (tested — even 90% opacity vanished
     completely behind the menu's blur+tint). Bare background here, so a
     muted version of the site's own terracotta reads as a findable but
     quiet watermark instead of fighting either element. */
  .season__love {
    display: flex;
    left: 68px;
    width: 32px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .season__viewport { overflow-x: auto; }
  .season__fall-css { animation: none; }
}
</style>
