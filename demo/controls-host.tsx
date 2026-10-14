import { createEffect, onMount, onCleanup } from 'solid-js'
import { mountControls, type LabControlsProps } from './react/controls'

export function FluidControls(props: LabControlsProps) {
  const host = document.createElement('div')
  let controls: ReturnType<typeof mountControls> | undefined
  onMount(() => {
    controls = mountControls(host, { ...props })
    onCleanup(() => controls?.dispose())
  })
  createEffect(() => { const next = { ...props }; controls?.update(next) })
  return host
}
