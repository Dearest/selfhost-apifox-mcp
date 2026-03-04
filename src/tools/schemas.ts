import * as z from 'zod/v4';

export const httpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
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
    parameters: z
      .union([z.array(unknownRecordSchema), unknownRecordSchema])
      .optional(),
    requestBody: unknownRecordSchema.optional(),
    responses: z.array(unknownRecordSchema).optional(),
    responseChildren: z.array(unknownRecordSchema).optional(),
    responseExamples: z.array(unknownRecordSchema).optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    commonResponseStatus: z
      .union([z.array(unknownRecordSchema), unknownRecordSchema])
      .optional(),
    commonParameters: z
      .union([z.array(unknownRecordSchema), unknownRecordSchema])
      .optional(),
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
