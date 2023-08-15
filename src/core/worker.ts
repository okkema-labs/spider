import { Problem } from "./problem"

/**
 * @typedef {Object} Environment - Cloudflare Worker environment
 */
type Environment = Record<string, unknown>

/**
 * @typedef {Function} FetchEventHandler
 * @param {Request} request - HTTP request
 * @param {Environment} [environment] - Cloudflare Worker environment
 * @param {ExecutionContext} [context] - Cloudflare Worker execution context
 * @returns {(Response|Promise<Response>)}
 */
export type FetchEventHandler = (
  request: Request,
  environment?: Environment,
  context?: ExecutionContext,
) => Response | Promise<Response>

/**
 * @typedef {Function} ScheduledEventHandler
 * @param {ScheduledEvent} event - Scheduled event
 * @param {Environment} [environment] - Cloudflare Worker environment
 * @param {ExecutionContext} [context] - Cloudflare Worker execution context
 * @returns {(void|Promise<void>)}
 */
export type ScheduledEventHandler = (
  event: ScheduledEvent,
  environment?: Environment,
  context?: ExecutionContext,
) => void | Promise<void>

/**
 * @typedef {Function} ErrorHandler
 * @param {(Request|ScheduledEvent)} event - HTTP request or scheduled event depending on handler
 * @param {Error} error - Javascript error
 * @param {Environment} [environment] - Cloudflare Worker environment
 * @returns {Promise<boolean>} - Indicates whether the error was handled
 */
export type ErrorHandler = (
  event: Request | ScheduledEvent,
  error: Error,
  environment?: Environment,
) => Promise<boolean>

/**
 * @typedef {Object} Logger
 * @property {ErrorHandler} error
 */
export type Logger = {
  error: ErrorHandler
}

/**
 * @typedef {object} WorkerInit
 * @property {FetchEventHandler} [fetch] - Fetch event handler
 * @property {ScheduledEventHandler} [scheduled] - Scheduled event handler
 * @property {Logger} [logger]
 */
type WorkerInit = {
  fetch?: FetchEventHandler
  scheduled?: ScheduledEventHandler
  logger?: Logger
}

/**
 * @typedef {object} Worker
 * @property {FetchEventHandler} [fetch] - Fetch event handler
 * @property {ScheduledEventHandler} [scheduled] - Scheduled event handler
 */
type Worker = {
  fetch?: FetchEventHandler
  scheduled?: ScheduledEventHandler
}

export function Worker(init: WorkerInit): Worker {
  return {
    async fetch(request, environment, context) {
      let response: Response
      try {
        response = await init.fetch(request, environment)
      } catch (error) {
        if (init.logger)
          context.waitUntil(init.logger.error(request, error, environment))
        if (error instanceof Problem) response = error.response
        else response = new Response(error.message, { status: 500 })
      }
      return response
    },
    async scheduled(event, environment, context) {
      try {
        await init.scheduled(event, environment)
      } catch (error) {
        if (init.logger)
          context.waitUntil(init.logger.error(event, error, environment))
        throw error
      }
    },
  }
}
