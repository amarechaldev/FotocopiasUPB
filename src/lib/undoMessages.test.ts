import { describe, expect, test } from 'vitest'
import { expiredMessage, undoErrorStep, undoResultStep } from './undoMessages'

describe('undoResultStep', () => {
  test('undone: removed', () => {
    expect(undoResultStep(7, { kind: 'undone' })).toEqual({ kind: 'removed' })
  })

  test('wrong PIN: the attempts left, in Spanish singular and plural', () => {
    expect(undoResultStep(7, { kind: 'pin_wrong', attemptsLeft: 2 })).toEqual({
      kind: 'retry',
      message: 'PIN incorrecto. Le quedan 2 intentos.',
      unsure: false,
    })
    expect(undoResultStep(7, { kind: 'pin_wrong', attemptsLeft: 1 })).toMatchObject({
      message: 'PIN incorrecto. Le queda 1 intento.',
    })
  })

  test('third wrong PIN: closed, the entry stays saved', () => {
    expect(undoResultStep(7, { kind: 'pin_wrong', attemptsLeft: 0 })).toEqual({
      kind: 'closed',
      message:
        'PIN incorrecto 3 veces. El registro n.º 7 sigue guardado y ya no se puede deshacer. Si hay un error, avise a la encargada.',
    })
  })
})

describe('undoErrorStep', () => {
  test('already gone: removed', () => {
    expect(undoErrorStep(7, { message: 'entry_not_found' })).toEqual({ kind: 'removed' })
  })

  test('refusals close the prompt and say the entry is still saved', () => {
    for (const code of ['undo_locked', 'undo_too_late', 'account_invalid', 'pin_reset_pending']) {
      const step = undoErrorStep(7, { message: code })
      expect(step.kind).toBe('closed')
      expect(step.kind === 'closed' && step.message).toContain('El registro n.º 7 sigue guardado')
    }
  })

  test('no answer: unsure, try again', () => {
    expect(undoErrorStep(7, new TypeError('Failed to fetch'))).toEqual({
      kind: 'retry',
      message:
        'Sin respuesta (Sin conexión a internet): no sabemos si se deshizo. Toque «Deshacer registro» otra vez.',
      unsure: true,
    })
    expect(undoErrorStep(7, { message: 'AbortError: signal timed out' })).toMatchObject({ unsure: true })
  })
})

describe('expiredMessage', () => {
  test('says whether the entry is known to be saved', () => {
    expect(expiredMessage(7, false)).toContain('sigue guardado')
    expect(expiredMessage(7, true)).toBe(
      'No se pudo confirmar si el registro n.º 7 se deshizo. Avise a la encargada.',
    )
  })
})
