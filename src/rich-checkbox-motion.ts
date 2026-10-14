import { cubicBezier } from "motion"

export const statusNames = ["dashed", "waiting", "empty", "progress-25", "progress-50", "progress-75", "done", "cancelled", "error", "warning"] as const
export type StatusIconState = typeof statusNames[number]
export const statusLabels = ["Dashed", "Waiting", "Empty", "25%", "50%", "75%", "Done", "Cancelled", "Error", "Warning"]
export const statusColors = [
  "var(--deslop-primary-30, var(--accent-primary-30, #1111114D))", "var(--deslop-primary-30, var(--accent-primary-30, #1111114D))", "var(--deslop-primary-30, var(--accent-primary-30, #1111114D))",
  "var(--accent-yellow, #E6BD1F)", "var(--accent-yellow, #E6BD1F)", "var(--accent-green, #5EC257)",
  "var(--accent-blue, #4C92DE)", "var(--deslop-primary-60, var(--accent-primary-60, #11111199))", "var(--accent-red, #E36C5A)", "var(--accent-yellow, #E6BD1F)",
]
const shapes = [
  [33, 51, 44, 62, 44, 62, 68, 38],
  [38, 38, 62, 62, 38, 62, 62, 38],
  [18, 82, 50, 50, 50, 50, 82, 18],
  [50, 29, 50, 52, 50, 70, 50, 71],
]
export type StatusFrame = {
  points: number[]
  reveal: number[]
  colors: number[]
  fill: number
  dash: number
  gap: number
  offset: number
  scale: number
  stroke: number
}
export const clamp = (n: number) => Math.max(0, Math.min(1, n))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const blend = (a: number[], b: number[], t: number) => a.map((n, i) => mix(n, b[i], t))
export const spring = (n: number) => {
  const t = clamp(n)
  return (1 - (1 + 8 * t) * Math.exp(-8 * t)) / (1 - 9 * Math.exp(-8))
}
const easeInOut = cubicBezier(.42, 0, .58, 1)
function scaleAt(elapsed: number, initial: number) {
  if (elapsed < 150) return mix(initial, .9, easeInOut(clamp(elapsed / 150)))
  const t = clamp((elapsed - 150) / 150)
  const clock = t * t * (3 - 2 * t)
  return .9 + .1 * (1 - (1 + 3 * clock) * Math.exp(-3 * clock)) / (1 - 4 * Math.exp(-3))
}
export const waitingTurnDuration = 300
export const waitingPauseDuration = 1000
export const waitingCycleDuration = waitingTurnDuration + waitingPauseDuration
export function waitingOffset(elapsed: number) {
  if (elapsed <= waitingPauseDuration) return 0
  const phase = Math.max(0, elapsed - waitingPauseDuration)
  return -25 * (Math.floor(phase / waitingCycleDuration) % 4 + spring((phase % waitingCycleDuration) / waitingTurnDuration))
}
export function statusFrame(state: StatusIconState): StatusFrame {
  const index = statusNames.indexOf(state)
  return {
    points: shapes[Math.max(0, index - 6)].slice(),
    reveal: index >= 6 ? [1, 1] : [0, 0],
    colors: statusNames.map((_, i) => i === index ? 1 : 0),
    fill: index >= 3 && index <= 5 ? (index - 2) / 4 : 0,
    dash: index === 0 ? 8 : index === 1 ? 21 : 100,
    gap: index === 0 ? 4.5 : index === 1 ? 4 : 0,
    offset: 0,
    scale: 1,
    stroke: index === 8 ? 8.5 : 9,
  }
}
function interpolate(a: StatusFrame, b: StatusFrame, t: number): StatusFrame {
  return {
    points: blend(a.points, b.points, t), reveal: blend(a.reveal, b.reveal, t), colors: blend(a.colors, b.colors, t),
    fill: mix(a.fill, b.fill, t), dash: mix(a.dash, b.dash, t), gap: mix(a.gap, b.gap, t),
    // Keep segment positions fixed while their gaps close.
    offset: a.offset, scale: a.scale, stroke: mix(a.stroke, b.stroke, t),
  }
}
function erase(source: StatusFrame, amount: number) {
  const lengths = [0, 4].map(i => Math.max(.00001, Math.hypot(source.points[i + 2] - source.points[i], source.points[i + 3] - source.points[i + 1])))
  const removed = amount * (lengths[0] * source.reveal[0] + lengths[1] * source.reveal[1])
  return [
    Math.max(0, source.reveal[0] - Math.max(0, removed - lengths[1] * source.reveal[1]) / lengths[0]),
    Math.max(0, source.reveal[1] - removed / lengths[1]),
  ]
}
function draw(target: StatusFrame, amount: number) {
  const lengths = [0, 4].map(i => Math.hypot(target.points[i + 2] - target.points[i], target.points[i + 3] - target.points[i + 1]))
  const split = lengths[0] / (lengths[0] + lengths[1])
  return [clamp(amount / split), clamp((amount - split) / (1 - split))]
}
/** Capture a visible frame, never a state index: interrupted transitions stay continuous. */
export function statusTransition(source: StatusFrame, state: StatusIconState) {
  const target = statusFrame(state)
  const hasSymbol = source.reveal.some(n => n > 0)
  const toSymbol = target.reveal[0] === 1
  const filling = !hasSymbol && toSymbol && source.fill > 0
  const erasing = hasSymbol && !toSymbol
  const duration = filling || erasing ? 550 : 350
  return {
    duration,
    sample(elapsed: number): StatusFrame {
      if (elapsed <= 0) return source
      if (elapsed >= duration) return { ...target, offset: state === "waiting" ? 0 : source.offset }
      const p = spring((elapsed - 150) / 200)
      const scale = scaleAt(elapsed, source.scale)
      if (elapsed <= 150) return { ...source, scale }
      if (filling && elapsed < 350) return { ...source, fill: mix(source.fill, 1, p), scale }
      if (erasing && elapsed < 350) return { ...source, reveal: erase(source, p), scale }
      if (erasing) return { ...interpolate({ ...source, reveal: [0, 0] }, target, spring((elapsed - 350) / 200)), scale }
      if (toSymbol && !hasSymbol) {
        const amount = spring((elapsed - (filling ? 350 : 150)) / 200)
        return { ...interpolate(source, target, amount), points: target.points, fill: 0, reveal: draw(target, amount), scale }
      }
      return { ...interpolate(source, target, p), scale }
    },
  }
}
