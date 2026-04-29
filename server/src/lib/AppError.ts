// We extend the built-in Error class to add our own statusCode field
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    // super() calls the parent Error constructor with the msg
    // this is what sets the .message property on the error
    super(message);

    this.statusCode = statusCode;

    // This fixes the prototype chain on Typerscript when extending built-in classes
    // Without this, instance of checks like "err instanceof AppError" would fail
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
