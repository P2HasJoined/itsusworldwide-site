<template>
  <section id="ask" class="ask above-canvas">
    <div class="container ask__grid">
      <div class="ask__lead">
        <p class="eyebrow" data-reveal>Ask Us</p>
        <h2 class="section-title" data-split>Your turn to raise the question.</h2>
        <p data-reveal>
          UsWorldWide shouldn&rsquo;t be one person deciding what matters for everyone. Ask
          anything: the honest, the awkward, the half formed. Questions picked for the show are
          answered on air.
        </p>
      </div>

      <form class="ask__form" novalidate data-reveal @submit.prevent="submit">
        <div class="field">
          <label for="askName">Name or handle <span class="field__opt">(optional)</span></label>
          <input id="askName" v-model="form.name" type="text" autocomplete="nickname" maxlength="80" />
        </div>

        <div class="field">
          <label for="askTopic">Topic</label>
          <select id="askTopic" v-model="form.topic">
            <option v-for="t in topics" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div class="field">
          <label for="askQuestion">Your question</label>
          <textarea
            id="askQuestion"
            v-model="form.question"
            rows="5"
            required
            maxlength="1000"
            placeholder="What's been sitting with you lately?"
          ></textarea>
        </div>

        <!-- honeypot -->
        <div class="field field--hp" aria-hidden="true">
          <label for="askWebsite">Website</label>
          <input id="askWebsite" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
        </div>

        <button class="btn btn--warm" type="submit" data-magnetic>Send it to Us &rarr;</button>
        <p class="ask__status" role="status" aria-live="polite">{{ status }}</p>
      </form>
    </div>

    <div v-if="ANSWERED_QUESTIONS.length" class="container ask__answered">
      <h3 class="ask__answered-title">Previously answered</h3>
      <ol class="answered-grid">
        <li v-for="(item, i) in ANSWERED_QUESTIONS" :key="i" class="answered-grid__item">
          <span class="answered-grid__num px" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <h4>&ldquo;{{ item.q }}&rdquo;</h4>
          <p><template v-if="item.episode">Answered in Ep. {{ String(item.episode).padStart(2, '0') }}. </template>{{ item.a }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
import { SITE, ANSWERED_QUESTIONS } from '~/data/site'

const topics = ['General', 'Confidence', 'Failure & fear', 'Relationships', 'Purpose', 'Self-love', 'Community']
const form = reactive({ name: '', topic: 'General', question: '', website: '' })
const status = ref('')

async function submit() {
  if (form.website) return /* honeypot */
  const question = form.question.trim()
  if (!question) {
    status.value = "Write your question first. It can be half formed, that's fine."
    return
  }

  /* Web3Forms (default) or a custom endpoint — both POST silently to the inbox */
  const endpoint = SITE.formEndpoint || (SITE.web3formsKey ? 'https://api.web3forms.com/submit' : '')
  if (endpoint) {
    status.value = 'Sending…'
    try {
      const payload = {
        name: form.name.trim() || 'Anonymous',
        topic: form.topic,
        question,
        /* Web3Forms fields: routes to SITE.email, sets a readable subject/body */
        access_key: SITE.web3formsKey,
        subject: `Ask Us — ${form.topic}`,
        from_name: form.name.trim() || 'UsWorldWide listener',
        message: (form.name ? `From: ${form.name.trim()}\n\n` : '') + question,
        botcheck: '',
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.success === false) throw new Error(data.message || 'HTTP ' + res.status)
      form.name = ''
      form.question = ''
      status.value = 'Got it. Thanks for handing Us a question. Welcome to the family.'
    } catch (e) {
      status.value = `That didn't go through. Try again, or email ${SITE.email} directly.`
    }
  } else {
    /* no endpoint configured yet — open a real email draft, never fake success */
    const subject = `Question for UsWorldWide — ${form.topic}`
    const body = (form.name ? `From: ${form.name.trim()}\n\n` : '') + question
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    status.value = `Opening your email app to send it, or write to ${SITE.email}.`
  }
}
</script>

<style scoped>
.ask { padding: clamp(100px, 14vh, 170px) 0; background: var(--bg-surface-2); }

.ask__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(40px, 6vw, 100px);
  align-items: start;
}
.ask__lead p:not(.eyebrow) { color: var(--text-muted); max-width: 48ch; }

.ask__form {
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: clamp(26px, 3.5vw, 40px);
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 20px;
}
.field { display: grid; gap: 8px; }
.field label { font-weight: 800; font-size: 14px; }
.field__opt { font-weight: 600; color: var(--text-muted); }
.field input,
.field select,
.field textarea {
  font: inherit;
  color: var(--text);
  background: var(--bg-surface-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 13px 16px;
  width: 100%;
}
.field textarea { resize: vertical; min-height: 120px; }
.field--hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

.ask__form .btn { justify-self: start; }
.ask__status { font-weight: 700; font-size: 15px; min-height: 1.5em; color: var(--text-muted); }

.ask__answered { margin-top: clamp(60px, 8vh, 100px); }
.ask__answered-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  margin-bottom: 40px;
}
.answered-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.answered-grid__num { display: block; font-size: 20px; color: var(--neutral-clay); opacity: 0.5; margin-bottom: 12px; }
.answered-grid__item h4 { font-family: var(--font-display); font-weight: 700; margin-bottom: 6px; }
.answered-grid__item p { color: var(--text-muted); }

@media (max-width: 899px) {
  .ask__grid, .answered-grid { grid-template-columns: 1fr; }
}
</style>
