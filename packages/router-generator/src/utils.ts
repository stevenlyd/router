import * as fs from 'node:fs'
import * as prettier from 'prettier'

export function multiSortBy<T>(
  arr: Array<T>,
  accessors: Array<(item: T) => any> = [(d) => d],
): Array<T> {
  return arr
    .map((d, i) => [d, i] as const)
    .sort(([a, ai], [b, bi]) => {
      for (const accessor of accessors) {
        const ao = accessor(a)
        const bo = accessor(b)

        if (typeof ao === 'undefined') {
          if (typeof bo === 'undefined') {
            continue
          }
          return 1
        }

        if (ao === bo) {
          continue
        }

        return ao > bo ? 1 : -1
      }

      return ai - bi
    })
    .map(([d]) => d)
}

export function cleanPath(path: string) {
  // remove double slashes
  return path.replace(/\/{2,}/g, '/')
}

export function trimPathLeft(path: string) {
  return path === '/' ? path : path.replace(/^\/{1,}/, '')
}

export function logging(config: { disabled: boolean }) {
  function stripEmojis(str: string) {
    return str.replace(
      /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
      '',
    )
  }

  function formatLogArgs(args: Array<any>): Array<any> {
    if (process.env.CI) {
      return args.map((arg) =>
        typeof arg === 'string' ? stripEmojis(arg) : arg,
      )
    }
    return args
  }

  return {
    log: (...args: Array<any>) => {
      if (!config.disabled) console.log(...formatLogArgs(args))
    },
    debug: (...args: Array<any>) => {
      if (!config.disabled) console.debug(...formatLogArgs(args))
    },
    info: (...args: Array<any>) => {
      if (!config.disabled) console.info(...formatLogArgs(args))
    },
    warn: (...args: Array<any>) => {
      if (!config.disabled) console.warn(...formatLogArgs(args))
    },
    error: (...args: Array<any>) => {
      if (!config.disabled) console.error(...formatLogArgs(args))
    },
  }
}

export function removeLeadingSlash(path: string): string {
  return path.replace(/^\//, '')
}

export function removeTrailingSlash(s: string) {
  return s.replace(/\/$/, '')
}

export function determineInitialRoutePath(routePath: string) {
  return cleanPath(`/${routePath.split('.').join('/')}`) || ''
}

export function replaceBackslash(s: string) {
  return s.replaceAll(/\\/gi, '/')
}

export function routePathToVariable(routePath: string): string {
  return (
    removeUnderscores(routePath)
      ?.replace(/\/\$\//g, '/splat/')
      .replace(/\$$/g, 'splat')
      .replace(/\$/g, '')
      .split(/[/-]/g)
      .map((d, i) => (i > 0 ? capitalize(d) : d))
      .join('')
      .replace(/([^a-zA-Z0-9]|[.])/gm, '')
      .replace(/^(\d)/g, 'R$1') ?? ''
  )
}

export function removeUnderscores(s?: string) {
  return s?.replaceAll(/(^_|_$)/gi, '').replaceAll(/(\/_|_\/)/gi, '/')
}

export function capitalize(s: string) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function removeExt(d: string, keepExtension: boolean = false) {
  return keepExtension ? d : d.substring(0, d.lastIndexOf('.')) || d
}

/**
 * This function writes to a file if the content is different.
 *
 * @param filepath The path to the file
 * @param prettierOptions Prettier options
 * @param content Original content
 * @param incomingContent New content
 * @param callbacks Callbacks to run before and after writing
 * @returns Whether the file was written
 */
export async function writeIfDifferent(
  filepath: string,
  prettierOptions: prettier.Options,
  content: string,
  incomingContent: string,
  callbacks?: { beforeWrite?: () => void; afterWrite?: () => void },
): Promise<boolean> {
  const [formattedContent, updatedContent] = await Promise.all([
    prettier.format(content, prettierOptions),
    prettier.format(incomingContent, prettierOptions),
  ])

  if (formattedContent !== updatedContent) {
    callbacks?.beforeWrite?.()
    fs.writeFileSync(filepath, updatedContent)
    callbacks?.afterWrite?.()
    return true
  }

  return false
}

export const formatURLComponent = (component: string) =>
  component.replace(/[_\s]+/g, '-').toLowerCase()

export const formatOracleFormPath = <TPath extends string | undefined>(
  originalPath: TPath,
): TPath | string => {
  if (!originalPath) {
    return originalPath
  }

  const match = originalPath.match(/^(.*)\[(\w+)\](.*)?/)

  if (match) {
    const basePath = match[1] || ''
    const oracleFormName = match[2]
    const title = match[3] || ''
    return `${basePath}${oracleFormName}${title ? `-${formatURLComponent(title)}` : ''}`
  }

  return originalPath
}

export const oracleFormNameToTitle = (input: string) =>
  input.replace(/[-_]/g, ' ').replace(/\b(\w)/g, (char) => char.toUpperCase())
