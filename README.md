# ItsUsWorldwide (v3) — itsusworldwide.com

Floema-driven, 3D scroll cinematic site for the ItsUsWorldwide brand and the
UsWorldWide podcast (hosted by Basie Comer). Nuxt 3 + GSAP/ScrollTrigger +
Lenis + Three.js, with every motion asset generated from one locked pixel-art
reference world (Nano Banana stills → Seedance 2.0 clips via Higgsfield).

## The night to day arc (v3)

The site opens at night and turns to day as you read:

- Hero: wordmark fully readable at load; the rotating close-orbit planet
  climbs and crosses behind it on scroll (ThreeStage, `pf > 1`).
- The cursor is a pixel MOON for the night half.
- At "What does this reveal about us?" a textured 3D sun (sphere + additive
  glow sprites) rises behind the text and parks in the sky.
- From that point the theme animates from night greens to daylight greens
  (GSAP tweens the CSS variables on `html`), the pixel valley-and-fields
  vista fades in as a fixed wallpaper (DayCycle.vue), and the cursor becomes
  a SUN carrying a soft light that brightens whatever it passes over.
- Scrolling back up reverses the whole cycle.

Other v3 touches: retro msg.exe window for the hero notification, typed-in
subtext on the numbered grid, the rising "Love isn't a one time thing, it's a
daily habit" line over the motion break, a periodic hop on the Earth FAB, and
real Spotify/Apple links.

## v4

- Hero loop is mathematically seamless: last 3s of the globe clip, slowed 2x,
  crossfade-spliced (first/last frames verified identical). The falling
  message words are teleported to body (fixed, z500) so they fall in front of
  every layer and exit past the viewport bottom.
- The motion break is now the HEART CHECKLIST: the heart itself carries four
  tone-on-tone items, and the video (all-intra encoded) is SCRUBBED by scroll
  so checkmarks draw as you read. Poster fallback for reduced motion.
- Seasons dropdown v2: a generated pixel waterfall (seamless vertical loop)
  pours open, four true-circle water bubbles bounce out of it, and picking
  one POPS it (droplet burst) before switching the season.
- Denser, brighter starfield across the top of the page.

**Host photo:** drop the founder portrait at `public/media/host.jpg` and the
About section picks it up automatically (until then it shows the BC frame).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (SSR)
npm run generate   # static generation, deployable anywhere
```

Node 18+ (built on Node 24 LTS).

## Structure

```
app.vue                        section assembly + global reveal/split/mask effects
nuxt.config.ts                 fonts (Inter Tight / Nunito / Press Start 2P), meta
data/site.js                   ← the "CMS": episodes, reflections, answered questions, config
plugins/scroll-engine.client.js  Lenis↔GSAP ticker, scroll progress, reduced-motion flags
composables/useScrollEngine.js   accessor for the engine
components/
  SiteNav.vue                  connected pills, terracotta dot, deterministic scrollspy
  CurtainTransition.vue        Floema-style wipe on nav clicks
  MagneticCursor.vue           lerped ring + dot, [data-magnetic] pull (fine pointers only)
  ThreeStage.vue               the 3D rig: planet video plane, forest layer, star parallax
  HeroSection.vue              left-aligned wordmark; planet breaks out of "Worldwide"
  HeroMessage.vue              5.7: typed notification → scroll word-fall
  PhilosophyPinned.vue         pinned "Welcome to Us." + hard-swap tension polaroids
  MotionBreak.vue              full-bleed Seedance loop, CSS slow-zoom on top
  PillarsSticky.vue            sticky list + depth-shifted panels
  NumberedGrid.vue             four reframed assumptions, pixel-stamped numerals
  HostSection.vue              Basie Comer, pull quote, rotating sign-offs
  EpisodeTimeline.vue          terracotta band, GSAP Draggable + arrows
  AskUs.vue                    form (endpoint or mailto fallback — never fake success)
  EpisodesAndReflections.vue   two CMS-driven preview blocks
  FloatingAction.vue           pixel-Earth FAB + motion pause toggle (WCAG 2.2.2)
  FooterConcrete.vue           5.7 callback: concrete + settled word fragments
assets/reference-sheet/        LOCKED Nano Banana still set — source of truth for all clips
public/media/                  encoded Seedance clips + legacy pixel-earth assets
```

## Content editing (no code changes)

Everything that grows lives in `data/site.js`: add episodes (flip an
`upcoming` slot to `published`), reflections (set `url` to activate Read →),
and answered listener questions. These collections map 1:1 onto a headless
CMS content model when the project outgrows the file.

## The asset pipeline (spec §6)

- `assets/reference-sheet/` is the locked style bible: 7 Nano Banana stills
  (planet full/close-orbit/half-lit, forest day/night, concrete study,
  palette sheet), all conditioned on the original pixel-earth video's frame.
  Don't regenerate it mid-project.
- Every video was generated with Seedance 2.0 (std / 1080p / 16:9 / 8s /
  silent), conditioned with `start_image` = `end_image` = the relevant sheet
  still for seamless loops:
  - `public/media/hero-planet.mp4` — hero planet (Three.js video texture)
  - `public/media/motion-break.mp4` — full-bleed break
  - `public/media/footer-concrete.mp4` — barely-moving footer ambient
- Clips are re-encoded H.264/yuv420p/faststart via ffmpeg (installed via winget).

## Behavior guarantees

- Lenis is wired into GSAP's ticker (single clock, no scrub desync).
- `prefers-reduced-motion`: no smooth scroll, no pins/scrub/drag (native
  horizontal scroll for the timeline), no typewriter/word-fall (message shows
  fully, fades on scroll), no WebGL (DOM poster/video fallbacks), videos pause.
- Mobile (≤899px): no WebGL canvas, philosophy unpins to a stacked list,
  pillars list becomes horizontal, word-fall would drop straight (no drift).
- The ⏸ button above the FAB pauses every motion video on the page.
- WCAG AA contrast throughout; pixel font restricted to episode numbers,
  timestamps, chips, footer credit, and concrete fragments.

## Still to fill in

- `data/site.js` → direct Spotify/Apple show URLs (currently search links)
  and an Ask Us `formEndpoint` (currently opens a pre-filled email draft).
- Host photo (`HostSection.vue`, marked `[PLACEHOLDER]`), footer socials.
- Optional: swap Google Fonts for self-hosted files before production.
