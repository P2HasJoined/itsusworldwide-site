<template>
  <!-- 5.7 — the signature moment, part 1: an incoming message that types
       itself in on load, idles so it can actually be read, then breaks into
       words that fall out of frame as the user scrolls. Its debris reappears
       cast into the footer concrete (FooterConcrete.vue).
       Teleported to <body> and position:fixed so the falling words render in
       front of every layer (sections, canvas, videos) and exit past the
       bottom of the viewport. -->
  <Teleport v-if="mounted" to="body">
    <div ref="bubble" class="msg" role="status" aria-live="polite">
    <!-- retro OS window chrome -->
    <p class="msg__titlebar">
      <span class="msg__stripes" aria-hidden="true"></span>
      <span class="msg__title px">msg.exe</span>
      <span class="msg__winbtns" aria-hidden="true"><i></i><i></i><i></i></span>
    </p>
    <p class="msg__meta"><span class="msg__from">incoming transmission</span><span class="msg__time px">now</span></p>
    <p class="msg__text" :aria-label="HERO_MESSAGE">
      <span
        v-for="(word, wi) in words"
        :key="wi"
        class="msg__word"
        aria-hidden="true"
      ><span
          v-for="(ch, ci) in word.chars"
          :key="ci"
          class="msg__char"
        >{{ ch }}</span><span v-if="wi < words.length - 1" class="msg__space">&nbsp;</span></span>
      <span ref="caret" class="msg__caret" aria-hidden="true"></span>
    </p>
    </div>
  </Teleport>
</template>

<script setup>
import { HERO_MESSAGE } from '~/data/site'

const engine = useScrollEngine()
const bubble = ref(null)
const caret = ref(null)
const mounted = ref(false)

const words = HERO_MESSAGE.split(' ').map((w) => ({ chars: w.split('') }))

let ctx
onMounted(async () => {
  mounted.value = true
  await nextTick() /* Teleport target renders first */
  if (!engine || !bubble.value) return
  const gsap = engine.gsap

  ctx = gsap.context(() => {
    const wordEls = bubble.value.querySelectorAll('.msg__word')
    const charEls = bubble.value.querySelectorAll('.msg__char')
    const mobile = engine.isMobile()

    /* -------- reduced motion: show the full line, fade out on scroll ----- */
    if (engine.reduced) {
      caret.value.style.display = 'none'
      gsap.to(bubble.value, {
        autoAlpha: 0,
        scrollTrigger: { trigger: '#home', start: '15% top', end: '45% top', scrub: true },
      })
      return
    }

    /* -------- 1. the typewriter (40–60ms/char, calm not frantic) --------- */
    gsap.set(charEls, { autoAlpha: 0 })
    gsap.set(bubble.value, { autoAlpha: 0, y: 14 })

    const typing = gsap.timeline({ delay: 1.1 })
    typing
      .to(bubble.value, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' })
      .to(charEls, { autoAlpha: 1, duration: 0.01, stagger: 0.05 }, '+=0.35')
      .add(() => {
        caret.value.classList.add('is-done')
      })

    /* -------- 2. the fall — armed only after typing + a 2.5s beat -------- */
    const armFall = () => {
      /* deterministic per-word offsets: no physics engine, no randomness */
      const fall = gsap.timeline({
        scrollTrigger: {
          trigger: '#home',
          start: 'top top',
          end: 'bottom 25%',
          scrub: true,
        },
      })
      wordEls.forEach((el, i) => {
        const jitterX = mobile ? 0 : ((i * 53) % 90) - 45 /* -45..45px drift */
        const rot = mobile ? 0 : ((i * 37) % 15) - 7 /* -7..7deg */
        fall.to(
          el,
          {
            y: () => window.innerHeight * 1.25 + i * 30,
            x: jitterX,
            rotation: rot,
            ease: 'power2.in',
            duration: 1,
          },
          i * 0.09 /* first word to last, the sentence visibly comes apart */
        )
      })
      fall.to(bubble.value, { '--bubble-alpha': 0, duration: 0.4 }, 0.15)
      /* once every word is gone, hide the fixed shell entirely (scrubbing
         back up restores it, since it's part of the same scrubbed timeline) */
      fall.to(bubble.value, { autoAlpha: 0, duration: 0.1 }, 0.9)
      engine.ScrollTrigger.refresh()
    }

    typing.add(armFall, '+=2.5')
  })
})
onBeforeUnmount(() => ctx && ctx.revert())
</script>

<style scoped>
.msg {
  --bubble-alpha: 1;
  position: fixed; /* teleported to body: words fall in front of everything */
  z-index: 500;
  top: calc(var(--nav-h) + clamp(18px, 5vh, 60px));
  right: clamp(16px, 4vw, 56px);
  max-width: 310px;
  padding: 0 0 16px;
  border-radius: 4px;
  background: rgba(11, 36, 25, calc(0.95 * var(--bubble-alpha)));
  border: 2px solid rgba(196, 164, 132, calc(0.55 * var(--bubble-alpha)));
  box-shadow:
    5px 5px 0 rgba(0, 0, 0, calc(0.45 * var(--bubble-alpha))),
    inset 0 0 0 1px rgba(14, 26, 20, calc(0.9 * var(--bubble-alpha)));
  pointer-events: none;
  /* NO overflow:hidden here — the falling words must escape the window
     and travel down the whole viewport (clipping them was why the fall
     never seemed to happen) */
}
/* faint CRT scanlines over the window body */
.msg::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.16) 0 1px, transparent 1px 4px);
  opacity: calc(0.6 * var(--bubble-alpha));
}

/* retro title bar: pinstripes, tiny pixel title, square window buttons */
.msg__titlebar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: rgba(28, 58, 42, calc(0.9 * var(--bubble-alpha)));
  border-bottom: 2px solid rgba(196, 164, 132, calc(0.4 * var(--bubble-alpha)));
  opacity: var(--bubble-alpha);
}
.msg__stripes {
  flex: 1;
  height: 8px;
  background: repeating-linear-gradient(180deg, rgba(237, 232, 208, 0.35) 0 1px, transparent 1px 3px);
}
.msg__title { font-size: 7px; color: var(--neutral-cream); text-transform: lowercase; }
.msg__winbtns { display: flex; gap: 4px; }
.msg__winbtns i {
  width: 8px;
  height: 8px;
  display: block;
  border: 1px solid rgba(14, 26, 20, 0.6);
}
.msg__winbtns i:nth-child(1) { background: var(--neutral-clay); }
.msg__winbtns i:nth-child(2) { background: var(--accent-amber); }
.msg__winbtns i:nth-child(3) { background: var(--accent-warm-2); }

.msg__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 18px 6px;
  opacity: calc(var(--bubble-alpha));
}
.msg__from {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--neutral-clay);
}
.msg__time { font-size: 7px; color: var(--text-dim); }

.msg__text {
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--neutral-cream);
  font-weight: 600;
  margin: 0 18px;
}
.msg__word { display: inline-block; white-space: nowrap; will-change: transform; }
.msg__space { display: inline; }
.msg__char { display: inline; }

.msg__caret {
  display: inline-block;
  width: 8px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--accent-warm-2);
  animation: caret-blink 0.9s steps(1) infinite;
}
.msg__caret.is-done { animation: caret-fade 1.2s ease forwards; }
@keyframes caret-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes caret-fade {
  to { opacity: 0; }
}

@media (max-width: 899px) {
  .msg { max-width: 240px; right: 14px; }
  .msg__text { font-size: 14px; }
}
</style>
