import type {
  ApifoxApiFullInput,
  HttpMethod,
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

type WriteMode = 'create' | 'update';

export interface PreparePayloadOptions {
  mode: WriteMode;
  apiId?: number;
}

const supportedMethodSet = new Set<string>([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
]);

const normalizeMethodForWrite = (method: unknown): HttpMethod => {
  if (typeof method !== 'string') {
    return 'get';
  }

  const normalized = method.trim().toLowerCase();
  if (!supportedMethodSet.has(normalized)) {
    return 'get';
  }

  return normalized as HttpMethod;
};

const withStringDefault = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }
  return value;
};

const withNumberDefault = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
};

export const prepareApiPayloadForWrite = (
  payload: ApifoxApiFullInput,
  options: PreparePayloadOptions,
): ApifoxApiFullInput => {
  const normalized: ApifoxApiFullInput = {
    ...payload,
    method: normalizeMethodForWrite(payload.method),
    type: withStringDefault(payload.type, 'http'),
    responseId: withNumberDefault(payload.responseId, 0),
    oasExtensions: withStringDefault(payload.oasExtensions, ''),
  };

  if (options.mode === 'create') {
    return {
      ...normalized,
      status: withStringDefault(payload.status, 'developing'),
      visibility: withStringDefault(payload.visibility, 'INHERITED'),
      serverId: withStringDefault(payload.serverId, ''),
      responsibleId: withNumberDefault(payload.responsibleId, 0),
    };
  }

  return {
    ...normalized,
    id: withNumberDefault(payload.id, withNumberDefault(options.apiId, 0)),
  };
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
