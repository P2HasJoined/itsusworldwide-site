<template>
  <!-- The night to day cycle. As the reader scrolls past "What does this
       reveal about us?" (where the 3D sun rises in the WebGL stage), the
       whole theme animates from the dark night greens to lighter daylight
       greens, and a pixel valley-and-fields vista fades in as a textured
       wallpaper behind everything after. Scrubbing back re-darkens it.
       All values keep WCAG AA pairs intact. -->
  <div aria-hidden="true">
    <div ref="wallpaper" class="day__wallpaper"></div>
    <div ref="veil" class="day__veil"></div>
  </div>
</template>

<script setup>
const wallpaper = ref(null)
const veil = ref(null)
const engine = useScrollEngine()

/* daylight palette: same family, one stop lighter — contrast-checked
   (cream 10.8:1, muted 6.5:1 on --bg-base day value) */
const DAY = {
  '--bg-base': '#1B3325',
  '--bg-surface-1': '#17402C',
  '--bg-surface-2': '#20392B',
  '--border': '#2E5540',
  '--text-dim': '#8FA291',
}
/* the original night tokens, restored after the sunset past Ask Us */
const NIGHT = {
  '--bg-base': '#0E1A14',
  '--bg-surface-1': '#0B2419',
  '--bg-surface-2': '#12211A',
  '--border': '#1C3A2A',
  '--text-dim': '#7E8F80',
}

const VARS = Object.keys(DAY)

let onScroll, raf
onMounted(() => {
  if (!engine || engine.reduced) return /* static night theme, no cycle */
  const gsap = engine.gsap
  const lerp = gsap.utils.interpolate
  const root = document.documentElement
  const clamp01 = (v) => Math.min(1, Math.max(0, v))
  const smooth = (p) => p * p * (3 - 2 * p)

  /* Drive the background off the SAME measured positions and formulas the 3D
     sun/moon use in ThreeStage — so the valley theme is locked to the moon by
     construction and can never drift when pins change the page height:
       riseE  — the sunrise (matches the sun) at the philosophy question
       setE   — the sunset window at #ask
       moonIn — the moon's return (second half of setE)
     dayFactor = riseE * (1 - moonIn): fades IN as the sun rises, HOLDS full
     through the day and the sun's exit, and only fades OUT as the moon comes
     back into place. Re-measures each frame, so it's immune to layout shifts. */
  const apply = () => {
    raf = 0
    const after = document.querySelector('.philosophy__after')
    const ask = document.querySelector('#ask')
    if (!after || !ask) return
    const vh = window.innerHeight
    const y = window.scrollY
    const afterCenter = after.getBoundingClientRect().top + y + after.offsetHeight / 2 - vh / 2
    const askCenter = ask.getBoundingClientRect().top + y + ask.offsetHeight / 2 - vh / 2

    const riseE = smooth(clamp01((y - (afterCenter - vh * 0.55)) / (vh * 1.4)))
    const setE = smooth(clamp01((y - (askCenter - vh * 0.2)) / (vh * 1.3)))
    const moonIn = smooth(clamp01((setE - 0.5) / 0.5))
    const f = riseE * (1 - moonIn)

    for (const key of VARS) root.style.setProperty(key, lerp(NIGHT[key], DAY[key], f))
    gsap.set(wallpaper.value, { autoAlpha: f, scale: 1.06 - 0.06 * f })
    gsap.set(veil.value, { autoAlpha: f })
  }

  onScroll = () => {
    if (!raf) raf = requestAnimationFrame(apply)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  engine.ScrollTrigger.addEventListener('refresh', onScroll)
  apply()
})
onBeforeUnmount(() => {
  if (onScroll) {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    engine && engine.ScrollTrigger.removeEventListener('refresh', onScroll)
  }
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
/* the valley: fixed pixel vista under everything (content z3, canvas z2,
   hero wordmark z1 all render above it) with a built-in dark wash so text
   contrast holds wherever sections are transparent */
.day__wallpaper {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(27, 51, 37, 0.74), rgba(27, 51, 37, 0.6) 45%, rgba(27, 51, 37, 0.76)),
    url('/media/ref/valley-day.png') center / cover no-repeat;
  image-rendering: pixelated;
}

/* soft daylight over everything, capped low for AA */
.day__veil {
  position: fixed;
  inset: 0;
  z-index: 250;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 72% 0%, rgba(245, 158, 11, 0.12), transparent 55%),
    linear-gradient(180deg, rgba(237, 232, 208, 0.05), rgba(245, 158, 11, 0.04));
  mix-blend-mode: soft-light;
}
</style>
