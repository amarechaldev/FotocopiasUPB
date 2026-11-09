import { useEffect, useRef } from 'react'

// Brings the whole page back to the top after a success or error message (#50): the
// message is the first thing in the form, and the header and the screen buttons above
// it come into view too.
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// The on-screen keyboard opens a moment after the tap (and the browser then scrolls the field
// only just into view): wait for it before moving the field to the top.
const KEYBOARD_DELAY_MS = 300

// A field at the top of the screen, so the list under it (names #56, descriptions #32) stays
// above the keyboard.
export function scrollToTopOfScreen(element: HTMLElement) {
  setTimeout(() => element.scrollIntoView({ block: 'start', behavior: 'smooth' }), KEYBOARD_DELAY_MS)
}

// A panel that opens in the middle of a long screen (the forms of the operator's lists): brought
// into view when it first appears, so what it says is not left off screen.
export function useScrolledIntoView<T extends HTMLElement>(block: ScrollLogicalPosition = 'start') {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ block, behavior: 'smooth' })
  }, [block])
  return ref
}
