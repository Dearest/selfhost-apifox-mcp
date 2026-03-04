import type {
  ApifoxApiFullInput,
  FormValue,
  JsonObject,
  SerializedFormPayload,
} from '../types/apifox.js';

const jsonFields = new Set<string>([
  'parameters',
  'requestBody',
  'responses',
  'responseChildren',
  'responseExamples',
  'tags',
  'commonResponseStatus',
  'commonParameters',
  'auth',
  'securityScheme',
  'advancedSettings',
  'mockScript',
  'codeSamples',
  'preProcessors',
  'postProcessors',
  'inheritPreProcessors',
  'inheritPostProcessors',
  'customApiFields',
]);

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeRequestBody = (requestBody: unknown): unknown => {
  if (!isRecord(requestBody)) {
    return requestBody;
  }

  const copied: JsonObject = { ...requestBody };
  const jsonSchema = copied.jsonSchema;

  // requestBody.jsonSchema 在私有接口中需要稳定的 JSON 字段形态
  if (isRecord(jsonSchema)) {
    copied.jsonSchema = jsonSchema;
  }

  return copied;
};

export const serializeApiPayloadForForm = (
  payload: ApifoxApiFullInput,
): SerializedFormPayload => {
  const result: SerializedFormPayload = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (jsonFields.has(key)) {
      const normalizedValue =
        key === 'requestBody' ? normalizeRequestBody(value) : value;
      result[key] = JSON.stringify(normalizedValue);
      continue;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value;
      continue;
    }

    result[key] = JSON.stringify(value);
  }

  return result;
};

export const toFormUrlEncoded = (
  payload: SerializedFormPayload,
): URLSearchParams => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    params.set(key, String(value));
  }
  return params;
};
