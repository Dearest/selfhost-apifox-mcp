import type {
  ApifoxApiDetailRaw,
  ApifoxParameter,
  ApifoxRequestBodyRaw,
  ApifoxResponseRaw,
  JsonObject,
  NormalizedApiDetail,
  NormalizedParameter,
  NormalizedResponse,
} from '../types/apifox.js';

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseMaybeJson = <T>(input: unknown, fallback: T): T => {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as unknown;
      return (parsed as T) ?? fallback;
    } catch {
      return fallback;
    }
  }

  if (input === undefined || input === null) {
    return fallback;
  }

  return input as T;
};

const normalizeParameter = (param: ApifoxParameter): NormalizedParameter => ({
  name: param.name,
  required: Boolean(param.required),
  description: typeof param.description === 'string' ? param.description : undefined,
  schema: isRecord(param.schema) ? param.schema : undefined,
});

const normalizeResponse = (response: ApifoxResponseRaw): NormalizedResponse => ({
  statusCode: response.statusCode,
  name: typeof response.name === 'string' ? response.name : undefined,
  description:
    typeof response.description === 'string' ? response.description : undefined,
  schema: isRecord(response.jsonSchema) ? response.jsonSchema : undefined,
});

export const normalizeApiDetail = (raw: ApifoxApiDetailRaw): NormalizedApiDetail => {
  const parameters = parseMaybeJson<ApifoxParameter[]>(raw.parameters, []);
  const requestBody = parseMaybeJson<ApifoxRequestBodyRaw | undefined>(
    raw.requestBody,
    undefined,
  );
  const responses = parseMaybeJson<ApifoxResponseRaw[]>(raw.responses, []);

  const queryParams = parameters
    .filter((item) => item.in === 'query')
    .map(normalizeParameter);
  const pathParams = parameters
    .filter((item) => item.in === 'path')
    .map(normalizeParameter);
  const headers = parameters
    .filter((item) => item.in === 'header')
    .map(normalizeParameter);
  const cookies = parameters
    .filter((item) => item.in === 'cookie')
    .map(normalizeParameter);

  return {
    id: raw.id,
    name: raw.name,
    path: raw.path,
    method: String(raw.method).toUpperCase(),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    request: {
      pathParams,
      queryParams,
      headers,
      cookies,
      bodyContentType:
        requestBody && typeof requestBody.contentType === 'string'
          ? requestBody.contentType
          : undefined,
      bodySchema:
        requestBody && isRecord(requestBody.jsonSchema)
          ? requestBody.jsonSchema
          : undefined,
    },
    responses: responses.map(normalizeResponse),
  };
};
