export interface ApiErrorDetail {
  path: string;
  message: string;
}

interface ApiErrorOptions {
  details?: ApiErrorDetail[];
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    options?: ApiErrorOptions,
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;

    if (options?.details) {
      this.details = options.details;
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
