/* ============================================================================
   ItsUsWorldwide — content collections (the site's "CMS")

   Everything that grows over the seasons lives here. Add an episode, a
   written reflection, an answered listener question, or a whole season and
   the site re-renders it. When the project moves to a headless CMS, these
   objects ARE the content model.
   ========================================================================= */

export const SITE = {
  domain: 'itsusworldwide.com',
  email: 'its.us.worldwide@gmail.com',

  /* Web3Forms access key — the Ask Us form POSTs to Web3Forms, which forwards
     every submission straight to the `email` above. The key is public by
     design (safe in client code); it only routes mail to that inbox. */
  web3formsKey: '4f4d23c3-af7d-4cb2-9a9b-a8ab64ec88d0',

  /* Optional custom endpoint override (Formspree, a serverless function…).
     Left empty: the form uses Web3Forms above, falling back to an email draft
     only if the key is somehow missing. */
  formEndpoint: '',

  links: {
    spotify: 'https://open.spotify.com/show/36SlpX37TZbEJ6wCGDXRdu?si=c4a445ed0bbf45da',
    apple: 'https://podcasts.apple.com/us/podcast/itsusworldwide/id1768670730',
  },

  seasonGoal: 12,
}

/* ---------------------------------------------------------------------------
   SEASONS — the arc of the whole show. Discovery is live; the rest are the
   roadmap. `finale` marks the eventual continuing final season.
--------------------------------------------------------------------------- */
export const SEASONS = [
  {
    id: 'discovery',
    label: 'Season of Discovery',
    tagline: 'Twelve episodes about meeting yourself honestly.',
    status: 'now',
  },
  {
    id: 'love',
    label: 'Season of Love',
    tagline: 'The love we give ourselves and one another. Coming after the Season of Discovery.',
    status: 'upcoming',
  },
  {
    id: 'community',
    label: 'Season of Community',
    tagline: 'How we show up for each other. On the horizon.',
    status: 'upcoming',
  },
  {
    id: 'learning',
    label: 'Season of Learning',
    tagline: 'The continuing final season. Always growing, never finished.',
    status: 'finale',
  },
]

export const EPISODES = [
  {
    n: 1,
    season: 'discovery',
    status: 'published',
    title: 'Life is all about US!',
    dateLabel: 'Sept 15, 2024',
    runtime: '4 min',
    arc: 'Welcome to Us',
    desc: 'The manifesto episode: what “Us” means, and why this project begins with you.',
  },
  {
    n: 2,
    season: 'discovery',
    status: 'published',
    title: 'Fear of Failure',
    subtitle: 'A Season of Discovery',
    dateLabel: 'Sept 20, 2024',
    runtime: '9 min',
    arc: 'What am I afraid of?',
    desc: 'Reframing failure as development. The Season of Discovery begins.',
  },
  { n: 3, season: 'discovery', status: 'upcoming', arc: 'Who am I?' },
  { n: 4, season: 'discovery', status: 'upcoming', arc: 'What shaped me?' },
  { n: 5, season: 'discovery', status: 'upcoming', arc: 'What am I trying to prove?' },
  { n: 6, season: 'discovery', status: 'upcoming', arc: 'What do I value?' },
  { n: 7, season: 'discovery', status: 'upcoming', arc: 'How do I change?' },
  { n: 8, season: 'discovery', status: 'upcoming', arc: 'Still unfolding…' },
  { n: 9, season: 'discovery', status: 'upcoming', arc: 'Still unfolding…' },
  { n: 10, season: 'discovery', status: 'upcoming', arc: 'Still unfolding…' },
  { n: 11, season: 'discovery', status: 'upcoming', arc: 'Still unfolding…' },
  { n: 12, season: 'discovery', status: 'upcoming', arc: 'Still unfolding…' },
]

/* url: null renders a "coming soon" state. [PLACEHOLDER] scaffold entries. */
export const REFLECTIONS = [
  { title: 'Life is all about US, the longer version', episode: 1, readTime: '4 min read', url: null },
  { title: 'Failure is information, not identity', episode: 2, readTime: '6 min read', url: null },
]

/* Renders in Ask Us once entries exist.
   { q, from, episode, a } */
export const ANSWERED_QUESTIONS = []

/* The hero notification line, the site's bookend signature moment (5.7). */
export const HERO_MESSAGE = 'hello there, fellow human... take a moment to rest here'

/* The motion break line, split to flank the heart (left / right). */
export const BREAK_PHRASE = "Love isn't a one time thing, it's a daily habit"
export const BREAK_PHRASE_LEFT = "Love isn't a one time thing"
export const BREAK_PHRASE_RIGHT = "it's a daily habit."
