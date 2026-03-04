import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { LoginManagerLike } from '../auth/login.js';
import {
  prepareApiPayloadForWrite,
  serializeApiPayloadForForm,
  toFormUrlEncoded,
} from '../serializers/apifox-form-serializer.js';
import type {
  ApifoxApiDetailRaw,
  ApifoxApiFullInput,
  ApifoxClient,
} from '../types/apifox.js';

interface ApifoxEnvelope<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
}

interface RequestConfigLike {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, unknown>;
}

interface HttpRequestClientLike {
  request<T>(config: RequestConfigLike): Promise<{ data: T }>;
}

export interface PrivateApifoxClientOptions {
  axiosInstance?: HttpRequestClientLike;
  loginManager: LoginManagerLike;
  baseUrl: string;
  projectId: number;
  branchId: number;
  clientVersion: string;
  clientMode: string;
}

export class PrivateApifoxClient implements ApifoxClient {
  private readonly axiosInstance: HttpRequestClientLike;

  private readonly deviceId: string;

  public constructor(private readonly options: PrivateApifoxClientOptions) {
    this.axiosInstance = options.axiosInstance ?? axios.create();
    this.deviceId = uuidv4();
  }

  public async getApiById(apiId: number): Promise<ApifoxApiDetailRaw> {
    return this.requestWithAuth<ApifoxApiDetailRaw>((headers) => ({
      method: 'GET',
      url: `${this.options.baseUrl}/api/v1/projects/${this.options.projectId}/http-apis/${apiId}`,
      headers,
    }));
  }

  public async listApiDetails(): Promise<ApifoxApiDetailRaw[]> {
    return this.requestWithAuth<ApifoxApiDetailRaw[]>((headers) => ({
      method: 'GET',
      url: `${this.options.baseUrl}/api/v1/api-details`,
      headers,
    }));
  }

  public async createApi(payload: ApifoxApiFullInput): Promise<ApifoxApiDetailRaw> {
    const payloadWithDefaults = prepareApiPayloadForWrite(payload, {
      mode: 'create',
    });
    const serialized = serializeApiPayloadForForm(payloadWithDefaults);
    return this.requestWithAuth<ApifoxApiDetailRaw>((headers) => ({
      method: 'POST',
      url: `${this.options.baseUrl}/api/v1/api-details`,
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: toFormUrlEncoded(serialized),
    }));
  }

  public async updateApi(
    apiId: number,
    payload: ApifoxApiFullInput,
  ): Promise<ApifoxApiDetailRaw | null> {
    const payloadWithDefaults = prepareApiPayloadForWrite(payload, {
      mode: 'update',
      apiId,
    });
    const serialized = serializeApiPayloadForForm(payloadWithDefaults);
    return this.requestWithAuth<ApifoxApiDetailRaw | null>((headers) => ({
      method: 'PUT',
      url: `${this.options.baseUrl}/api/v1/api-details/${apiId}`,
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: toFormUrlEncoded(serialized),
    }));
  }

  private async requestWithAuth<T>(
    requestBuilder: (headers: Record<string, string>) => RequestConfigLike,
  ): Promise<T> {
    try {
      const token = await this.options.loginManager.getAccessToken(false);
      return await this.executeRequest<T>(requestBuilder, token);
    } catch (error) {
      const isUnauthorized =
        axios.isAxiosError(error) && error.response?.status === 401;

      if (!isUnauthorized) {
        throw error;
      }

      const refreshedToken = await this.options.loginManager.getAccessToken(true);
      return this.executeRequest<T>(requestBuilder, refreshedToken);
    }
  }

  private async executeRequest<T>(
    requestBuilder: (headers: Record<string, string>) => RequestConfigLike,
    token: string,
  ): Promise<T> {
    const headers = this.buildHeaders(token);
    const request = requestBuilder(headers);
    const response = await this.axiosInstance.request<ApifoxEnvelope<T>>(request);
    return this.unwrapEnvelope(response.data);
  }

  private unwrapEnvelope<T>(body: ApifoxEnvelope<T>): T {
    if (!body.success) {
      throw new Error(
        `Apifox API error: ${body.errorMessage ?? body.errorCode ?? 'unknown error'}`,
      );
    }

    if (body.data === undefined) {
      throw new Error('Apifox API error: response.data is undefined');
    }

    return body.data;
  }

  private buildHeaders(token: string): Record<string, string> {
    return {
      Authorization: token,
      'X-Device-Id': this.deviceId,
      'X-Project-Id': String(this.options.projectId),
      'X-Branch-Id': String(this.options.branchId),
      'X-Client-Version': this.options.clientVersion,
      'X-Client-Mode': this.options.clientMode,
      'Accept-Language': 'zh-CN',
    };
  }
}
