import { prisma } from "@/lib/prisma";

type ErrorContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack ?? null,
      name: error.name,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
    stack: null,
    name: "UnknownError",
  };
}

export async function logServerError(
  error: unknown,
  options: {
    source: string;
    context?: ErrorContext;
  },
) {
  const serialized = serializeError(error);
  const payload = {
    source: options.source,
    message: serialized.message,
    stack: serialized.stack,
    context: options.context
      ? {
          ...options.context,
          errorName: serialized.name,
        }
      : { errorName: serialized.name },
  };

  try {
    await prisma.appErrorLog.create({
      data: payload,
    });
  } catch (loggingError) {
    console.error("Failed to write app error log", {
      loggingError,
      originalError: error,
      source: options.source,
      context: options.context,
    });
  }
}
