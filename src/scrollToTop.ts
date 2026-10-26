// Brings the whole page back to the top after a success or error message (#50): the
// message is the first thing in the form, and the header and the screen buttons above
// it come into view too.
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
