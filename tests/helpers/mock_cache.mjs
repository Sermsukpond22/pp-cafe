// tests/helpers/mock_cache.mjs
export const revalidatedPaths = []

export function revalidatePath(path) {
  revalidatedPaths.push(path)
}

export function revalidateTag(tag) {
  // no-op
}
