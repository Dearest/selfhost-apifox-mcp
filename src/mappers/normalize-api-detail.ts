import type {
  ApifoxApiDetailRaw,
  ApifoxParameter,
  ApifoxParameterGroups,
  ApifoxRequestBodyRaw,
  ApifoxResponseRaw,
  JsonObject,
  NormalizedApiDetail,
  NormalizedParameter,
  NormalizedResponse,
} from '../types/apifox.js';

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parameterLocations = [
  'query',
  'path',
  'header',
  'cookie',
  'body',
] as const;

type ParameterLocation = (typeof parameterLocations)[number];

const isParameterLocation = (value: unknown): value is ParameterLocation =>
  typeof value === 'string' &&
  (parameterLocations as readonly string[]).includes(value);

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

const parseMaybeJsonArray = <T>(input: unknown): T[] => {
  const parsed = parseMaybeJson<unknown>(input, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed as T[];
};

const normalizeParameterCollection = (raw: unknown): ApifoxParameter[] => {
  const parsed = parseMaybeJson<unknown>(raw, []);

  if (Array.isArray(parsed)) {
    return parsed.filter(isRecord).map((item) => {
      const inValue = isParameterLocation(item.in) ? item.in : 'query';
      const name = typeof item.name === 'string' ? item.name : '';
      return {
        ...item,
        in: inValue,
        name,
      } as ApifoxParameter;
    });
  }

  if (!isRecord(parsed)) {
    return [];
  }

  const grouped = parsed as ApifoxParameterGroups;
  const result: ApifoxParameter[] = [];

  for (const location of parameterLocations) {
    const items = grouped[location];
    if (!Array.isArray(items)) {
      continue;
    }

    for (const item of items) {
      if (!isRecord(item)) {
        continue;
      }

      const inValue = isParameterLocation(item.in) ? item.in : location;
      const name = typeof item.name === 'string' ? item.name : '';
      result.push({
        ...item,
        in: inValue,
        name,
      } as ApifoxParameter);
    }
  }

  return result;
};

const normalizeParameter = (param: ApifoxParameter): NormalizedParameter => ({
  name: param.name,
  required: Boolean(param.required),
  description: typeof param.description === 'string' ? param.description : undefined,
  schema: isRecord(param.schema) ? param.schema : undefined,
});

const normalizeResponse = (response: ApifoxResponseRaw): NormalizedResponse => ({
  statusCode: response.statusCode ?? response.code ?? 'unknown',
  name: typeof response.name === 'string' ? response.name : undefined,
  description:
    typeof response.description === 'string' ? response.description : undefined,
  schema: isRecord(response.jsonSchema) ? response.jsonSchema : undefined,
});

export const normalizeApiDetail = (raw: ApifoxApiDetailRaw): NormalizedApiDetail => {
  const parameters = normalizeParameterCollection(raw.parameters);
  const requestBody = parseMaybeJson<ApifoxRequestBodyRaw | undefined>(
    raw.requestBody,
    undefined,
  );
  const responses = parseMaybeJsonArray<ApifoxResponseRaw>(raw.responses);

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
