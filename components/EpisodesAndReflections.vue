<template>
  <section id="journal" class="journal above-canvas">
    <div class="container journal__grid">
      <div class="journal__block">
        <p class="eyebrow" data-reveal>Latest episodes</p>
        <h2 class="journal__title display" data-split>Fresh from the mic.</h2>
        <div class="journal__episodes" data-reveal-group>
          <a
            v-for="ep in latest"
            :key="ep.n"
            class="epcard"
            :href="SITE.links.spotify"
            target="_blank"
            rel="noopener"
          >
            <span class="epcard__num px">EP {{ pad(ep.n) }}</span>
            <h3 class="epcard__title">{{ ep.title }}<template v-if="ep.subtitle"> | {{ ep.subtitle }}</template></h3>
            <p class="epcard__meta">{{ ep.dateLabel }} &middot; {{ ep.runtime }}</p>
            <p class="epcard__desc">{{ ep.desc }}</p>
          </a>
        </div>
        <a class="textlink" href="#season" data-reveal @click.prevent="engine && engine.scrollTo('#season')">More episodes &rarr;</a>
      </div>

      <div class="journal__block">
        <p class="eyebrow" data-reveal>Written reflections</p>
        <h2 class="journal__title display" data-split>Deeper on the page.</h2>
        <ul class="journal__reflections" data-reveal-group>
          <li v-for="(r, i) in REFLECTIONS" :key="i" class="refl">
            <div>
              <span class="refl__title">{{ r.title }}</span>
              <span class="refl__meta">Tied to Ep. {{ pad(r.episode) }} &middot; {{ r.readTime }}</span>
            </div>
            <a v-if="r.url" class="refl__action" :href="r.url">Read &rarr;</a>
            <span v-else class="chip-px">Coming soon</span>
          </li>
        </ul>
        <p class="journal__note" data-reveal>
          Written pieces go deeper than the audio. New reflections land with each episode.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { SITE, EPISODES, REFLECTIONS } from '~/data/site'

const pad = (n) => String(n).padStart(2, '0')
const latest = EPISODES.filter((e) => e.status === 'published').slice(-3).reverse()
const engine = useScrollEngine()
</script>

<style scoped>
.journal { padding: clamp(100px, 14vh, 170px) 0; }

.journal__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(48px, 7vw, 110px);
  align-items: start;
}
.journal__title {
  font-size: clamp(26px, 3vw, 38px);
  font-weight: 700;
  margin-bottom: 36px;
}

.journal__episodes { display: grid; gap: 20px; margin-bottom: 30px; }
.epcard {
  background: var(--bg-surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px 24px;
  display: block;
  transition: border-color 0.2s ease;
}
.epcard:hover { border-color: var(--neutral-clay); }
.epcard__num { font-size: 9px; color: var(--neutral-clay); }
.epcard__title {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 20px;
  margin: 10px 0 4px;
}
.epcard__meta { font-size: 14px; color: var(--text-muted); }
.epcard__desc { font-size: 15px; color: var(--text-muted); margin-top: 8px; }

.journal__reflections { display: grid; margin-bottom: 30px; }
.refl {
  padding: 22px 4px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
}
.refl:first-child { border-top: 1px solid var(--border); }
.refl__title { font-family: var(--font-display); font-weight: 700; font-size: 18px; display: block; }
.refl__meta { display: block; font-size: 14px; color: var(--text-muted); margin-top: 4px; }
.refl__action { flex: 0 0 auto; font-weight: 800; color: var(--neutral-cream); white-space: nowrap; }
.journal__note { font-size: 14px; color: var(--text-dim); max-width: 40ch; }

@media (max-width: 899px) {
  .journal__grid { grid-template-columns: 1fr; }
}
</style>
