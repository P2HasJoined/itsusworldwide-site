<template>
  <header class="nav">
    <nav ref="pillsEl" class="nav__pills" aria-label="Primary">
      <a
        v-for="(item, i) in items"
        :key="item.hash"
        class="pill"
        :class="{ 'is-active': active === i }"
        :href="item.hash"
        :title="item.title"
        data-magnetic
        @click.prevent="go(item.hash)"
      >{{ item.label }}</a>
    </nav>
  </header>
</template>

<script setup>
/* ordered to match the page's actual section flow, so the scrollspy dot
   travels left → right as the reader scrolls down */
const items = [
  { label: 'Home', hash: '#home' },
  { label: 'Philosophy', hash: '#philosophy', title: 'What is “Us”?' },
  { label: 'About', hash: '#about' },
  { label: 'Podcast', hash: '#season' },
  { label: 'Ask Us', hash: '#ask' },
  { label: 'Journal', hash: '#journal' },
]

const active = ref(0)
const pillsEl = ref(null)
const engine = useScrollEngine()

function go(hash) {
  if (!engine) return
  /* curtain transition on nav clicks (skipped automatically when reduced) */
  engine.curtainTarget.value = hash
}

let spyUpdate
onMounted(() => {
  if (!engine) return
  const sections = items
    .map((item, i) => ({ el: document.querySelector(item.hash), i }))
    .filter((s) => s.el)

  /* deterministic scrollspy: which section contains the 45% viewport line */
  spyUpdate = () => {
    const line = window.scrollY + window.innerHeight * 0.45
    let found = null
    for (const s of sections) {
      const top = s.el.getBoundingClientRect().top + window.scrollY
      if (line >= top && line < top + s.el.offsetHeight) found = s.i
    }
    if (found !== null) active.value = found
  }
  window.addEventListener('scroll', spyUpdate, { passive: true })
  spyUpdate()

  if (!engine.reduced) {
    engine.gsap.from(pillsEl.value, { y: -18, autoAlpha: 0, duration: 0.5, delay: 0.2, ease: 'power2.out' })
  }
})
onBeforeUnmount(() => window.removeEventListener('scroll', spyUpdate))
</script>

<style scoped>
.nav {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  max-width: 96vw;
}
.nav__pills {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  border-radius: 999px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
}
.nav__pills::-webkit-scrollbar { display: none; }

.pill {
  position: relative;
  flex: 0 0 auto;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.02em;
  color: var(--neutral-cream);
  background: rgba(14, 26, 20, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  padding: 14px 22px 16px;
  margin-left: -1px;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}
.pill:first-child { border-radius: 999px 0 0 999px; margin-left: 0; padding-left: 26px; }
.pill:last-child { border-radius: 0 999px 999px 0; padding-right: 26px; }
.pill:hover { background: var(--bg-surface-2); }

/* terracotta active dot */
.pill::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-left: -2.5px;
  background: var(--accent-warm);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.pill.is-active::after { opacity: 1; }

@media (max-width: 899px) {
  /* MOBILE FIX (v7.2): the pill bar overflows and scrolls, but nothing
     signaled that — items like "Ask Us"/"Journal" just cut off at the edge
     with no visual cue they were reachable by swipe. A right-edge fade hints
     there's more without needing a scroll listener. Desktop never overflows
     here in the first place, and this rule can't reach it (scoped ≥900px out). */
  .nav__pills {
    -webkit-mask-image: linear-gradient(to right, black calc(100% - 28px), transparent 100%);
    mask-image: linear-gradient(to right, black calc(100% - 28px), transparent 100%);
  }
}
@media (max-width: 520px) {
  .pill { padding: 12px 14px 14px; font-size: 12px; }
}
</style>
