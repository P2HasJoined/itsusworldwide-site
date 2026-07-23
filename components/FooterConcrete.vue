<template>
  <!-- 5.7 part 2 + 5.12: the footer. Concrete texture surface with fragments
       of the hero notification set into it — as if the words fell from the
       hero, landed in wet concrete, and it hardened around them. -->
  <footer class="footer above-canvas">
    <!-- barely-moving concrete ambient loop; static texture stays as base -->
    <video
      v-if="ambientSrc"
      class="footer__ambient"
      autoplay
      loop
      muted
      playsinline
      preload="metadata"
      aria-hidden="true"
      data-motion-video
    >
      <source :src="ambientSrc" type="video/mp4" />
    </video>
    <div class="footer__veil" aria-hidden="true"></div>

    <div class="footer__debris" aria-hidden="true">
      <span
        v-for="(f, i) in fragments"
        :key="i"
        class="footer__frag px"
        :class="f.mode"
        :style="{ left: f.x, top: f.y, transform: `rotate(${f.rot}deg)` }"
      >{{ f.text }}</span>
    </div>

    <div class="container footer__grid">
      <div class="footer__brand">
        <p class="footer__logo display">ItsUsWorldwide</p>
        <p class="footer__tag">Welcome to the family.</p>
      </div>

      <nav class="footer__col" aria-label="Footer">
        <h3 class="footer__head">Explore</h3>
        <a v-for="l in navLinks" :key="l.hash" :href="l.hash" @click.prevent="engine && engine.scrollTo(l.hash)">{{ l.label }}</a>
      </nav>

      <div class="footer__col">
        <h3 class="footer__head">Listen</h3>
        <a :href="SITE.links.spotify" target="_blank" rel="noopener">Spotify</a>
        <a :href="SITE.links.apple" target="_blank" rel="noopener">Apple Podcasts</a>
        <span class="footer__soon">Socials: [PLACEHOLDER]</span>
      </div>

      <div class="footer__col">
        <h3 class="footer__head">Contact</h3>
        <a :href="`mailto:${SITE.email}`">{{ SITE.email }}</a>
        <span class="footer__soon">Legal &middot; Privacy: coming soon</span>
      </div>
    </div>

    <div class="container footer__bottom">
      <p>&copy; {{ year }} ItsUsWorldwide &middot; itsusworldwide.com</p>
      <p class="footer__credit px">built with love for all of US.</p>
    </div>
  </footer>
</template>

<script setup>
import { SITE } from '~/data/site'

const engine = useScrollEngine()
const year = new Date().getFullYear()
const ambientSrc = ref(null)

onMounted(async () => {
  if (engine && engine.reduced) return /* static texture only */
  try {
    const head = await fetch('/media/footer-concrete.mp4', { method: 'HEAD' })
    const type = head.headers.get('content-type') || ''
    if (head.ok && type.startsWith('video/')) ambientSrc.value = '/media/footer-concrete.mp4'
  } catch (e) { /* static texture stays */ }
})

const navLinks = [
  { label: 'Home', hash: '#home' },
  { label: 'Philosophy', hash: '#philosophy' },
  { label: 'Podcast', hash: '#season' },
  { label: 'Journal', hash: '#journal' },
  { label: 'Ask Us', hash: '#ask' },
  { label: 'About', hash: '#about' },
]

/* debris from the hero notification, settled where it fell.
   "rest here" stays the most legible — it's the emotional payoff line. */
const fragments = [
  { text: 'hello', x: '6%', y: '18%', rot: -8, mode: 'is-recessed' },
  { text: 'fellow', x: '78%', y: '10%', rot: 5, mode: 'is-recessed' },
  { text: 'human...', x: '86%', y: '38%', rot: -3, mode: 'is-raised' },
  { text: 'take a', x: '14%', y: '62%', rot: 4, mode: 'is-recessed' },
  { text: 'moment', x: '58%', y: '80%', rot: -5, mode: 'is-recessed' },
  { text: 'rest here', x: '38%', y: '30%', rot: -2, mode: 'is-raised is-payoff' },
]
</script>

<style scoped>
.footer {
  position: relative;
  border-top: 1px solid var(--border);
  padding: clamp(70px, 10vh, 120px) 0 40px;
  overflow: hidden;
  /* the concrete: generated texture study, kept in-palette, veiled for AA contrast */
  background:
    linear-gradient(180deg, rgba(14, 26, 20, 0.82), rgba(14, 26, 20, 0.72)),
    url('/media/ref/concrete-texture.png') center / cover no-repeat,
    var(--bg-surface-1);
}

.footer__ambient {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
}
.footer__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(14, 26, 20, 0.82), rgba(14, 26, 20, 0.72));
}

.footer__debris { position: absolute; inset: 0; pointer-events: none; }
.footer__frag {
  position: absolute;
  font-size: 11px;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
/* dropped in while wet: recessed — darker than the surface, lit from below */
.footer__frag.is-recessed {
  color: rgba(8, 15, 11, 0.9);
  text-shadow: 0 1px 0 rgba(237, 232, 208, 0.09), 0 -1px 1px rgba(0, 0, 0, 0.85);
}
/* raised — slightly proud of the surface, casting a small drop shadow */
.footer__frag.is-raised {
  color: rgba(196, 164, 132, 0.5);
  text-shadow: 0 2px 2px rgba(0, 0, 0, 0.7), 0 -1px 0 rgba(237, 232, 208, 0.06);
}
.footer__frag.is-payoff { color: rgba(196, 164, 132, 0.78); font-size: 13px; }

.footer__grid {
  position: relative;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: clamp(30px, 5vw, 70px);
  padding-bottom: 50px;
}
.footer__logo { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
.footer__tag { color: var(--text-muted); }
.footer__head {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--neutral-clay);
  margin-bottom: 18px;
}
.footer__col { display: grid; gap: 10px; align-content: start; justify-items: start; }
.footer__col a { color: var(--text-muted); font-weight: 600; }
.footer__col a:hover { color: var(--neutral-cream); }
.footer__soon { font-size: 13px; color: var(--text-dim); }

.footer__bottom {
  position: relative;
  border-top: 1px solid var(--border);
  padding-top: 26px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-muted);
  font-size: 14px;
}
/* the credit line — a sanctioned pixel-font job */
.footer__credit { font-size: 9px; color: var(--neutral-clay); margin-right: 88px; align-self: center; }

@media (max-width: 899px) {
  .footer__grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 520px) {
  .footer__grid { grid-template-columns: 1fr; }
}
</style>
