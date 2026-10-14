/** @jsxImportSource react */
import { useRef, type ReactNode } from 'react'
import { Button } from './components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem } from './components/ui/select'
import { Slider } from './components/ui/slider'
import { FluidHoverHighlight } from './components/ui/fluid-hover-highlight'
import { useFluidHover, useRegisterFluidHoverItem, type UseFluidHoverReturn } from './hooks/use-fluid-hover'
import { useShape } from './lib/shape-context'

export type LabControlsProps = {
  preview: ReactNode
  states: { name: string; icon: ReactNode }[]
  selected: number
  dark: boolean
  playing: boolean
  time: number
  total: number
  speed: number
  onTheme: () => void
  onPlay: () => void
  onReset: () => void
  onSeek: (value: number) => void
  onState: (index: number) => void
  onSpeed: (value: number) => void
}
function StateButton(props: {
  state: LabControlsProps['states'][number]
  index: number
  selected: boolean
  onSelect: () => void
  registerItem: UseFluidHoverReturn['registerItem']
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useRegisterFluidHoverItem(props.registerItem, props.index, ref)
  return <Button ref={ref} variant="ghost" active={props.selected} aria-pressed={props.selected} onClick={props.onSelect} className="state-button">
    <span className="state-content"><div>{props.state.icon}</div><span>{props.state.name}</span></span>
  </Button>
}
export function Controls(props: LabControlsProps) {
  const list = useRef<HTMLDivElement>(null)
  const hover = useFluidHover(list, { axis: 'xy' })
  const shape = useShape()
  return <main>
    <section className="workspace">
      <div className="preview">
        <div className="stage">{props.preview}</div>
        <div className="transport">
          <Button variant="tertiary" className="play-button" onClick={props.onPlay}>{props.playing ? 'Pause' : 'Start'}</Button>
          <Button variant="tertiary" onClick={props.onReset}>Reset</Button>
          <div className="timeline-control"><Slider size="default" variant="scrubber" label="Timeline" value={props.time} min={0} max={props.total} step={1/30} formatValue={value => `${value.toFixed(2)} s`} onChange={value => props.onSeek(typeof value === 'number' ? value : value[0])}/></div>
        </div>
      </div>
      <aside aria-label="States">
        <div className="state-list" ref={list} {...hover.handlers}>
          <FluidHoverHighlight hover={hover} className={shape.bg}/>
          {props.states.map((state, index) => <StateButton key={state.name} state={state} index={index} selected={props.selected === index} onSelect={() => props.onState(index)} registerItem={hover.registerItem}/>)}
        </div>
        <div className="settings">
          <div className="setting-row">
            <Select value={String(props.speed)} onValueChange={value => props.onSpeed(Number(value))}>
              <SelectTrigger aria-label="Speed" className="w-full"/>
              <SelectContent>{[.25,.5,1,2].map((speed,index) => <SelectItem index={index} key={speed} value={String(speed)}>{`${speed}×`}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="tertiary" onClick={props.onTheme}>{props.dark ? 'Dark theme' : 'Light theme'}</Button>
          <Button variant="primary" asChild><a href="https://github.com/mishanaer/richbox" target="_blank" rel="noopener noreferrer">GitHub</a></Button>
        </div>
      </aside>
    </section>
  </main>
}