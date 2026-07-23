export default defineNuxtConfig({
  compatibilityDate: '2026-07-07',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'ItsUsWorldwide — Welcome to Us',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'ItsUsWorldwide is a personal-growth project that begins with the individual and expands to community and society — expressed through the UsWorldWide podcast, hosted by Basie Comer. Welcome to Us.',
        },
        { name: 'theme-color', content: '#0E1A14' },
        { property: 'og:title', content: 'ItsUsWorldwide — Welcome to Us' },
        {
          property: 'og:description',
          content:
            'A personal-growth project that begins with you — and expands outward to the people around you, your community, and society.',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://itsusworldwide.com/' },
        { property: 'og:image', content: 'https://itsusworldwide.com/media/pixel-earth-poster.jpg' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&family=Press+Start+2P&display=swap',
        },
      ],
    },
  },
})
