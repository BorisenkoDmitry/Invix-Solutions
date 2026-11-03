import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { Window } from "happy-dom";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useDelayedLoading } from "../src/shared/hooks/use-delayed-loading";

const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
let act: typeof import("@testing-library/react").act;
let cleanup: typeof import("@testing-library/react").cleanup;
let renderHook: typeof import("@testing-library/react").renderHook;
before(async () => {
  ({ act, cleanup, renderHook } = await import("@testing-library/react"));
});
afterEach(() => cleanup());

test("quick requests finish without displaying an indicator", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const { result, rerender } = renderHook(
    ({ loading }) => useDelayedLoading(loading),
    { initialProps: { loading: false } },
  );
  act(() => rerender({ loading: true }));
  act(() => context.mock.timers.tick(249));
  assert.equal(result.current, false);
  act(() => rerender({ loading: false }));
  act(() => context.mock.timers.tick(1000));
  assert.equal(result.current, false);
});

test("slow requests show an indicator after the delay and hide immediately on completion", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const { result, rerender } = renderHook(
    ({ loading }) => useDelayedLoading(loading),
    { initialProps: { loading: true } },
  );
  assert.equal(result.current, false);
  act(() => context.mock.timers.tick(250));
  assert.equal(result.current, true);
  act(() => rerender({ loading: false }));
  assert.equal(result.current, false);
  act(() => rerender({ loading: true }));
  assert.equal(result.current, false);
  act(() => context.mock.timers.tick(250));
  assert.equal(result.current, true);
});

test("the delay can be changed or disabled for an already delayed parent", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const { result, rerender } = renderHook(
    ({ delay }) => useDelayedLoading(true, delay),
    { initialProps: { delay: 500 } },
  );
  act(() => context.mock.timers.tick(250));
  assert.equal(result.current, false);
  act(() => rerender({ delay: 0 }));
  assert.equal(result.current, true);
});

test("server rendering starts with the same hidden state as hydration", () => {
  function Probe() {
    const visible = useDelayedLoading(true);
    return createElement("span", null, visible ? "loading" : "waiting");
  }
  assert.equal(renderToString(createElement(Probe)), "<span>waiting</span>");
});
