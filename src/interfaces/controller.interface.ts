import { OpenAPIHono } from '@hono/zod-openapi'

export interface IController {
  controller: OpenAPIHono
  initRoutes(): void
}

export interface Routes {
  controller: OpenAPIHono
}
