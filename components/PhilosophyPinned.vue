<template>
  <section id="philosophy" class="philosophy" ref="section">
    <div class="philosophy__sticky" ref="sticky">
      <div class="philosophy__stage above-canvas">
        <div class="philosophy__lead">
          <p class="eyebrow">The name&rsquo;s philosophy</p>
          <h2 class="philosophy__title display" data-split>Welcome<br />to&nbsp;Us.</h2>
          <p class="philosophy__copy">
            &ldquo;Us&rdquo; is four things at once: you, the people around you, your community,
            and society. Every episode lives in the tension between them.
          </p>
        </div>

        <!-- the five tensions ride pixel clouds that drift in from the right and
             pile up, until the whole sky is full of them -->
        <div class="philosophy__sky" ref="sky">
          <figure
            v-for="(t, i) in tensions"
            :key="i"
            class="cloud"
            :class="`cloud--${i + 1}`"
            ref="clouds"
          >
            <img class="cloud__img" :src="t.img" alt="" aria-hidden="true" />
            <figcaption class="cloud__text">
              <span class="cloud__a">{{ t.pair[0] }}</span>
              <span class="cloud__amp" aria-hidden="true">&amp;</span>
              <span class="cloud__b">{{ t.pair[1] }}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>

    <div class="philosophy__after above-canvas">
      <p class="philosophy__question" data-reveal>What does this reveal about us?</p>
    </div>
  </section>
</template>

<script setup>
/* Each tension pairing rides a pixel cloud. On desktop the section pins and,
   as the reader scrolls, the clouds float in one by one from the right, drift
   left to their resting spot, and STAY — so the sky slowly fills with all five.
   Scrolling back sends them out again. Mobile / reduced motion just shows the
   clouds settled in a stack. */
const CLOUD_A = '/media/cloud-a.png'
const CLOUD_B = '/media/cloud-b.png'
/* manual line breaks (\n) on the longer pairs — chosen so each label lands as
   two short, centered lines that sit inside the cloud's solid middle, rather
   than trusting auto-wrap to find a break that happens to fit */
const tensions = [
  { pair: ['Me', 'Us'], img: CLOUD_A },
  { pair: ['Self\nacceptance', 'Self\nimprovement'], img: CLOUD_B },
  { pair: ['Individual\nresponsibility', 'Social\ninfluence'], img: CLOUD_A },
  { pair: ['The love we\ngive ourselves', 'The love we\ngive one another'], img: CLOUD_B },
  { pair: ['Understanding\nourselves', 'Understanding\nthe world'], img: CLOUD_A },
]

const section = ref(null)
const sticky = ref(null)
const sky = ref(null)
const clouds = ref([])
const engine = useScrollEngine()

let mm
onMounted(() => {
  if (!engine) return
  const gsap = engine.gsap
  mm = gsap.matchMedia()

  /* desktop: pin, then float the clouds in on scroll and let them accumulate */
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    section.value.classList.add('philosophy--pinned')
    const els = clouds.value

    /* gentle, endless bob so the settled clouds keep breathing (independent of
       scroll; runs on the inner image so it never fights the entrance x) */
    els.forEach((el, i) => {
      const img = el.querySelector('.cloud__img')
      gsap.to(img, {
        y: 8 + (i % 2) * 6,
        duration: 3.4 + i * 0.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section.value,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 0.62 * tensions.length),
        pin: sticky.value,
        anticipatePin: 1,
        scrub: true,
      },
    })

    /* each cloud starts off to the right and invisible, then floats left into
       place over its slot of the timeline — strictly one after another */
    els.forEach((el, i) => {
      gsap.set(el, { xPercent: 140, autoAlpha: 0 })
      tl.to(el, { xPercent: 0, autoAlpha: 1, ease: 'power1.out', duration: 0.85 }, i * 0.85)
    })
    /* hold: once all five have gathered, they linger centered in the sky for
       the last stretch of the pin before the section scrolls away */
    tl.to({}, { duration: 1.8 })

    return () => {
      section.value.classList.remove('philosophy--pinned')
      gsap.set(els, { clearProps: 'all' })
    }
  })

  /* mobile / reduced motion: clouds simply settled, no pin, no float-in */
  mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
    gsap.set(clouds.value, { clearProps: 'all', autoAlpha: 1, x: 0 })
  })
})
onBeforeUnmount(() => mm && mm.revert())
</script>

<style scoped>
.philosophy__sticky {
  padding: clamp(90px, 12vh, 150px) clamp(20px, 4vw, 48px);
  position: relative;
  z-index: 3;
}

.philosophy__stage {
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  gap: clamp(40px, 6vw, 90px);
  align-items: center;
}

.philosophy__title {
  font-size: clamp(44px, 6.5vw, 96px);
  margin-bottom: 26px;
}
/* the thesis line: bigger than body copy, with a slow breathing cream glow
   (and a gentle swell) so the eye lands on it while the clouds gather */
.philosophy__copy {
  color: var(--neutral-cream);
  max-width: 42ch;
  font-size: clamp(19px, 1.8vw, 24px);
  line-height: 1.55;
  font-weight: 600;
  transform-origin: left center;
  animation: copy-breathe 3.6s ease-in-out infinite alternate;
}
@keyframes copy-breathe {
  from {
    text-shadow: 0 0 0 rgba(237, 232, 208, 0);
    transform: scale(1);
  }
  to {
    text-shadow: 0 0 14px rgba(237, 232, 208, 0.45), 0 0 34px rgba(237, 232, 208, 0.18);
    transform: scale(1.025);
  }
}
@media (prefers-reduced-motion: reduce) {
  .philosophy__copy { animation: none; text-shadow: 0 0 14px rgba(237, 232, 208, 0.3); }
}

/* ---- the cloud sky ---- */
.philosophy__sky { display: grid; gap: 22px; }

.cloud { position: relative; width: min(420px, 78vw); }
.cloud__img {
  display: block;
  width: 100%;
  /* the PNG is 1376×768; rendering it ~12% taller stretches the puffs
     vertically (invisible on an organic cloud) and buys the text a deeper
     solid-white band to sit on */
  aspect-ratio: 1376 / 860;
  image-rendering: pixelated;
  filter: drop-shadow(6px 10px 0 rgba(0, 0, 0, 0.22));
}
.cloud__text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* anchor from the top (not centered) — with 2-line labels the block is
     tall enough that centering pushed the first line up into the cloud's
     thin, wispy top edge instead of its solid puffy middle. NOTE: CSS
     resolves top/bottom padding percentages against the box's WIDTH, not
     its height — on this ~500×279 (16:9-ish) box, 14% padding-top actually
     lands ~25% down the (shorter) height, which is where the solid puff
     starts; a naive "25%" here would have overshot to ~45% and pushed the
     five-line worst-case label off the bottom. */
  justify-content: flex-start;
  text-align: center;
  /* 21% width-relative padding-top ≈ 34% down the (1.6:1) box height: the
     first line lands on the cloud's WIDE solid band, not the narrow top
     knob where long lines poke out onto sky on both sides */
  padding: 21% 25% 4%;
  gap: 2px;
}
/* the self pole is structured and grounded; the other pole warm and relational */
.cloud__a,
.cloud__b {
  /* stretch to the padded width; pre-line honors the manual \n breaks in the
     label text so each line is short and centered inside the solid cloud,
     with wrap as a safety net if a line still runs long */
  align-self: stretch;
  width: 100%;
  white-space: pre-line;
  overflow-wrap: break-word;
  line-height: 1.14;
}
.cloud__a {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.01em;
  font-size: clamp(16px, 1.7vw, 23px);
  color: var(--ink);
  text-transform: uppercase;
}
.cloud__b {
  font-family: var(--font-body);
  font-style: italic;
  font-weight: 800; /* bolder for readability on the puff */
  font-size: clamp(16px, 1.7vw, 23px);
  color: #35689e; /* pastel blue, a step deeper for contrast */
  /* permanent soft blue halo — steady glow, no animation */
  text-shadow:
    0 0 6px rgba(120, 170, 220, 0.6),
    0 0 16px rgba(120, 170, 220, 0.35);
}
.cloud__amp {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14px;
  color: var(--green-forest);
  margin: 3px 0;
}

/* pinned (desktop): the sky becomes a fixed-height canvas the clouds fill */
.philosophy--pinned .philosophy__sticky {
  height: 100vh;
  display: flex;
  align-items: stretch; /* the stage fills the viewport so the sky can too */
  padding-top: 0;
  padding-bottom: 0;
}
.philosophy--pinned .philosophy__stage { align-items: center; }
/* pinned: the sky is the WHOLE stage, not a right-hand column — five clouds
   this large cannot stack in one column without burying each other's words,
   so they scatter across the full width instead. The lead copy keeps its
   top-left pocket; every resting spot below was placed so that no cloud's
   solid white ever covers another cloud's text zone (texts may drift over a
   neighbour's transparent mist, which stays readable). */
.philosophy--pinned .philosophy__stage {
  grid-template-columns: minmax(280px, 360px) 1fr;
  width: 100%;
  height: 100%;
  position: relative;
}
.philosophy--pinned .philosophy__lead { position: relative; z-index: 6; }
.philosophy--pinned .philosophy__sky {
  position: absolute;
  inset: 0;
  height: auto;
  display: block;
}
.philosophy--pinned .cloud { position: absolute; width: min(560px, 52vw); will-change: transform; }
.philosophy--pinned .cloud--1 { top: 0%;   left: 29%; z-index: 5; }
.philosophy--pinned .cloud--2 { top: 23%;  left: 47%; z-index: 4; }
.philosophy--pinned .cloud--3 { top: 45%;  left: 27%; z-index: 3; }
/* bottom row lifted so the labels (which sit low on the puff) never run off
   the bottom of the pinned viewport; x positions unchanged. Descending
   z-index means an upper cloud's text can drift over a lower cloud's puff
   (text on white, readable) but a puff can never bury text. Cloud 4 is
   rendered BIGGER than the rest: its label is the longest pair, and the
   extra size gives the whole thing room on the solid white. */
.philosophy--pinned .cloud--4 { top: 59%;  left: 0%;  z-index: 2; width: min(660px, 60vw); }
/* cloud 5 enlarged like cloud 4; left nudged so the bigger cloud keeps its
   right edge in place instead of running off screen */
.philosophy--pinned .cloud--5 { top: 62%;  left: 45%; z-index: 1; width: min(660px, 60vw); }
/* clouds 4 and 5: their labels sat a touch high on the puff — start the text
   lower on these two (cloud positions themselves stay put) */
.cloud--5 .cloud__text { padding-top: 24%; }
/* cloud 4 is larger, so a lighter padding centers its label on the bigger
   white band (24% of the wider box ≈ 38% down its height — clear of cloud 3's
   lower edge above it, fully on the solid puff) */
.cloud--4 .cloud__text { padding-top: 24%; }

.philosophy__after { padding: clamp(110px, 16vh, 200px) 20px; text-align: center; }
.philosophy__question {
  font-family: var(--font-display);
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.02em;
  font-size: clamp(28px, 4.6vw, 58px);
  line-height: 1.3;
  max-width: 22ch;
  margin: 0 auto;
  text-shadow: 0 2px 18px rgba(14, 26, 20, 0.75), 0 1px 4px rgba(14, 26, 20, 0.6);
}

@media (max-width: 899px) {
  .philosophy__stage { grid-template-columns: 1fr; }
  .philosophy__sky { justify-items: center; }
  .cloud { width: min(360px, 82vw); }
  /* MOBILE FIX (v7.2): the shared .cloud__text rules above were tuned for
     desktop's pinned clouds (560–660px wide). Below 900px the clouds shrink
     to ~260–360px, but .cloud__a/.cloud__b's font-size clamp floors at a
     fixed 16px (1.7vw doesn't reach 16px until ~941px viewport width) — so
     the text stayed desktop-sized while its cloud kept shrinking around it,
     pushing 2-line labels off the bottom of the puff onto the dark sky.
     Scoped entirely inside this @media block: cannot affect desktop, which
     only ever renders the .philosophy--pinned rules (≥900px via JS matchMedia). */
  .cloud__text { padding: 15% 25% 4%; }
  .cloud__a,
  .cloud__b { font-size: clamp(11px, 3.6vw, 15px); }
  .cloud__amp { font-size: 11px; margin: 2px 0; }
  /* these two carry the longest labels (5 lines) — a touch less padding
     than the rest so their extra line clears the puff too */
  .cloud--4 .cloud__text,
  .cloud--5 .cloud__text { padding-top: 13%; }
}
</style>
