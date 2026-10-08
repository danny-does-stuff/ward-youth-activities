import { describe, expect, it } from 'vitest'
import { localDateTime, reinterpretUtcWallAsWard, wallDateTime } from './schedule'

describe('localDateTime', () => {
  it('stores 11:30 AM on a CDT morning as 16:30 UTC', () => {
    expect(localDateTime('2026-10-17', '11:30').toISOString()).toBe(
      '2026-10-17T16:30:00.000Z',
    )
  })

  it('stores 11:30 AM on a CST morning as 17:30 UTC', () => {
    expect(localDateTime('2026-01-15', '11:30').toISOString()).toBe(
      '2026-01-15T17:30:00.000Z',
    )
  })
})

describe('wallDateTime', () => {
  it('reads the Chicago clock back from a UTC instant', () => {
    expect(wallDateTime('2026-10-17T16:30:00.000Z')).toEqual({
      date: '2026-10-17',
      time: '11:30',
    })
  })
})

describe('reinterpretUtcWallAsWard', () => {
  it('treats a naive UTC wall clock as Chicago time', () => {
    expect(reinterpretUtcWallAsWard('2026-10-17T11:30:00.000Z')).toBe(
      '2026-10-17T16:30:00.000Z',
    )
  })
})
