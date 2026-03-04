import * as z from 'zod/v4';

export const httpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);

const unknownRecordSchema = z.record(z.string(), z.unknown());

export const apifoxApiFullInputSchema = z
  .object({
    name: z.string().min(1),
    path: z.string().min(1),
    method: httpMethodSchema,
    folderId: z.int().optional(),
    deprecated: z.boolean().optional(),
    description: z.string().optional(),
    parameters: z.array(unknownRecordSchema).optional(),
    requestBody: unknownRecordSchema.optional(),
    responses: z.array(unknownRecordSchema).optional(),
    responseChildren: z.array(unknownRecordSchema).optional(),
    responseExamples: z.array(unknownRecordSchema).optional(),
    tags: z.array(z.string()).optional(),
    commonResponseStatus: z.array(unknownRecordSchema).optional(),
    commonParameters: z.array(unknownRecordSchema).optional(),
    auth: unknownRecordSchema.optional(),
    securityScheme: unknownRecordSchema.optional(),
    advancedSettings: unknownRecordSchema.optional(),
    mockScript: unknownRecordSchema.optional(),
    codeSamples: z.array(unknownRecordSchema).optional(),
    preProcessors: z.array(unknownRecordSchema).optional(),
    postProcessors: z.array(unknownRecordSchema).optional(),
    inheritPreProcessors: unknownRecordSchema.optional(),
    inheritPostProcessors: unknownRecordSchema.optional(),
    customApiFields: unknownRecordSchema.optional(),
  })
  .loose();
