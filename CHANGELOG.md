# Changelog — ItsUsWorldwide

Tracks the iterative rounds of the site build. The live project is the Nuxt 3
app in this folder (`itsusworldwide-v2/`). The original static fallback lives
in the sibling `itsusworldwide/` folder.

All generated assets are saved locally for continuity:
- `assets/reference-sheet/` — locked Nano Banana stills (source of truth)
- `assets/source-clips/` — raw Seedance mp4s before ffmpeg processing
- `public/media/` — the processed clips/posters the site actually serves

## v7.2 (current) — mobile-only fixes, desktop untouched
Full mobile audit (375px) done by scrolling every section via Lenis and
checking real DOM/layout state (not just screenshots — several apparent bugs
turned out to be screenshot compression artifacts or scroll-desync from using
native `scrollTo` instead of the site's Lenis API; both were ruled out via the
accessibility tree and element geometry before touching any code). Every fix
below is scoped inside an existing `@media (max-width: ...)` block, so it is
structurally impossible for it to reach desktop — verified by checking
`matchMedia(...).matches` and computed styles at 1233px width after each fix
(all read back the original untouched desktop values).

- **Philosophy clouds: text was overflowing off the bottom of the puff.**
  `.cloud__a`/`.cloud__b`'s font-size clamp floored at a fixed 16px for any
  viewport under ~941px, while the cloud itself kept shrinking around it
  (660px on desktop → ~307px on phones) — so 2-line labels grew
  disproportionately tall relative to their container and spilled onto the
  dark sky. Added a mobile-scoped smaller font clamp + reduced padding-top;
  verified all 5 clouds' text now sits fully inside the white band (bottoms
  at 54–70%, vs. the 77% cutoff) with real DOM measurements, not screenshots.
- **Nav bar and "three homes" pillar list scrolled silently off-screen.**
  Both are horizontally-scrollable rows on mobile with zero visual cue —
  "Ask Us"/"Journal" and "The Practice" just cut off hard at the edge,
  reading as broken/missing rather than swipeable. Added a right-edge fade
  mask to both, mobile-scoped only.
- **Season dropdown menu ran off the right edge of the phone screen** — the
  real bug of this round. `.season__dd-menu` carried a fixed desktop
  sizing (`margin-left: 148px` + `width: 252px`, ~400px of required room)
  that a 375px phone doesn't have; the menu clipped mid-word ("Season of
  Learning" 's "finale" badge cut off) and forced the browser to widen its
  effective viewport to compensate. Confirmed with a real screenshot at a
  stable scroll position, then fixed by dropping the margin and capping the
  menu to the available width on mobile; the waterfall visual now sits
  behind the panel instead of beside it. Re-verified: menu right edge now
  well inside the viewport, no more phantom viewport widening.
- Minor known cosmetic item, not fixed this round: the floating Earth/pause
  buttons can sit over one cloud's text at a specific scroll position on
  mobile (fixed UI over full-bleed pinned content) — didn't touch
  FloatingAction.vue's hero-hide logic to avoid risking that behavior for a
  purely cosmetic overlap.

## v7.1
- **msg.exe word-fall finally falls.** `overflow: hidden` on the retro window
  was clipping the falling words inside the bubble, so the fall never showed.
  Removed; the words now rain in front of everything and exit past the bottom
  of the viewport (bubble z500 already beat the nav z200 — the clip was the
  whole bug).
- **Hero clip: intro playback + smooth scrub.** On load the transition clip
  PLAYS its first 3s (stars sparkle, globe turns) then parks; from there
  scroll scrubs the remainder (3s → end) instead of restarting at frame 0.
  Scrolling early hands off immediately. Stutter fixed by re-encoding the raw
  31.5MB normal-GOP file to all-intra 1280w (6.7MB, every frame seekable) —
  raw archived to `assets/source-clips/hero-transition-raw.mp4`.
- **Cloud text fully on the white.** Five big clouds can't stack in one column
  without burying each other's words (did the geometry — no step/z-order
  works), so the cloudscape now scatters across the WHOLE stage with resting
  spots chosen so no cloud's solid white ever covers another's text. Clouds
  also render ~12% taller (aspect-ratio stretch, invisible on a cloud) and the
  labels start on the wide solid band, not the narrow top knob. Verified: zero
  white-over-text collisions, all text inside the viewport.
- **"Love isn't a one time thing / it's a daily habit" much bigger** —
  clamp(38px, 5.4vw, 76px) desktop (was 24–46px), 28–42px mobile.
- Footer credit now reads "built with love for all of US."; the Four
  assumptions background is semi-transparent (78% surface via color-mix) so
  the valley shows through.
- **Nav reordered to match the page flow**: Home, Philosophy, About, Podcast,
  Ask Us, Journal (was Podcast/Journal/Ask Us/About — the scrollspy dot
  jumped around; now it travels left → right as you scroll down).
- **Motion break is now the campfire.** `campfire.mp4` (user-supplied, raw
  archived to `assets/source-clips/campfire-raw.mp4`, encoded 1280w ~0.5MB +
  poster) plays as an ambient loop with the slow-zoom treatment — fire burns
  continuously rather than being scrubbed. The big flanking phrases stay.
  Heart-checklist code path remains as fallback if the campfire clip is
  removed.
- **Blue pole text bold + steady glow.** The italic second poles ("Us",
  "Self improvement", "Social influence"…) are now weight 800 in a deeper
  pastel blue with a permanent soft blue halo — more readable and eye-catching
  on the white puffs, no animation.
- **"Understanding" cloud enlarged too** (660px, matching the love cloud;
  left edge nudged so the bigger cloud keeps its right edge on screen). Its
  full label verified inside the solid white.
- **"Love" cloud enlarged.** Its pair is the longest label of the five, so
  that cloud renders bigger than the rest (660px vs 560px) — the whole label,
  including "The love we give one another", now sits fully on the solid white
  with margin. (An under-puff variant was tried and reverted in favor of the
  simpler size bump.)
- **Bottom clouds fixed for real.** Their labels were running off the bottom
  of the pinned viewport; clouds 4 and 5 lifted (top 67/70% → 59/62%, x
  unchanged) and clouds now stack with DESCENDING z-index so an upper cloud's
  text can drift over a lower puff (readable) but a puff can never bury text.
  Verified: zero white-over-text overlaps, deepest text 789px on an 837px
  viewport.
- Philosophy thesis line ("Us" is four things at once…) now 24px bright cream
  with a slow breathing glow; labels on clouds 4/5 start lower on the puff.
- **All four checkmarks now visibly land.** The scrub previously finished the
  4th tick at progress 1.0 — the moment the heart had already scrolled off
  screen. The scroll → video-time anchors now complete all four by
  progress 0.6 (heart dead-center) and hold the fully-checked frame while
  the section scrolls away.

## v7
- **Hero planet replaced with the full-globe transition clip**
  (`hero-planet-transition.mp4`). It is centered and zoomed to the globe's top
  half at the top of the page, then over the hero scroll it rises and zooms OUT
  to the whole globe (a centered reveal at mid-hero) before climbing away into
  philosophy. The clip still scrubs by scroll. This removes the old bottom-right
  planet plane (the duplicate "video overlaying the background").
- **"Me vs Us" philosophy cards → drifting pixel clouds.** The five tension
  pairings now ride Higgsfield pixel clouds (`cloud-a/b.png`, background removed
  for true alpha). As the pinned section scrolls, the clouds float in from the
  right ONE BY ONE and accumulate, then linger centered until the whole sky is
  full of all five, before scrolling away. (Replaces the old hard card-swap.)
- **Backend live:** Ask Us form now POSTs to **Web3Forms** → delivers straight
  to its.us.worldwide@gmail.com (verified 200, no email-client popup). Spotify
  and Apple show links confirmed working; host photo (`host.jpg`) confirmed
  loading. Socials still pending.
- **Backups:** lean source-only snapshots per version under
  `Website/Backups/vN/` (excludes node_modules/.nuxt — restore with
  `npm install`). v7 snapshot created.

## v6
- Heart-checklist motion break on the bright day sky; checklist reordered so
  **"Take a breath" is the first row**. The **heart beats as a function of
  scroll** (thumps as you move, freezes when you stop — no free-running timer).
- Sky bodies never share the screen: the **moon fully exits frame before**
  "What does this reveal about us?", the sun rises only after the moon is gone,
  and the sunset hands off (sun out, then moon in).
- **FAB (Earth button) hidden in the hero**; fades in once you scroll past it,
  so the only planet at the top is the scroll-driven background one.
- All raw source clips archived to `assets/source-clips/`; added this changelog.

### v6 — sequential assumptions + day-background locked to the moon
- Four assumptions now reveal STRICTLY one after another: each fully completes
  (number, title, typed subtext) and holds before the next begins (timeline
  built by appending, no absolute positions, so no overlap).
- **Day/valley background rewritten to be driven by the same measured
  positions the 3D sun/moon use** (in DayCycle), not ScrollTriggers. The
  ScrollTrigger-based theme was going stale when the pins grew the page (sunset
  fired at ~8300px instead of #ask ~14700px), reverting to night by the
  numbered grid. Now `dayFactor = riseE * (1 - moonIn)` re-measured each frame:
  the valley fades in as the sun rises, HOLDS through the day and the sun's
  exit, and fades out only as the 3D moon returns to place. Locked to the moon
  by construction, immune to layout shifts.
- Added robust late `ScrollTrigger.refresh()` passes in app.vue (load + 400/
  1000/2000ms) so heart-scrub, rising words, and pins settle against the final
  pinned layout regardless of async mount order.

### v6 — pinned assumptions + one-by-one checkmarks
- **"Four assumptions" section now pins** and reveals each assumption in order
  (number → title → typed subtext) as you scroll down; the pin means you can't
  scroll past until all four are in. Verified reveal sequence
  `[1,0,0,0]→[1,1,0,0]→[1,1,1,·]→[1,1,1,1]` across 2.5k px of pinned scroll.
  Mobile / reduced motion keeps the plain per-item reveal.
- **Heart checkmarks now tick strictly one by one.** The clip drew checks 2 and
  3 in a burst (~2.5–2.9s); the scrub now remaps scroll → video time with
  measured anchors so each checkmark lands on its own even quarter of the
  scroll (t ≈ 1.9 / 2.7 / 3.05 / 5.5 at 25/50/75/100%).

### v6 fixes (review round)
- **Removed the duplicate hero video.** `showFallback` was latching true when
  the viewport first reported small, so the DOM fallback `<video>` rendered on
  top of the WebGL canvas (the "video overlaying the background"). It now tracks
  `use3D` via a watcher and disappears when the canvas is active.
- **Fixed the frozen motion-break scroll.** Its ScrollTriggers were computed
  against a stale layout (before the philosophy pin-spacer pushed everything
  down) and stuck at their end state — so the side phrases were a still frame
  and the checkmarks were pre-drawn. Added a post-mount `ScrollTrigger.refresh()`
  (rAF + timed). The "Love isn't a one time thing / it's a daily habit" halves
  rise on scroll again and the checkmarks draw with scroll.

## v5
- Hero video **scrubbed by scroll** (no autoplay) — the planet turns as you move.
- Motion-break phrase **split to flank the heart**: "Love isn't a one time
  thing" (left) / "it's a daily habit." (right), so it never covers the heart.
- **Sun and moon travel left → right**; moon present at page load.
- **Sunset returns to night past Ask Us** — theme tweens back to the night
  greens, valley wallpaper fades out, 3D moon rises to replace the sun.
- Heart-checklist background changed to a **light green day sky**.
- Season dropdown options changed to **plain text** (waterfall retained).

## v4
- Mathematically **seamless hero loop** (last 3s of the globe clip, slowed 2×,
  crossfade-spliced).
- Falling hero-message words **teleported in front of everything**, exit past
  the bottom edge.
- Motion break became the **heart-checklist video, scrubbed by scroll** (the
  heart itself is the checklist, tone-on-tone rows).
- Seasons dropdown v2: **generated pixel waterfall** + (then) water bubbles.
- **Denser, brighter starfield** across the top.

## v3
- **Night → day cycle**: 3D sun rises at the philosophy question, theme shifts
  to daylight greens, pixel valley wallpaper fades in; cursor moon → sun.
- **Retro msg.exe** window for the hero notification.
- **Water-droplet seasons dropdown** (Discovery/Love/Community/Learning).
- Section reorder (motion break → "What makes this different").
- Typed-in subtext on the numbered grid; rising "Love is a daily habit" line;
  FAB hop; real Spotify/Apple links; hyphen sweep; sign-offs removed.

## v2
- Full **Nuxt 3 + GSAP/ScrollTrigger + Lenis + Three.js** rebuild.
- Shared WebGL scroll-camera rig; component-per-section structure.
- Clean Inter Tight display type; pixel font demoted to accessory.
- Hero planet video texture breaking out of the wordmark; typed notification
  whose words fall and reappear in the concrete footer.
- Higgsfield asset pipeline established (Nano Banana stills → Seedance clips).

## v1
- Static zero-toolchain HTML/CSS/JS site (`../itsusworldwide/`), served for
  the first review before Node.js was installed.
