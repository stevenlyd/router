import { eventHandler, getResponseHeaders, toWebRequest } from 'vinxi/http'
import { createMemoryHistory } from '@tanstack/react-router'
import { serializeLoaderData } from '../client/serialization'
import { mergeHeaders } from '../client/headers'
import type { EventHandler, EventHandlerRequest, H3Event } from 'vinxi/http'
import type { AnyRouter, Manifest } from '@tanstack/react-router'
import type { HandlerCallback } from './defaultStreamHandler'

export type CustomizeStartHandler<TRouter extends AnyRouter> = (
  cb: HandlerCallback<TRouter>,
) => EventHandler

export function createStartHandler<TRouter extends AnyRouter>({
  createRouter,
  getRouterManifest,
}: {
  createRouter: () => TRouter
  getRouterManifest?: () => Manifest
}): CustomizeStartHandler<TRouter> {
  return (cb) => {
    return eventHandler(async (event) => {
      const request = toWebRequest(event)

      const url = new URL(request.url)
      const href = url.href.replace(url.origin, '')

      // Create a history for the router
      const history = createMemoryHistory({
        initialEntries: [href],
      })

      const router = createRouter()

      // Inject a few of the SSR helpers and defaults
      router.serializeLoaderData = serializeLoaderData

      if (getRouterManifest) {
        router.manifest = getRouterManifest()
      }

      // Update the router with the history and context
      router.update({
        history,
      })

      await router.load()

      const responseHeaders = getRequestHeaders({
        event,
        router,
      })

      const response = await cb({
        request,
        router,
        responseHeaders,
      })

      return response
    })
  }
}

function getRequestHeaders(opts: {
  event: H3Event<EventHandlerRequest>
  router: AnyRouter
}): Headers {
  ;(opts.event as any).__tsrHeadersSent = true

  let headers = mergeHeaders(
    getResponseHeaders(opts.event),
    {
      'Content-Type': 'text/html; charset=UTF-8',
    },
    ...opts.router.state.matches.map((match) => {
      return match.headers
    }),
  )

  // Handle Redirects
  const { redirect } = opts.router.state

  if (redirect) {
    headers = mergeHeaders(headers, redirect.headers, {
      Location: redirect.href,
    })
  }

  return headers
}
