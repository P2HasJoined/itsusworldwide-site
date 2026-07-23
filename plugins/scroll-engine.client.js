/* ============================================================================
   Scroll engine — the shared setup the whole site reads from.
   Registers GSAP plugins once, wires Lenis into GSAP's ticker, and exposes:
     gsap / ScrollTrigger / Draggable / SplitText
     lenis          smooth-scroll instance (null when reduced motion)
     progress       ref(0..1) — normalized page scroll, feeds the Three.js rig
     reduced        prefers-reduced-motion at load
     isMobile()     live viewport check (<= 899px)
     use3D          ref — whether the WebGL layer should run
     motionPaused   ref — user toggle that pauses every video/loop on the page
     scrollTo(t)    Lenis-aware anchor scrolling
   Client-only plugin: none of this exists during SSR.
   ========================================================================= */

import { ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Draggable } from 'gsap/Draggable'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

export default defineNuxtPlugin((nuxtApp) => {
  gsap.registerPlugin(ScrollTrigger, Draggable, SplitText)

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = () => window.matchMedia('(max-width: 899px)').matches
  const finePointer = window.matchMedia('(pointer: fine)').matches

  let webgl = false
  try {
    const c = document.createElement('canvas')
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch (e) {
    webgl = false
  }

  const use3D = ref(webgl && !reduced && !isMobile())
  const motionPaused = ref(reduced)

  /* keep use3D honest: tabs can open at a transient small size before
     settling at desktop dimensions, sometimes without firing resize */
  const evalUse3D = () => {
    use3D.value = webgl && !reduced && !isMobile()
  }
  window.addEventListener('resize', evalUse3D, { passive: true })
  setTimeout(evalUse3D, 350)
  setTimeout(evalUse3D, 1200)

  let lenis = null
  if (!reduced) {
    lenis = new Lenis({ duration: 1.15 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  /* Normalized scroll progress — single source of truth for the camera rig.
     Plain scroll listener: fires for Lenis (which drives native scroll),
     keyboard, and programmatic scrolling alike. */
  const progress = ref(0)
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  }
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress, { passive: true })
  updateProgress()

  const scrollTo = (target, opts = {}) => {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.1, ...opts })
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
      else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' })
    }
  }

  /* Curtain page-transition state: SiteNav writes a hash here, the
     CurtainTransition component watches it, sweeps, jumps, sweeps out. */
  const curtainTarget = ref(null)

  window.__lenis = lenis /* debugging */
  window.__ST = ScrollTrigger /* debugging */

  nuxtApp.provide('scroll', {
    gsap,
    ScrollTrigger,
    Draggable,
    SplitText,
    lenis,
    progress,
    reduced,
    isMobile,
    finePointer,
    use3D,
    motionPaused,
    scrollTo,
    curtainTarget,
  })
})
