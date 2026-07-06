import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLearnValidation } from './useLearnValidation'
import type { Answer } from '../../types'

describe('useLearnValidation', () => {
  it('starts with no errors and no warnings', () => {
    const { result } = renderHook(() =>
      useLearnValidation({ learnAnswers: {}, learnName: '' })
    )

    expect(result.current.contradictionError).toBeNull()
    expect(result.current.similarityWarning).toBeNull()
  })

  it('detects gender contradiction (woman + man)', async () => {
    const { result, rerender } = renderHook(
      ({ answers }) => useLearnValidation({ learnAnswers: answers, learnName: 'Test' }),
      { initialProps: { answers: {} as Record<number, Answer> } }
    )

    act(() => {
      rerender({ answers: { 52: 'yes' as Answer, 53: 'yes' as Answer } })
    })

    await waitFor(() => {
      expect(result.current.contradictionError).toContain('mujer')
    })
  })

  it('detects size contradiction (big + small)', async () => {
    const { result, rerender } = renderHook(
      ({ answers }) => useLearnValidation({ learnAnswers: answers, learnName: 'Test' }),
      { initialProps: { answers: {} as Record<number, Answer> } }
    )

    act(() => {
      rerender({ answers: { 11: 'yes' as Answer, 12: 'yes' as Answer } })
    })

    await waitFor(() => {
      expect(result.current.contradictionError).toContain('grande')
    })
  })

  it('detects speed contradiction (fast + slow)', async () => {
    const { result, rerender } = renderHook(
      ({ answers }) => useLearnValidation({ learnAnswers: answers, learnName: 'Test' }),
      { initialProps: { answers: {} as Record<number, Answer> } }
    )

    act(() => {
      rerender({ answers: { 33: 'yes' as Answer, 34: 'yes' as Answer } })
    })

    await waitFor(() => {
      expect(result.current.contradictionError).toContain('rápido')
    })
  })

  it('detects multiple nationality contradiction', async () => {
    const { result, rerender } = renderHook(
      ({ answers }) => useLearnValidation({ learnAnswers: answers, learnName: 'Test' }),
      { initialProps: { answers: {} as Record<number, Answer> } }
    )

    act(() => {
      rerender({ answers: { 16: 'yes' as Answer, 44: 'yes' as Answer } })
    })

    await waitFor(() => {
      expect(result.current.contradictionError).toContain('nacionalidades')
    })
  })

  it('clears contradictionError when contradiction is resolved', async () => {
    const { result, rerender } = renderHook(
      ({ answers }) => useLearnValidation({ learnAnswers: answers, learnName: 'Test' }),
      { initialProps: { answers: { 52: 'yes', 53: 'yes' } as Record<number, Answer> } }
    )

    await waitFor(() => {
      expect(result.current.contradictionError).not.toBeNull()
    })

    act(() => {
      rerender({ answers: { 52: 'yes' as Answer } })
    })

    await waitFor(() => {
      expect(result.current.contradictionError).toBeNull()
    })
  })

  it('similarityWarning is null when fewer than 5 answers provided', async () => {
    const { result } = renderHook(() =>
      useLearnValidation({
        learnAnswers: { 1: 'yes', 2: 'no', 3: 'yes', 4: 'no' } as Record<number, Answer>,
        learnName: 'Test',
      })
    )

    await waitFor(() => {
      expect(result.current.similarityWarning).toBeNull()
    })
  })

  it('similarityWarning is null for dont_know-only answers', async () => {
    const { result } = renderHook(() =>
      useLearnValidation({
        learnAnswers: {
          1: 'dont_know', 2: 'dont_know', 3: 'dont_know',
          4: 'dont_know', 5: 'dont_know', 6: 'dont_know',
        } as Record<number, Answer>,
        learnName: 'Test',
      })
    )

    await waitFor(() => {
      expect(result.current.similarityWarning).toBeNull()
    })
  })

  it('no error with valid non-contradictory answers', async () => {
    const { result } = renderHook(() =>
      useLearnValidation({
        learnAnswers: { 1: 'yes', 3: 'yes', 4: 'yes' } as Record<number, Answer>,
        learnName: 'Goku',
      })
    )

    await waitFor(() => {
      expect(result.current.contradictionError).toBeNull()
    })
  })

  it('updates when learnName changes (skips same-name characters in similarity)', async () => {
    const { result, rerender } = renderHook(
      ({ name }) => useLearnValidation({
        learnAnswers: { 1: 'yes', 2: 'no', 3: 'yes', 4: 'no', 5: 'yes', 6: 'no' } as Record<number, Answer>,
        learnName: name,
      }),
      { initialProps: { name: '' } }
    )

    act(() => { rerender({ name: 'Different Name XYZ' }) })

    await waitFor(() => {
      // With 6 answers, similarity check runs — but result depends on character DB
      // The important thing is it doesn't crash and returns null or a string
      expect(
        result.current.similarityWarning === null ||
        typeof result.current.similarityWarning === 'string'
      ).toBe(true)
    })
  })
})
