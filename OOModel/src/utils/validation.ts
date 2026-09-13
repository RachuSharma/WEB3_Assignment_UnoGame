export function validateIndex(index: unknown, bound: number, name: string): asserts index is number {
  if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= bound) {
    throw new Error(`Invalid ${name}: ${String(index)}`)
  }
}
