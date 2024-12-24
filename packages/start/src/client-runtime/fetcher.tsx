import {
  defaultTransformer,
  encode,
  isNotFound,
  isPlainObject,
  isRedirect,
} from '@tanstack/react-router'
import type { MiddlewareOptions } from '../client/createServerFn'

export async function fetcher(
  base: string,
  args: Array<any>,
  handler: (request: Request) => Promise<Response>,
) {
  const _first = args[0]

  // If createServerFn was used to wrap the fetcher,
  // We need to handle the arguments differently
  if (isPlainObject(_first) && _first.method) {
    const first = _first as MiddlewareOptions
    const type = first.data instanceof FormData ? 'formData' : 'payload'

    // Arrange the headers
    const headers = new Headers({
      ...(type === 'payload'
        ? {
            'content-type': 'application/json',
            accept: 'application/json',
          }
        : {}),
      ...(first.headers instanceof Headers
        ? Object.fromEntries(first.headers.entries())
        : first.headers || {}),
    })

    // If the method is GET, we need to move the payload to the query string
    if (first.method === 'GET') {
      // If the method is GET, we need to move the payload to the query string
      const encodedPayload = encode({
        payload: defaultTransformer.stringify({
          data: first.data,
          context: first.context,
        }),
      })

      if (encodedPayload) base += `&${encodedPayload}`
    }

    // Create the request
    const request = new Request(base, {
      method: first.method,
      headers,
      ...getFetcherRequestOptions(first),
    })

    const handlerResponse = await handler(request)

    const response = await handleResponseErrors(handlerResponse)

    // Check if the response is JSON
    if (response.headers.get('content-type')?.includes('application/json')) {
      // Even though the response is JSON, we need to decode it
      // because the server may have transformed it
      const json = defaultTransformer.decode(await response.json())

      // If the response is a redirect or not found, throw it
      // for the router to handle
      if (isRedirect(json) || isNotFound(json) || json instanceof Error) {
        throw json
      }

      return json
    }

    // Must be a raw response
    return response
  }

  // If not a custom fetcher, just proxy the arguments
  // through as a POST request
  const request = new Request(base, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  })

  const response = await handleResponseErrors(await handler(request))

  // If the response is JSON, return it parsed
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return defaultTransformer.decode(await response.json())
  } else {
    // Otherwise, return the text as a fallback
    // If the user wants more than this, they can pass a
    // request instead
    return response.text()
  }
}

function getFetcherRequestOptions(opts: MiddlewareOptions) {
  if (opts.method === 'POST') {
    if (opts.data instanceof FormData) {
      opts.data.set('__TSR_CONTEXT', defaultTransformer.stringify(opts.context))
      return {
        body: opts.data,
      }
    }

    return {
      body: defaultTransformer.stringify({
        data: opts.data ?? null,
        context: opts.context,
      }),
    }
  }

  return {}
}

async function handleResponseErrors(response: Response) {
  if (!response.ok) {
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    if (isJson) {
      throw defaultTransformer.decode(await response.json())
    }

    throw new Error(await response.text())
  }

  return response
}
