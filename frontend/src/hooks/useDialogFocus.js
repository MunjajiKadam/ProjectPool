import { useEffect, useRef } from 'react'

export function useDialogFocus(onClose, modal = true) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = () => [...dialog.querySelectorAll(selector)].filter((element) => element.offsetParent !== null && getComputedStyle(element).visibility !== 'hidden')
    if (modal) {
      document.body.style.overflow = 'hidden'
      ;(focusable()[0] || dialog).focus()
    } else dialog.focus({ preventScroll: true })

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements.at(-1)
      if (!first || !last) { event.preventDefault(); dialog.focus(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }

    if (modal) document.addEventListener('keydown', handleKeyDown)
    return () => {
      if (modal) {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = previousOverflow
      }
      if (modal && previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [modal])

  return dialogRef
}