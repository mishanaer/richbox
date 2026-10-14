import { expect, test } from "bun:test"
import { createElement, Fragment } from "react"
import { renderToString } from "react-dom/server"
import { RichCheckbox } from "./rich-checkbox"

test("renders React markup on the server without browser globals", () => {
  const html = renderToString(createElement(RichCheckbox, { state: "warning", label: "Upload warning" }))
  expect(html).toContain('aria-label="Upload warning"')
  expect(html).toContain('role="img"')
  expect(html).not.toContain('stroke-width="undefined"')
})
test("instances have unique masks and decorative icons are hidden", () => {
  const html = renderToString(createElement(Fragment, null,
    createElement(RichCheckbox, { state: "cancelled", decorative: true }),
    createElement(RichCheckbox, { state: "done", label: "Done" })))
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  expect(ids).toHaveLength(4)
  expect(new Set(ids).size).toBe(4)
  expect(html).toContain('aria-hidden="true"')
})
