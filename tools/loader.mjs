/* lets node:test import the vite-style extensionless modules in src/lib */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (err) {
    if (specifier.startsWith('.') && !/\.(js|json|css|mjs)$/.test(specifier)) {
      return next(specifier + '.js', context)
    }
    throw err
  }
}
