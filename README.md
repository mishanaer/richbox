# Rich Checkbox

An animated status indicator for React. Ten states, smooth transitions, and light and dark themes.

[Try the demo](https://mishanaer.github.io/rich-checkbox/)

## Run locally

Install [Bun](https://bun.sh), then run:

```sh
bun install
bun run dev
```

## Use the component

Copy `src/rich-checkbox.tsx` and `src/rich-checkbox-motion.ts` into your React app. Install `react` and `motion`.

```tsx
import { RichCheckbox } from './rich-checkbox'

<RichCheckbox state="waiting" size={24} label="Uploading" />
```

Change `state` to animate. This is a visual status indicator, not a form input. Available states:

`dashed`, `waiting`, `empty`, `progress-25`, `progress-50`, `progress-75`, `done`, `cancelled`, `error`, `warning`.

Use `label` for an accessible name, `decorative` next to descriptive text, or `animate={false}` for a static icon. Reduced motion follows the system setting.

The component uses Deslop color variables. For the demo palette, use `demo/tokens.css` and `demo/theme.css`; set `color-scheme` to `light` or `dark` in your app.

The component supports server rendering. It does not load the demo controls or change your page styles.

## Checks

```sh
bun test
bun run typecheck
bun run build
```

Colors: [Deslop](https://github.com/mishanaer/deslop). Demo controls: [Fluid Functionalism](https://www.fluidfunctionalism.com), with its original source and license in `demo/react`.
