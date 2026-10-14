import { describe, expect, test } from "bun:test"
import { richboxFrame, richboxStates, richboxTransition, waitingOffset } from "./richbox-motion"

describe("Richbox transitions", () => {
  test("holds the visible state during scale-down, then morphs", () => {
    const source = richboxFrame("done")
    const transition = richboxTransition(source, "warning")
    expect(transition.sample(149).points).toEqual(source.points)
    expect(transition.sample(150).scale).toBe(.9)
    expect(transition.sample(220).points).not.toEqual(source.points)
    expect(transition.sample(350)).toEqual(richboxFrame("warning"))
  })
  test("interrupted morphs preserve geometry, color, trim and scale at the next start", () => {
    for (const state of richboxStates) {
      const interrupted = richboxTransition(richboxFrame("done"), "warning").sample(220)
      const next = richboxTransition(interrupted, state)
      expect(next.sample(0)).toEqual(interrupted)
      expect(next.sample(100).points).toEqual(interrupted.points)
      expect(next.sample(100).colors).toEqual(interrupted.colors)
      expect(next.sample(100).reveal).toEqual(interrupted.reveal)
      expect(next.sample(next.duration)).toEqual(richboxFrame(state))
    }
  })
  test("warning top moves toward the upper-right end of error", () => {
    const transition = richboxTransition(richboxFrame("warning"), "error")
    const middle = transition.sample(220)
    expect(middle.points[0]).toBeGreaterThan(50)
    expect(middle.points[1]).toBeLessThan(29)
    expect(middle.points[6]).toBeLessThan(50)
    expect(middle.points[7]).toBeGreaterThan(71)
    expect(transition.sample(350)).toEqual(richboxFrame("error"))
  })
  test("symbol exit opens dashed gaps in place without changing the period", () => {
    for (const from of ["warning", "done", "cancelled", "error"] as const) {
      for (const to of ["dashed", "waiting"] as const) {
        const source = { ...richboxFrame(from), offset: -12 }
        const transition = richboxTransition(source, to)
        const target = richboxFrame(to)
        for (const time of [360, 400, 450, 500, 549]) {
          const frame = transition.sample(time)
          expect(frame.dash + frame.gap).toBeCloseTo(target.dash + target.gap)
          expect(frame.offset).toBe(-12)
        }
      }
    }
  })
  test("partial drawing and erasing can be retargeted without a flash", () => {
    for (const [from, to] of [["empty", "cancelled"], ["warning", "empty"], ["progress-25", "done"]] as const) {
      const interrupted = richboxTransition(richboxFrame(from), to).sample(230)
      for (const state of richboxStates) expect(richboxTransition(interrupted, state).sample(0)).toEqual(interrupted)
    }
  })
  test("progress completes for 200ms before the 200ms symbol drawing", () => {
    const transition = richboxTransition(richboxFrame("progress-75"), "done")
    expect(transition.duration).toBe(550)
    expect(transition.sample(349).fill).toBeGreaterThan(.999)
    expect(transition.sample(349).reveal).toEqual([0, 0])
    expect(transition.sample(400).reveal[0]).toBeGreaterThan(0)
    expect(transition.sample(550)).toEqual(richboxFrame("done"))
  })
  test("symbol exit trims the second stroke before the first", () => {
    const transition = richboxTransition(richboxFrame("cancelled"), "empty")
    const early = transition.sample(175)
    expect(early.reveal[0]).toBe(1)
    expect(early.reveal[1]).toBeLessThan(1)
  })
  test("all state pairs end exactly at their target with finite values", () => {
    for (const from of richboxStates) for (const to of richboxStates) {
      const transition = richboxTransition(richboxFrame(from), to)
      for (let time = 0; time <= transition.duration; time += 10) {
        const frame = transition.sample(time)
        expect(Object.values(frame).flat().every(Number.isFinite)).toBe(true)
        expect(frame.colors.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1)
      }
      expect(transition.sample(transition.duration)).toEqual(richboxFrame(to))
    }
  })
  test("waiting holds one second and turns for 300ms, twice", () => {
    expect(waitingOffset(999)).toBe(0)
    expect(waitingOffset(1075)).toBeLessThan(0)
    expect(waitingOffset(1150)).toBeGreaterThan(-25)
    expect(waitingOffset(1300)).toBe(-25)
    expect(waitingOffset(2299)).toBe(-25)
    expect(waitingOffset(2450)).toBeGreaterThan(-50)
    expect(waitingOffset(2600)).toBe(-50)
    expect(waitingOffset(3599)).toBe(-50)
  })
})
