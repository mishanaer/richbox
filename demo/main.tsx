import { render } from 'solid-js/web'
import { batch, createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { StatusIcon } from '../src/status-icon'
import { statusFrame, statusLabels, statusNames, statusTransition, waitingOffset } from '../src/status-icon-motion'
import { FluidControls } from './controls-host'
import './react/fluid.css'
import './theme.css'
import './style.css'

const starts = [0, 1, 4.3, 5.65, 7, 8.35, 9.7, 11.25, 12.6, 13.95]
const total = 15.3
function timelineFrame(time: number) {
  const index = Math.max(0, starts.findLastIndex(start => time >= start))
  if (index === 0) return statusFrame('dashed')
  const elapsed = (time - starts[index]) * 1000
  const source = { ...statusFrame(statusNames[index - 1]), offset: index === 2 ? -50 : 0 }
  const transition = statusTransition(source, statusNames[index])
  const frame = transition.sample(elapsed)
  return index === 1 && elapsed >= transition.duration
    ? { ...frame, offset: waitingOffset(elapsed - transition.duration) }
    : frame
}
function App() {
  const [selected, setSelected] = createSignal(0)
  const [time, setTime] = createSignal(0)
  const [playing, setPlaying] = createSignal(false)
  const [timeline, setTimeline] = createSignal(true)
  const [speed, setSpeed] = createSignal(1)
  const [dark, setDark] = createSignal(false)
  let raf = 0
  const stop = () => { cancelAnimationFrame(raf); setPlaying(false) }
  const sync = (t: number) => batch(() => {
    setTimeline(true)
    setTime(t)
    setSelected(Math.max(0, starts.findLastIndex(start => t >= start)))
  })
  const select = (index: number) => batch(() => {
    if (selected() === index && !timeline()) return
    stop()
    setTimeline(false)
    setSelected(index)
    setTime(index === 0 ? 0 : starts[index] + (index === 6 ? .55 : .35))
  })
  const play = () => {
    if (playing()) return stop()
    stop()
    setPlaying(true)
    const offset = time() >= total ? 0 : time()
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(total, offset + Math.max(0, now - start) / 1000 * speed())
      sync(t)
      if (t < total) raf = requestAnimationFrame(tick)
      else setPlaying(false)
    }
    raf = requestAnimationFrame(tick)
  }
  onCleanup(stop)
  createEffect(() => {
    document.documentElement.style.colorScheme = dark() ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', dark())
  })
  const sampled = createMemo(() => timeline() ? timelineFrame(time()) : undefined)
  const preview = <div class="glyph" data-state={selected()} style={{ width: '132px', transform: 'translate(-50%, -50%)' }}>
    <StatusIcon state={statusNames[selected()]} size={132} speed={speed()} frame={sampled()}/>
  </div>
  const items = statusNames.map((state, index) => ({ name: statusLabels[index], icon: <span class="mini"><StatusIcon state={state} size={22} animate={false} decorative/></span> as HTMLElement }))
  return <FluidControls preview={preview as HTMLElement} states={items} selected={selected()} dark={dark()} playing={playing()} time={time()} total={total} speed={speed()}
    onTheme={() => setDark(!dark())} onPlay={play} onReset={() => { stop(); sync(0) }}
    onSeek={value => { stop(); sync(value) }} onState={select}
    onSpeed={value => { stop(); setSpeed(value) }}/>
}
render(() => <App/>, document.getElementById('root')!)
