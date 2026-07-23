<template>
  <canvas v-if="active" ref="canvas" class="three-stage" aria-hidden="true"></canvas>
</template>

<script setup>
/* The shared depth engine (spec §4). One scene, one camera, driven by the
   page's normalized scroll. Stages are placed at their DOM section's scroll
   offset, each with its own parallax factor, so scrolling reads as moving
   through a layered space. Geometry stays cheap: textured planes + square
   point stars — this is a pixel-art aesthetic, not a photoreal one.
   Mounted only when use3D (WebGL present, no reduced motion, not mobile);
   otherwise the DOM fallbacks in each section carry the visuals. */
import * as THREE from 'three'

const engine = useScrollEngine()
const active = computed(() => (engine ? engine.use3D.value : false))
const canvas = ref(null)

let renderer, scene, camera, tickFn, onResize, onRefresh, videoEl
let stages = [] /* { obj, el, pf, xWorld, zWorld } */
let sunStage = null
let moonStage = null
let heroMeta = { h: 0, centerPx: 0 }
let starGroups = []
let disposed = false

const FOV = 50
const CAM_Z = 10

function pxToWorld() {
  /* world units per CSS pixel at the z=0 focal plane */
  const viewH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)
  return viewH / window.innerHeight
}

function radialAlphaTexture(cy = 128) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, cy, 40, 128, cy, 132)
  grad.addColorStop(0, '#fff')
  grad.addColorStop(0.62, '#fff')
  grad.addColorStop(1, '#000')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

/* stylized sun: speckled amber surface so its rotation reads as 3D */
function sunSurfaceTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#F59E0B'
  g.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 900; i++) {
    g.fillStyle = i % 2 ? 'rgba(253,230,138,' + (0.12 + Math.random() * 0.3) + ')' : 'rgba(226,114,91,' + (0.1 + Math.random() * 0.25) + ')'
    const s = 2 + Math.random() * 7
    g.fillRect(Math.random() * 512, Math.random() * 256, s, s * (0.5 + Math.random()))
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function sunGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(255,243,214,1)')
  grad.addColorStop(0.3, 'rgba(253,230,138,0.7)')
  grad.addColorStop(0.62, 'rgba(245,158,11,0.28)')
  grad.addColorStop(1, 'rgba(245,158,11,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

/* cratered cream moon: rotation reads as 3D, like the sun */
function moonSurfaceTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#D9D6C6'
  g.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 70; i++) {
    const r = 4 + Math.random() * 16
    const x = Math.random() * 512
    const y = Math.random() * 256
    g.fillStyle = 'rgba(160,158,142,' + (0.25 + Math.random() * 0.3) + ')'
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(237,232,208,0.35)'
    g.beginPath()
    g.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function moonGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(237,232,208,0.9)')
  grad.addColorStop(0.4, 'rgba(217,214,198,0.35)')
  grad.addColorStop(1, 'rgba(217,214,198,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

function pixelTexture(tex) {
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.LinearFilter
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

async function heroVideoSrc() {
  /* Nuxt's dev server answers unknown paths with the app HTML (200), so a
     bare ok-check lies — require an actual video content-type. Prefer the
     full-globe transition clip (zoomed in at the hero, out toward philosophy). */
  const tryOne = async (path) => {
    try {
      const head = await fetch(path, { method: 'HEAD' })
      const type = head.headers.get('content-type') || ''
      return head.ok && type.startsWith('video/')
    } catch (e) {
      return false
    }
  }
  if (await tryOne('/media/hero-planet-transition.mp4')) return '/media/hero-planet-transition.mp4'
  if (await tryOne('/media/hero-planet.mp4')) return '/media/hero-planet.mp4'
  return '/media/pixel-earth.mp4'
}

async function init() {
  const el = canvas.value
  if (!el || disposed) return

  renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.z = CAM_Z

  const loader = new THREE.TextureLoader()

  /* ---- hero planet: video texture plane, breaks out of the wordmark ---- */
  /* scrub-driven: the hero loop never autoplays; scroll turns the planet */
  videoEl = document.createElement('video')
  videoEl.muted = true
  videoEl.playsInline = true
  videoEl.preload = 'auto'
  videoEl.crossOrigin = 'anonymous'
  videoEl.src = await heroVideoSrc()
  videoEl.load()
  /* on load the clip PLAYS its opening seconds (stars sparkle, globe turns),
     then parks; from that frame on, scroll scrubs the remainder. If the
     reader starts scrolling early the intro hands off immediately. */
  const intro = { active: true, end: 3.0 }
  videoEl.addEventListener(
    'loadeddata',
    () => {
      if (intro.active && window.scrollY < 40) videoEl.play().catch(() => {})
    },
    { once: true }
  )
  const vtex = pixelTexture(new THREE.VideoTexture(videoEl))
  const planetMat = new THREE.MeshBasicMaterial({
    map: vtex,
    transparent: true,
    /* centered soft circle: shows the centered globe, hides the clip's square
       starfield edges so it blends into the page's own night sky + stars */
    alphaMap: radialAlphaTexture(128),
    depthWrite: false,
  })
  const planetH = 5.4
  const planet = new THREE.Mesh(new THREE.PlaneGeometry(planetH * (16 / 9), planetH), planetMat)
  scene.add(planet)

  /* ---- philosophy backdrop: forest at night, far and dim ---- */
  const forestMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.2, depthWrite: false })
  loader.load('/media/ref/forest-night.png', (t) => (forestMat.map = pixelTexture(t)) && (forestMat.needsUpdate = true))
  const forest = new THREE.Mesh(new THREE.PlaneGeometry(26, 26 * (9 / 16)), forestMat)
  forest.position.z = -8
  scene.add(forest)

  /* ---- pillars/host drift: the full planet, small, far right ---- */
  const globeMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    alphaMap: radialAlphaTexture(),
  })
  loader.load('/media/ref/planet-full.png', (t) => (globeMat.map = pixelTexture(t)) && (globeMat.needsUpdate = true))
  const globe = new THREE.Mesh(new THREE.PlaneGeometry(8, 8 * (9 / 16)), globeMat)
  globe.position.z = -4
  scene.add(globe)

  /* ---- the sun: a real 3D body that rises behind the philosophy question
          and parks in the sky for the daylight half of the site ---- */
  const sunGroup = new THREE.Group()
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 48, 48),
    new THREE.MeshBasicMaterial({ map: sunSurfaceTexture() })
  )
  const mkGlow = (scale, opacity) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunGlowTexture(),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    s.scale.setScalar(scale)
    return s
  }
  sunGroup.add(sunCore, mkGlow(3.6, 0.85), mkGlow(6.2, 0.38), mkGlow(10, 0.16))
  sunGroup.position.z = -1.5
  sunGroup.visible = false
  scene.add(sunGroup)

  /* ---- the moon: rises during the sunset past Ask Us ---- */
  const moonGroup = new THREE.Group()
  const moonCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 48, 48),
    new THREE.MeshBasicMaterial({ map: moonSurfaceTexture() })
  )
  const moonGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: moonGlowTexture(),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  moonGlow.scale.setScalar(3.4)
  moonGroup.add(moonCore, moonGlow)
  moonGroup.position.z = -1.5
  moonGroup.visible = false
  scene.add(moonGroup)

  /* ---- stars: three parallax layers of square points ---- */
  const mkStars = (count, size, z, pf, spanY = 400, opacity = 0.75, color = 0xede8d0) => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40
      pos[i * 3 + 1] = 6 - Math.random() * spanY
      pos[i * 3 + 2] = z
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
    })
    const pts = new THREE.Points(geo, mat)
    pts.userData.pf = pf
    scene.add(pts)
    starGroups.push(pts)
  }
  mkStars(320, 0.05, -8, 0.35)
  mkStars(220, 0.08, -5, 0.5)
  mkStars(130, 0.11, -3, 0.65)
  /* dense, brighter band across the top of the page (hero region) */
  mkStars(220, 0.06, -6, 0.45, 26, 0.95, 0xf7f4e6)

  /* ---- stage registry: object ↔ DOM section, parallax factor ---- */
  /* the hero planet is handled on its own (zoom + framing below), not via the
     generic parallax registry */
  stages = [
    { obj: forest, sel: '#philosophy', pf: 0.9, x: 0, yBias: 0 },
    { obj: globe, sel: '#about', pf: 0.75, x: 6.3, yBias: 0 },
  ]
  sunStage = { sel: '.philosophy__after', centerPx: null }
  moonStage = { sel: '#ask', centerPx: null }
  layout()

  /* rack-focus veil at stage handovers */
  const veil = document.querySelector('.stage-veil')
  if (veil && engine) {
    ;['#philosophy', '#pieces'].forEach((sel) => {
      engine.ScrollTrigger.create({
        trigger: sel,
        start: 'top 90%',
        end: 'top 20%',
        scrub: true,
        onUpdate: (self) => {
          const blur = Math.sin(self.progress * Math.PI) * 5
          veil.style.setProperty('--stage-blur', blur.toFixed(2) + 'px')
        },
      })
    })
  }

  /* ---- render loop on GSAP's ticker (shared clock with ScrollTrigger) ---- */
  let mx = 0
  let my = 0
  const onMouse = (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2
    my = (e.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('mousemove', onMouse, { passive: true })

  tickFn = () => {
    if (disposed) return
    const k = pxToWorld()
    const y = window.scrollY

    for (const s of stages) {
      if (s.centerPx == null) continue
      s.obj.position.y = (y - s.centerPx) * k * s.pf + (s.yBias || 0) * 7
      s.obj.position.x = s.x || 0
    }
    for (const g of starGroups) g.position.y = y * k * g.userData.pf

    /* sky choreography — both bodies travel left to right:
       - the MOON is parked upper-left from the very first frame; during the
         sunrise it crosses the sky and exits right
       - the SUN enters from the left at the question, arcs up behind the
         text, parks upper right, then exits right during the sunset
       - after the sunset the moon re-enters from the left and takes the
         sun's old place for the night half */
    const vh = window.innerHeight
    const clamp01 = (p) => Math.min(1, Math.max(0, p))
    const smooth = (p) => p * p * (3 - 2 * p)

    let riseE = 0
    let setE = 0
    let moonExitE = 0
    if (sunStage && sunStage.centerPx != null) {
      riseE = smooth(clamp01((y - (sunStage.centerPx - vh * 0.55)) / (vh * 1.4)))
      /* the opening moon must clear the frame BEFORE the sun starts rising,
         so they never share the screen at the question */
      moonExitE = smooth(clamp01(y / Math.max(1, sunStage.centerPx - vh * 0.7)))
    }
    if (moonStage && moonStage.centerPx != null) {
      setE = smooth(clamp01((y - (moonStage.centerPx - vh * 0.2)) / (vh * 1.3)))
    }
    /* the sunset is split: sun exits first (0→0.5), moon enters after (0.5→1),
       so again they are never on screen together */
    const sunOut = smooth(clamp01(setE / 0.5))
    const moonIn = smooth(clamp01((setE - 0.5) / 0.5))

    /* SUN: enters left after the moon has gone, arcs behind the question,
       parks upper right, then exits right during the first half of the sunset */
    sunGroup.position.x = -8 + riseE * 11.4 + sunOut * 6.8
    sunGroup.position.y = -2.6 + Math.sin((riseE * Math.PI) / 2) * 6.1 - Math.sin((sunOut * Math.PI) / 2) * 6.2
    sunGroup.scale.setScalar(0.9 + riseE * 0.15)
    sunGroup.visible = riseE > 0.002 && sunOut < 0.985
    sunCore.rotation.y += 0.0012

    /* MOON: opening drift out (page start → before the question) OR the night
       return (second half of the sunset, in from the left) */
    if (setE > 0.001) {
      moonGroup.position.x = -9 + moonIn * 12.3
      moonGroup.position.y = 1.4 + Math.sin((moonIn * Math.PI) / 2) * 1.9
      moonGroup.visible = moonIn > 0.02
    } else {
      moonGroup.position.x = -3.6 + moonExitE * 14
      moonGroup.position.y = 3.3 + Math.sin(moonExitE * Math.PI) * 0.5
      moonGroup.visible = moonExitE < 0.985
    }
    moonCore.rotation.y += 0.0008

    /* hero clip: intro segment plays itself on load, then scroll scrubs the
       REST of the clip (intro.end → duration) so playback continues from
       where the intro parked instead of yanking back to frame 0 */
    if (heroMeta.h && videoEl && videoEl.duration) {
      if (intro.active) {
        if (videoEl.currentTime >= intro.end || y > 60) {
          videoEl.pause()
          intro.active = false
        }
      } else {
        const hp = clamp01(y / heroMeta.h)
        const t = intro.end + hp * Math.max(0, videoEl.duration - intro.end - 0.05)
        if (Math.abs(t - videoEl.currentTime) > 0.033) videoEl.currentTime = t
      }
    }

    /* HERO PLANET: centered. Two phases over the hero scroll —
       A (0→0.55): the globe is zoomed in and pushed low so only its top half
         shows at load; it rises and zooms OUT to the whole globe, centered.
       B (0.55→1): having shown the full globe, it climbs up and leaves the top
         as the reader continues into philosophy.
       The clip itself keeps scrubbing (block above), so the globe turns too. */
    {
      const hz = clamp01(y / Math.max(1, heroMeta.h))
      let py, ps
      if (hz <= 0.55) {
        const a = smooth(hz / 0.55)
        py = -3.6 + a * 3.6 /* low (top half) → centered */
        ps = 1.9 - a * 0.9 /* zoomed in → whole globe */
      } else {
        const b = smooth((hz - 0.55) / 0.45)
        py = b * 6.8 /* centered → climbs off the top */
        ps = 1.0
      }
      planet.position.set(0, py, 0)
      planet.scale.setScalar(ps)
    }
    planet.rotation.z = Math.sin(performance.now() / 9000) * 0.05
    camera.position.z = CAM_Z - (engine ? engine.progress.value : 0) * 1.1
    camera.position.x += (mx * 0.28 - camera.position.x) * 0.05
    camera.position.y += (-my * 0.2 - camera.position.y) * 0.05

    renderer.render(scene, camera)
  }
  engine.gsap.ticker.add(tickFn)
  window.__stage = { videoEl, planet, scene, camera } /* debugging */

  onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    layout()
  }
  window.addEventListener('resize', onResize)

  /* section offsets shift when pins are created — re-measure on refresh */
  onRefresh = () => layout()
  engine.ScrollTrigger.addEventListener('refresh', onRefresh)

}

function layout() {
  const measure = (s) => {
    const el = document.querySelector(s.sel)
    if (!el) return
    const r = el.getBoundingClientRect()
    s.centerPx = r.top + window.scrollY + el.offsetHeight / 2 - window.innerHeight / 2
  }
  stages.forEach(measure)
  if (sunStage) measure(sunStage)
  if (moonStage) measure(moonStage)
  const hero = document.querySelector('#home')
  heroMeta.h = hero ? hero.offsetHeight : 0
  heroMeta.centerPx = hero ? hero.offsetTop + hero.offsetHeight / 2 - window.innerHeight / 2 : 0
}

let started = false
function start() {
  if (started) return
  started = true
  /* lazy-mount the GL work just after first paint */
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 180))
  idle(() => nextTick(() => init()))
}

onMounted(() => {
  if (active.value) start()
  /* the viewport can report a transient size at plugin init (e.g. the tab
     opening small) — mount the stage if use3D flips on afterwards */
  else if (engine) watch(active, (on) => on && start())
})

onBeforeUnmount(() => {
  disposed = true
  if (engine && tickFn) engine.gsap.ticker.remove(tickFn)
  if (engine && onRefresh) engine.ScrollTrigger.removeEventListener('refresh', onRefresh)
  window.removeEventListener('resize', onResize)
  if (videoEl) {
    videoEl.pause()
    videoEl.src = ''
  }
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.three-stage {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2; /* above the hero wordmark (z1), below section content (z3) */
  pointer-events: none;
}
</style>
