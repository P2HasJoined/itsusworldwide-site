<template>
  <div ref="curtain" class="curtain" aria-hidden="true"></div>
</template>

<script setup>
/* Floema-style curtain wipe on internal nav clicks: sweep up over the screen,
   jump to the target instantly behind it, sweep away. Skipped under reduced
   motion (plain smooth scroll instead). */
const curtain = ref(null)
const engine = useScrollEngine()
let busy = false

onMounted(() => {
  if (!engine) return
  watch(engine.curtainTarget, (hash) => {
    if (!hash) return
    engine.curtainTarget.value = null

    if (engine.reduced || busy) {
      engine.scrollTo(hash)
      return
    }
    busy = true
    const el = curtain.value
    const tl = engine.gsap.timeline({
      onComplete: () => {
        busy = false
      },
    })
    tl.set(el, { transformOrigin: '50% 100%', scaleY: 0, visibility: 'visible' })
      .to(el, { scaleY: 1, duration: 0.45, ease: 'power3.inOut' })
      .add(() => {
        /* jump behind the curtain */
        if (engine.lenis) engine.lenis.scrollTo(hash, { immediate: true, force: true })
        else document.querySelector(hash)?.scrollIntoView()
        engine.ScrollTrigger.refresh()
      })
      .set(el, { transformOrigin: '50% 0%' }, '+=0.08')
      .to(el, { scaleY: 0, duration: 0.5, ease: 'power3.inOut' })
      .set(el, { visibility: 'hidden' })
  })
})
</script>

<style scoped>
.curtain {
  position: fixed;
  inset: 0;
  z-index: 400;
  background: var(--bg-surface-1);
  border-bottom: 2px solid var(--border);
  transform: scaleY(0);
  visibility: hidden;
  pointer-events: none;
}
</style>
