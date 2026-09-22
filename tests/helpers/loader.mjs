import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const projectRoot = path.resolve('.')

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export default {};',
    }
  }

  if (specifier === 'next/headers') {
    return {
      shortCircuit: true,
      url: pathToFileURL(path.join(projectRoot, 'tests/helpers/mock_headers.mjs')).href,
    }
  }

  if (specifier === 'next/navigation') {
    return {
      shortCircuit: true,
      url: pathToFileURL(path.join(projectRoot, 'tests/helpers/mock_navigation.mjs')).href,
    }
  }

  if (specifier === 'next/cache') {
    return {
      shortCircuit: true,
      url: pathToFileURL(path.join(projectRoot, 'tests/helpers/mock_cache.mjs')).href,
    }
  }

  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2)
    let candidate = path.join(projectRoot, 'src', rel)
    if (!fs.existsSync(candidate)) {
      if (fs.existsSync(candidate + '.ts')) candidate = candidate + '.ts'
      else if (fs.existsSync(candidate + '.tsx')) candidate = candidate + '.tsx'
      else if (fs.existsSync(candidate + '.js')) candidate = candidate + '.js'
      else if (fs.existsSync(path.join(candidate, 'index.ts'))) candidate = path.join(candidate, 'index.ts')
    }
    return {
      shortCircuit: true,
      url: pathToFileURL(candidate).href,
    }
  }

  return nextResolve(specifier, context)
}
