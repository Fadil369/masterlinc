export function nowMs(): number {
  // performance.now() is better in browser, but fall back safely.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perf = (globalThis as any).performance
  if (perf && typeof perf.now === 'function') return perf.now()
  return Date.now()
}
