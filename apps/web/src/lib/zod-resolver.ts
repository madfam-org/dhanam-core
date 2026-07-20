import { zodResolver as originalZodResolver } from '@hookform/resolvers/zod';

const normalizeZodError = (error: any) => {
  if (error && error.name === 'ZodError' && !error.errors && error.issues) {
    error.errors = error.issues;
  }
  return error;
};

export const zodResolver: typeof originalZodResolver = (
  schema: any,
  options?: any,
  factoryOptions?: any
) => {
  const wrappedSchema = Object.create(schema);

  wrappedSchema.parse = (values: any, opts?: any) => {
    try {
      return schema.parse(values, opts);
    } catch (error: any) {
      throw normalizeZodError(error);
    }
  };

  wrappedSchema.parseAsync = async (values: any, opts?: any) => {
    try {
      if (schema.parseAsync) return await schema.parseAsync(values, opts);
      return await schema.parse(values, opts);
    } catch (error: any) {
      throw normalizeZodError(error);
    }
  };

  wrappedSchema.safeParse = (values: any, opts?: any) => {
    const result = schema.safeParse(values, opts);
    if (!result.success && result.error && !result.error.errors && result.error.issues) {
      result.error.errors = result.error.issues;
    }
    return result;
  };

  wrappedSchema.safeParseAsync = async (values: any, opts?: any) => {
    const result = schema.safeParseAsync
      ? await schema.safeParseAsync(values, opts)
      : schema.safeParse(values, opts);
    if (!result.success && result.error && !result.error.errors && result.error.issues) {
      result.error.errors = result.error.issues;
    }
    return result;
  };

  return originalZodResolver(wrappedSchema as any, options, factoryOptions);
};
