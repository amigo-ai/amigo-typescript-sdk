export class AmigoError extends Error {}

export class HttpError extends AmigoError {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`HTTP ${status}`)
  }
}

export class AuthError extends AmigoError {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
