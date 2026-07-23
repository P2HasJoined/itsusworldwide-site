<template>
  <div class="fab" :class="{ 'is-hidden': hiddenAtTop }">
    <button
      class="fab__motion"
      type="button"
      :aria-pressed="String(paused)"
      :title="paused ? 'Play background motion' : 'Pause background motion'"
      data-magnetic
      @click="toggle"
    >
      <span aria-hidden="true">{{ paused ? '▶' : '❚❚' }}</span>
      <span class="visually-hidden">Pause background motion</span>
    </button>

    <div class="fab__wrap">
      <div v-show="open" id="fabMenu" class="fab__menu">
        <a :href="SITE.links.spotify" target="_blank" rel="noopener" @click="open = false">Listen on Spotify</a>
        <a :href="SITE.links.apple" target="_blank" rel="noopener" @click="open = false">Listen on Apple Podcasts</a>
        <a href="#ask" @click.prevent="goAsk">Ask a question</a>
      </div>
      <button
        ref="btn"
        class="fab__btn"
        type="button"
        :aria-expanded="String(open)"
        aria-controls="fabMenu"
        aria-label="Quick links"
        data-magnetic
        @click="open = !open"
      >
        <img src="/media/ref/planet-full.png" alt="" class="fab__icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { SITE } from '~/data/site'

const open = ref(false)
const btn = ref(null)
const engine = useScrollEngine()
const paused = computed(() => (engine ? engine.motionPaused.value : false))
/* erased at the very top of the page: only the scroll-driven background
   planet shows in the hero. Revealed once the reader scrolls past it. */
const hiddenAtTop = ref(true)

function toggle() {
  if (!engine) return
  engine.motionPaused.value = !engine.motionPaused.value
}

function goAsk() {
  open.value = false
  engine && engine.scrollTo('#ask')
}

let onDoc, onKey, stopWatch, onScroll
onMounted(() => {
  onDoc = (e) => {
    if (open.value && !e.target.closest('.fab__wrap')) open.value = false
  }
  onKey = (e) => {
    if (e.key === 'Escape' && open.value) {
      open.value = false
      btn.value && btn.value.focus()
    }
  }
  document.addEventListener('click', onDoc)
  document.addEventListener('keydown', onKey)

  /* reveal the FAB once the hero has scrolled most of the way out */
  const setVis = () => {
    const hero = document.querySelector('#home')
    const h = hero ? hero.offsetHeight : window.innerHeight
    hiddenAtTop.value = window.scrollY < h * 0.6
  }
  window.addEventListener('scroll', setVis, { passive: true })
  onScroll = setVis
  setVis()

  /* the pause toggle drives every marked video on the page */
  if (engine) {
    stopWatch = watch(
      engine.motionPaused,
      (p) => {
        document.querySelectorAll('video[data-motion-video]').forEach((v) => {
          if (p) v.pause()
          else v.play().catch(() => {})
        })
        document.documentElement.classList.toggle('motion-paused', p)
      },
      { immediate: true }
    )
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDoc)
  document.removeEventListener('keydown', onKey)
  onScroll && window.removeEventListener('scroll', onScroll)
  stopWatch && stopWatch()
})
</script>

<style scoped>
.fab {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fab.is-hidden {
  opacity: 0;
  transform: translateY(16px) scale(0.85);
  pointer-events: none;
}
.fab {
  position: fixed;
  right: clamp(16px, 3vw, 32px);
  bottom: clamp(16px, 3vh, 30px);
  z-index: 210;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.fab__motion {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  color: var(--neutral-cream);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.fab__wrap { position: relative; }

.fab__btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.15s ease;
  /* a periodic little hop so it catches the eye */
  animation: fab-hop 4.6s ease-in-out infinite;
}
.fab__btn:hover,
.fab__btn:focus-visible,
.fab__btn[aria-expanded='true'] {
  animation-play-state: paused;
}
.fab__btn:hover { transform: scale(1.06); }

@keyframes fab-hop {
  0%, 24%, 100% { translate: 0 0; }
  6% { translate: 0 -8px; }
  12% { translate: 0 0; }
  17% { translate: 0 -4px; }
}
@media (prefers-reduced-motion: reduce) {
  .fab__btn { animation: none; }
}
.fab__icon { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; transform: scale(1.6); }

.fab__menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  display: grid;
  min-width: 230px;
  overflow: hidden;
}
.fab__menu a {
  padding: 15px 20px;
  font-weight: 700;
  font-size: 15px;
  border-bottom: 1px solid var(--border);
}
.fab__menu a:last-child { border-bottom: 0; }
.fab__menu a:hover { background: var(--bg-surface-1); color: var(--green-vitality); }
</style>
