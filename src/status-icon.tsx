import { createEffect, createSignal, createUniqueId, onCleanup, onMount, untrack } from "solid-js"
import { statusColors, statusFrame, statusLabels, statusNames, statusTransition, waitingOffset, waitingTurnDuration, waitingPauseDuration, waitingCycleDuration, type StatusFrame, type StatusIconState } from "./status-icon-motion"

export type { StatusIconState, StatusFrame } from "./status-icon-motion"
export type StatusIconProps = {
  state: StatusIconState
  size?: number
  label?: string
  decorative?: boolean
  animate?: boolean
  /** Override the OS preference; omitted uses prefers-reduced-motion. */
  reducedMotion?: boolean
  speed?: number
  /** Optional externally sampled frame, for a scrubber or deterministic preview. */
  frame?: StatusFrame
}
const outline = "M50 5 C85 5 95 15 95 50 C95 85 85 95 50 95 C15 95 5 85 5 50 C5 15 15 5 50 5Z"
const inner = "M50 17 C77 17 83 23 83 50 C83 77 77 83 50 83 C23 83 17 77 17 50 C17 23 23 17 50 17Z"

/** Solid component. No global CSS, page mounting, React controls, or theme mutation. */
export function StatusIcon(props: StatusIconProps) {
  const id = createUniqueId()
  const [frame, setFrame] = createSignal(statusFrame(props.state))
  const [mounted, setMounted] = createSignal(false)
  const [systemReduced, setSystemReduced] = createSignal(false)
  const reduced = () => props.reducedMotion ?? systemReduced()
  onMount(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setSystemReduced(query.matches)
    update()
    query.addEventListener("change", update)
    setMounted(true)
    onCleanup(() => query.removeEventListener("change", update))
  })
  createEffect(() => {
    const state = props.state
    const external = props.frame
    const instant = reduced() || props.animate === false
    const speed = Math.max(.01, props.speed ?? 1)
    if (!mounted()) return
    if (external || instant) {
      setFrame(instant ? statusFrame(state) : external!)
      return
    }
    const source = untrack(frame)
    const transition = statusTransition(source, state)
    const settled = JSON.stringify(source) === JSON.stringify(statusFrame(state))
    const start = performance.now()
    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = () => {
      const elapsed = (performance.now() - start) * speed
      if (!settled && elapsed < transition.duration) {
        setFrame(transition.sample(elapsed))
        raf = requestAnimationFrame(tick)
        return
      }
      const waitingTime = elapsed - (settled ? 0 : transition.duration)
      setFrame({ ...statusFrame(state), offset: state === "waiting" ? waitingOffset(waitingTime) : 0 })
      if (state !== "waiting") return
      // Sleep through the one-second holds instead of running 60 idle frames/s.
      const phase = Math.max(0, waitingTime - waitingPauseDuration) % waitingCycleDuration
      if (waitingTime < waitingPauseDuration || phase >= waitingTurnDuration) {
        timer = setTimeout(tick, (waitingTime < waitingPauseDuration ? waitingPauseDuration - waitingTime : waitingCycleDuration - phase) / speed)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    if (!settled || state === "waiting") tick()
    onCleanup(() => { cancelAnimationFrame(raf); clearTimeout(timer) })
  })
  const color = () => {
    const entries = frame().colors.map((weight, i) => ({ weight, color: statusColors[i] })).filter(item => item.weight > 0)
    return entries.reduce((result, item, index) => {
      if (index === 0) return item.color
      const sum = entries.slice(0, index + 1).reduce((total, entry) => total + entry.weight, 0)
      return `color-mix(in srgb, ${result} ${(1 - item.weight / sum) * 100}%, ${item.color})`
    }, entries[0].color)
  }
  const wedge = () => {
    const p = Math.min(.99999, frame().fill)
    return `M50 50 L50 -50 A100 100 0 ${p > .5 ? 1 : 0} 1 ${50 + 100 * Math.sin(p * Math.PI * 2)} ${50 - 100 * Math.cos(p * Math.PI * 2)} Z`
  }
  const path = (i: number) => `M${frame().points[i]} ${frame().points[i + 1]} L${frame().points[i + 2]} ${frame().points[i + 3]}`
  return <svg data-status-icon="" viewBox="0 0 100 100" width={props.size ?? 24} height={props.size ?? 24}
    role={props.decorative ? undefined : "img"} aria-hidden={props.decorative ? true : undefined}
    aria-label={props.decorative ? undefined : props.label ?? statusLabels[statusNames.indexOf(props.state)]}
    style={{ display: "inline-block", "vertical-align": "middle", overflow: "visible", color: color(), transform: `scale(${frame().scale})`, "transform-origin": "center" }}>
    <defs><clipPath id={id}><path d={inner}/></clipPath></defs>
    <path data-outline="status" d={outline} fill="none" stroke="currentColor" stroke-width="8.5" stroke-linecap="round" pathLength="100" stroke-dasharray={`${frame().dash} ${frame().gap}`} stroke-dashoffset={frame().offset}/>
    <path data-fill="progress" data-progress={frame().fill} d={wedge()} clip-path={`url(#${id})`} fill="currentColor" opacity={frame().fill > 0 ? 1 : 0}/>
    <defs><mask id={`${id}-symbol`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style={{ "mask-type": "alpha" }}>
    <path data-mark="status" d={path(0)} fill="none" stroke="white" stroke-width={frame().stroke} stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset={1 - frame().reveal[0]} opacity={frame().reveal[0] > 0 ? 1 : 0}/>
    <path data-mark="symbol-second" d={path(4)} fill="none" stroke="white" stroke-width={frame().stroke} stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset={1 - frame().reveal[1]} opacity={frame().reveal[1] > 0 ? 1 : 0}/>
    </mask></defs>
    <rect data-symbol-layer="" x="0" y="0" width="100" height="100" fill="currentColor" mask={`url(#${id}-symbol)`}/>

  </svg>
}
