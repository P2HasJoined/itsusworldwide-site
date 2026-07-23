<template>
  <div>
    <a class="skip-link" href="#main">Skip to content</a>

    <MagneticCursor />
    <CurtainTransition />
    <SiteNav />

    <!-- shared WebGL stage: fixed canvas the camera rig draws to (client only) -->
    <ClientOnly>
      <ThreeStage />
    </ClientOnly>
    <div class="stage-veil" aria-hidden="true"></div>

    <DayCycle />

    <main id="main">
      <HeroSection />
      <PhilosophyPinned />
      <MotionBreak />
      <NumberedGrid />
      <PillarsSticky />
      <HostSection />
      <EpisodeTimeline />
      <AskUs />
      <EpisodesAndReflections />
    </main>

    <FloatingAction />
    <FooterConcrete />
  </div>
</template>

<script setup>
/* Global scroll effects — children are mounted before the root's onMounted,
   so this sees the whole tree:
   [data-reveal]        fade/lift once on enter
   [data-reveal-group]  staggered children
   [data-split]         SplitText line reveal on every headline (Floema craft)
   [data-mask]          clip-path wipe instead of an opacity fade */
const engine = useScrollEngine()
onMounted(() => {
  if (!engine || engine.reduced) return
  const { gsap, SplitText } = engine

  nextTick(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 26,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      })
    })

    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
      if (!group.children.length) return
      gsap.from(group.children, {
        y: 30,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: group, start: 'top 84%', once: true },
      })
    })

    document.querySelectorAll('[data-split]').forEach((el) => {
      const split = new SplitText(el, { type: 'lines,chars', linesClass: 'line' })
      gsap.from(split.chars, {
        yPercent: 105,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.018,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
      split.lines.forEach((l) => (l.style.overflow = 'hidden'))
    })

    document.querySelectorAll('[data-mask]').forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(0 0 100% 0)' },
        {
          clipPath: 'inset(0 0 0% 0)',
          duration: 1.1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        }
      )
    })

    engine.ScrollTrigger.refresh()
  })

  /* Pins are created across several components, some in async onMounted hooks
     (MotionBreak awaits video probes) and some via matchMedia. Each adds a
     pin-spacer that shifts everything below it, so any trigger created before
     the last pin lands computes stale start/end. Fire a few refreshes after
     the DOM has surely settled so every scrubbed section (heart, words, day
     cycle handoff, pillars) recomputes against the final layout. */
  const refreshAll = () => engine.ScrollTrigger.refresh()
  window.addEventListener('load', refreshAll)
  ;[400, 1000, 2000].forEach((ms) => setTimeout(refreshAll, ms))
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'PodcastSeries',
        name: 'UsWorldWide',
        url: 'https://itsusworldwide.com/',
        description:
          'A personal-growth podcast about self-love and the love we give one another, hosted by Basie Comer. Part of the ItsUsWorldwide project.',
        genre: 'Health & Fitness',
        author: { '@type': 'Person', name: 'Basie Comer', alternateName: 'Base C.' },
      }),
    },
  ],
})
</script>
