/* Thin accessor for the client-only scroll engine plugin.
   Returns null during SSR — components must guard (they animate in
   onMounted, which only runs client-side, so this is naturally safe). */
export function useScrollEngine() {
  if (import.meta.server) return null
  return useNuxtApp().$scroll || null
}
