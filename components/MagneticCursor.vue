<template>
  <div v-if="enabled" class="cursor" aria-hidden="true">
    <!-- sun mode carries a soft light that brightens whatever it passes over -->
    <div ref="glow" class="cursor__glow" :class="{ 'is-on': sunMode }"></div>

    <div ref="ring" class="cursor__ring" :class="{ 'is-sun': sunMode }">
      <!-- pixel moon (night) -->
      <svg v-if="!sunMode" viewBox="0 0 16 16" shape-rendering="crispEdges" class="cursor__icon">
        <rect x="5" y="2" width="6" height="1" fill="#EDE8D0" />
        <rect x="3" y="3" width="4" height="1" fill="#EDE8D0" />
        <rect x="2" y="4" width="3" height="2" fill="#EDE8D0" />
        <rect x="2" y="6" width="2" height="4" fill="#EDE8D0" />
        <rect x="2" y="10" width="3" height="2" fill="#EDE8D0" />
        <rect x="3" y="12" width="4" height="1" fill="#EDE8D0" />
        <rect x="5" y="13" width="6" height="1" fill="#EDE8D0" />
        <rect x="11" y="12" width="2" height="1" fill="#C4A484" />
        <rect x="12" y="10" width="2" height="2" fill="#C4A484" />
        <rect x="13" y="6" width="1" height="4" fill="#C4A484" />
      </svg>
      <!-- pixel sun (day) -->
      <svg v-else viewBox="0 0 16 16" shape-rendering="crispEdges" class="cursor__icon">
        <rect x="6" y="6" width="4" height="4" fill="#F59E0B" />
        <rect x="6" y="5" width="4" height="1" fill="#F59E0B" />
        <rect x="6" y="10" width="4" height="1" fill="#F59E0B" />
        <rect x="5" y="6" width="1" height="4" fill="#F59E0B" />
        <rect x="10" y="6" width="1" height="4" fill="#F59E0B" />
        <rect x="7" y="1" width="2" height="2" fill="#E2725B" />
        <rect x="7" y="13" width="2" height="2" fill="#E2725B" />
        <rect x="1" y="7" width="2" height="2" fill="#E2725B" />
        <rect x="13" y="7" width="2" height="2" fill="#E2725B" />
        <rect x="3" y="3" width="1" height="1" fill="#E2725B" />
        <rect x="12" y="3" width="1" height="1" fill="#E2725B" />
        <rect x="3" y="12" width="1" height="1" fill="#E2725B" />
        <rect x="12" y="12" width="1" height="1" fill="#E2725B" />
      </svg>
    </div>
    <div ref="dot" class="cursor__dot"></div>
  </div>
</template>

<script setup>
/* Magnetic cursor with a story: it is the MOON while the site is in its
   night half, and becomes the SUN once the reader scrolls past
   "What does this reveal about us?" — from then on it carries a soft glow
   that slightly brightens the page under it. Fine pointers only. */
const engine = useScrollEngine()
const enabled = ref(false)
const sunMode = ref(false)
const ring = ref(null)
const dot = ref(null)
const glow = ref(null)

let raf, onMove, onOver, onOut

onMounted(() => {
  if (!engine || engine.reduced || !engine.finePointer) return
  enabled.value = true
  document.documentElement.classList.add('has-custom-cursor')

  nextTick(() => {
    const gsap = engine.gsap
    let mx = innerWidth / 2, my = innerHeight / 2
    let rx = mx, ry = my
    let target = null

    /* moon → sun handover at the philosophy question */
    engine.ScrollTrigger.create({
      trigger: '.philosophy__after',
      start: 'center 60%',
      onEnter: () => (sunMode.value = true),
      onLeaveBack: () => (sunMode.value = false),
    })
    /* …and back to the moon once the sunset past Ask Us completes */
    engine.ScrollTrigger.create({
      trigger: '#journal',
      start: 'top 45%',
      onEnter: () => (sunMode.value = false),
      onLeaveBack: () => (sunMode.value = true),
    })

    onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      gsap.set(dot.value, { x: mx, y: my })
      if (target) {
        const r = target.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        gsap.to(target, {
          x: (mx - cx) * 0.18,
          y: (my - cy) * 0.18,
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }

    const tick = () => {
      rx += (mx - rx) * 0.16
      ry += (my - ry) * 0.16
      gsap.set(ring.value, { x: rx, y: ry })
      if (glow.value) gsap.set(glow.value, { x: rx, y: ry })
      raf = requestAnimationFrame(tick)
    }

    onOver = (e) => {
      const el = e.target.closest('[data-magnetic], a, button')
      if (!el) return
      target = el.hasAttribute('data-magnetic') ? el : null
      ring.value && ring.value.classList.add('is-hover')
    }
    onOut = (e) => {
      const el = e.target.closest('[data-magnetic], a, button')
      if (!el) return
      if (target === el || (target && !el.contains(target))) {
        engine.gsap.to(target, { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
        target = null
      }
      ring.value && ring.value.classList.remove('is-hover')
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseout', onOut, { passive: true })
    tick()
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseover', onOver)
  document.removeEventListener('mouseout', onOut)
  document.documentElement.classList.remove('has-custom-cursor')
})
</script>

<style>
html.has-custom-cursor,
html.has-custom-cursor a,
html.has-custom-cursor button,
html.has-custom-cursor [data-magnetic] {
  cursor: none;
}
</style>

<style scoped>
.cursor { position: fixed; inset: 0; z-index: 600; pointer-events: none; }

.cursor__dot {
  position: absolute;
  top: -2px; left: -2px;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--neutral-cream);
}

.cursor__ring {
  position: absolute;
  top: -14px; left: -14px;
  width: 28px; height: 28px;
  transition: transform 0.25s ease;
}
.cursor__ring.is-hover { transform: scale(1.5); }
.cursor__icon { width: 100%; height: 100%; }
.cursor__ring:not(.is-sun) .cursor__icon { filter: drop-shadow(0 0 6px rgba(237, 232, 208, 0.4)); }
.cursor__ring.is-sun .cursor__icon { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.65)); }

/* the sun's travelling light: brightens the page it scrolls over */
.cursor__glow {
  position: absolute;
  top: -140px; left: -140px;
  width: 280px; height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.06) 45%, transparent 68%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.cursor__glow.is-on { opacity: 1; }
</style>
