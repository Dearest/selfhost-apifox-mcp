export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options';

export type JsonObject = Record<string, unknown>;

export interface ApifoxParameter {
  name: string;
  in?: 'query' | 'path' | 'header' | 'cookie' | 'body';
  required?: boolean;
  description?: string;
  schema?: JsonObject;
  [key: string]: unknown;
}

export interface ApifoxParameterGroups {
  query?: ApifoxParameter[];
  path?: ApifoxParameter[];
  header?: ApifoxParameter[];
  cookie?: ApifoxParameter[];
  body?: ApifoxParameter[];
  [key: string]: unknown;
}

export type ApifoxParametersRaw = ApifoxParameter[] | ApifoxParameterGroups;

export interface ApifoxRequestBodyRaw {
  contentType?: string;
  jsonSchema?: JsonObject;
  [key: string]: unknown;
}

export interface ApifoxResponseRaw {
  statusCode?: number | string;
  code?: number | string;
  name?: string;
  description?: string;
  jsonSchema?: JsonObject;
  [key: string]: unknown;
}

export interface ApifoxApiDetailRaw extends JsonObject {
  id: number;
  name: string;
  path: string;
  method: string;
  description?: string;
  parameters?: ApifoxParametersRaw | string;
  requestBody?: ApifoxRequestBodyRaw | string;
  responses?: ApifoxResponseRaw[] | string;
  tags?: string[] | string;
  auth?: JsonObject | string;
}

export interface ApifoxApiFullInput extends JsonObject {
  name: string;
  path: string;
  method: HttpMethod;
  folderId?: number;
  deprecated?: boolean;
  description?: string;
  parameters?: ApifoxParametersRaw;
  requestBody?: ApifoxRequestBodyRaw;
  responses?: ApifoxResponseRaw[];
  responseChildren?: JsonObject[];
  responseExamples?: JsonObject[];
  tags?: string[] | string;
  commonResponseStatus?: JsonObject | JsonObject[];
  commonParameters?: JsonObject | JsonObject[];
  auth?: JsonObject;
  securityScheme?: JsonObject;
  advancedSettings?: JsonObject;
  mockScript?: JsonObject;
  codeSamples?: JsonObject[];
  preProcessors?: JsonObject[];
  postProcessors?: JsonObject[];
  inheritPreProcessors?: JsonObject;
  inheritPostProcessors?: JsonObject;
  customApiFields?: JsonObject;
}

export type FormValue = string | number | boolean;

export type SerializedFormPayload = Record<string, FormValue>;

export interface NormalizedParameter {
  name: string;
  required: boolean;
  description?: string;
  schema?: JsonObject;
}

export interface NormalizedRequest {
  pathParams: NormalizedParameter[];
  queryParams: NormalizedParameter[];
  headers: NormalizedParameter[];
  cookies: NormalizedParameter[];
  bodyContentType?: string;
  bodySchema?: JsonObject;
}

export interface NormalizedResponse {
  statusCode: number | string;
  name?: string;
  description?: string;
  schema?: JsonObject;
}

export interface NormalizedApiDetail {
  id: number;
  name: string;
  path: string;
  method: string;
  description?: string;
  request: NormalizedRequest;
  responses: NormalizedResponse[];
}

export interface ApifoxClient {
  getApiById(apiId: number): Promise<ApifoxApiDetailRaw>;
  listApiDetails(): Promise<ApifoxApiDetailRaw[]>;
  createApi(payload: ApifoxApiFullInput): Promise<ApifoxApiDetailRaw>;
  updateApi(
    apiId: number,
    payload: ApifoxApiFullInput,
  ): Promise<ApifoxApiDetailRaw | null>;
}
