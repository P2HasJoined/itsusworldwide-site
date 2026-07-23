<template>
  <section id="about" class="host above-canvas">
    <div class="container host__grid">
      <div class="host__portrait" data-reveal>
        <!-- uses public/media/host.jpg automatically once the file exists -->
        <img
          v-if="photoSrc"
          :src="photoSrc"
          alt="Basie Comer, host and creator of UsWorldWide"
          class="host__photo"
          data-mask
        />
        <div v-else class="host__frame" role="img" aria-label="Portrait placeholder for Basie Comer">
          <span class="host__initials display">BC</span>
        </div>
      </div>

      <div class="host__bio">
        <p class="eyebrow" data-reveal>The host</p>
        <h2 class="section-title" data-split>Basie Comer</h2>
        <p class="host__role" data-reveal>Host &amp; Creator &middot; credited as Base&nbsp;C.</p>
        <p data-reveal>
          Why does this show exist? Because people feel less alone the moment they realize their
          private struggles belong to a larger, shared human conversation. That&rsquo;s the bet the
          whole project makes, and why every episode ends by handing the question back to you.
        </p>

        <blockquote class="pullquote" data-reveal>
          <p>&ldquo;Hey there and welcome to Us. This is a podcast about, well&hellip; Us.&rdquo;</p>
        </blockquote>
      </div>
    </div>
  </section>
</template>

<script setup>
const photoSrc = ref(null)

onMounted(async () => {
  try {
    /* content-type check: the dev server answers missing files with HTML 200 */
    const head = await fetch('/media/host.jpg', { method: 'HEAD' })
    const type = head.headers.get('content-type') || ''
    if (head.ok && type.startsWith('image/')) photoSrc.value = '/media/host.jpg'
  } catch (e) {
    /* keep the BC frame */
  }
})
</script>

<style scoped>
.host { padding: clamp(100px, 14vh, 170px) 0; }

.host__grid {
  display: grid;
  grid-template-columns: minmax(240px, 380px) 1fr;
  gap: clamp(40px, 6vw, 100px);
  align-items: start;
}

.host__photo {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
  object-fit: cover;
  aspect-ratio: 3 / 4;
}

.host__frame {
  aspect-ratio: 3 / 4;
  background: linear-gradient(180deg, rgba(62, 207, 142, 0.06), transparent 55%), var(--bg-surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.host__initials { font-size: clamp(52px, 6vw, 84px); font-weight: 800; color: var(--green-mid); }

.host__role { font-weight: 700; color: var(--neutral-clay); margin-bottom: 22px; }
.host__bio > p:not(.eyebrow):not(.host__role) { max-width: 58ch; color: var(--text-muted); }
/* the section sits over the daylight wallpaper: keep the copy anchored */
.host__bio p { text-shadow: 0 1px 10px rgba(14, 26, 20, 0.7); }

.pullquote {
  margin: 40px 0 0;
  background: var(--bg-surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: clamp(28px, 4vw, 44px);
  box-shadow: var(--shadow-soft);
}
.pullquote p {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: clamp(22px, 2.6vw, 30px);
  line-height: 1.4;
}

@media (max-width: 899px) {
  .host__grid { grid-template-columns: 1fr; }
  .host__portrait { max-width: 320px; }
}
</style>
