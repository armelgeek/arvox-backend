export interface IUseCase<TParams = any, TResponse = any> {
  execute(params: TParams): Promise<TResponse>
  log?(): string
  logActivity?(userId: string): Promise<void>
  run?(params: TParams & { currentUserId?: string }): Promise<TResponse>
}
