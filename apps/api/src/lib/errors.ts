export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function asErrorPayload(error: unknown) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          message: error.message,
          details: error.details ?? null,
        },
      },
    };
  }

  console.error(error);

  return {
    statusCode: 500,
    body: {
      error: {
        message: 'Internal server error',
        details: null,
      },
    },
  };
}
