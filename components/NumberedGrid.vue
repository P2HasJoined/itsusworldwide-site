<template>
  <section id="different" ref="root" class="different above-canvas">
    <div class="container">
      <p class="eyebrow" data-reveal>What makes this different</p>
      <h2 class="section-title" data-split>Four assumptions, reframed.</h2>

      <ol class="numgrid">
        <li v-for="(item, i) in items" :key="i" class="numgrid__item">
          <span class="numgrid__num px" aria-hidden="true">{{ pad(i + 1) }}</span>
          <h3 class="numgrid__title">{{ item.title }}</h3>
          <p class="numgrid__sub">{{ item.copy }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
/* Desktop: the section PINS and each assumption loads in order as the reader
   scrolls down — number + title slide in, then the subtext types itself. The
   pin means you cannot scroll past until all four are revealed. Scrolling back
   up un-reveals them. Mobile / reduced motion falls back to a plain per-item
   reveal on enter (no pin). */
const pad = (n) => String(n).padStart(2, '0')
const items = [
  { title: 'You want confidence', copy: '…but why must you become confident before you permit yourself to live?' },
  { title: 'You want success', copy: '…but what if success never finally proves you’re enough?' },
  { title: 'You want independence', copy: '…but are you independent, or afraid of needing anyone?' },
  { title: 'You want self improvement', copy: '…but when does it become a permanent argument that the current you is unacceptable?' },
]

const root = ref(null)
const engine = useScrollEngine()

let mm
onMounted(() => {
  if (!engine || engine.reduced) return
  const gsap = engine.gsap
  mm = gsap.matchMedia()

  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const itemEls = Array.from(root.value.querySelectorAll('.numgrid__item'))
    const splits = []

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        /* ~0.9 viewport of scroll per assumption — deliberate, unskippable */
        end: () => '+=' + Math.round(itemEls.length * 0.9 * window.innerHeight),
        pin: true,
        anticipatePin: 1,
        scrub: true,
      },
    })

    /* Strictly sequential: each assumption fully reveals (number, title, then
       the whole subtext types out) and HOLDS before the next one begins. Built
       by appending to the timeline — no absolute positions — so item i+1 can
       never start until item i has completed. */
    itemEls.forEach((item) => {
      const num = item.querySelector('.numgrid__num')
      const title = item.querySelector('.numgrid__title')
      const sub = item.querySelector('.numgrid__sub')
      const split = new engine.SplitText(sub, { type: 'words,chars' })
      splits.push(split)

      gsap.set([num, title], { autoAlpha: 0, y: 24 })
      gsap.set(split.chars, { autoAlpha: 0 })

      tl.to(num, { autoAlpha: 1, y: 0, duration: 0.35 })
        .to(title, { autoAlpha: 1, y: 0, duration: 0.35 }, '<0.12')
        .to(split.chars, { autoAlpha: 1, duration: 0.01, stagger: { each: 0.018 } }, '>0.05')
        .to({}, { duration: 0.5 }) /* hold so it reads as done before the next */
    })

    /* new pin-spacer shifts everything below — recompute downstream triggers */
    const refresh = () => engine.ScrollTrigger.refresh()
    requestAnimationFrame(() => requestAnimationFrame(refresh))
    setTimeout(refresh, 500)

    return () => splits.forEach((s) => s.revert())
  })

  mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
    const itemEls = Array.from(root.value.querySelectorAll('.numgrid__item'))
    const splits = []
    itemEls.forEach((item) => {
      const num = item.querySelector('.numgrid__num')
      const title = item.querySelector('.numgrid__title')
      const sub = item.querySelector('.numgrid__sub')
      const split = new engine.SplitText(sub, { type: 'words,chars' })
      splits.push(split)
      const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 85%', once: true } })
      tl.from(num, { autoAlpha: 0, y: 16, duration: 0.4 })
        .from(title, { autoAlpha: 0, y: 22, duration: 0.5 }, '-=0.15')
        .set(split.chars, { autoAlpha: 0 })
        .to(split.chars, { autoAlpha: 1, duration: 0.01, stagger: 0.014 }, '+=0.15')
    })
    return () => splits.forEach((s) => s.revert())
  })
})
onBeforeUnmount(() => mm && mm.revert())
</script>

<style scoped>
.different {
  padding: clamp(100px, 14vh, 170px) 0;
  /* color-mix keeps this reacting to the day/night tween on --bg-surface-2
     while letting a bit of the scene behind it show through */
  background: color-mix(in srgb, var(--bg-surface-2) 78%, transparent);
}
/* when pinned, keep the whole block comfortably within one viewport */
.different .container { min-height: 0; }

.numgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(34px, 5vw, 70px) clamp(40px, 6vw, 90px);
}
/* numerals: exactly the kind of small stamped detail the pixel font is for */
.numgrid__num {
  display: block;
  font-size: clamp(22px, 2.6vw, 34px);
  line-height: 1;
  color: var(--neutral-clay);
  opacity: 0.5;
  margin-bottom: 18px;
}
.numgrid__title {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 23px;
  margin-bottom: 8px;
}
.numgrid__sub { color: var(--text-muted); max-width: 44ch; }

@media (max-width: 899px) {
  .numgrid { grid-template-columns: 1fr; }
}
</style>
