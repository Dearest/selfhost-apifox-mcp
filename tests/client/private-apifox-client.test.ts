import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { describe, expect, it, vi } from 'vitest';
import { PrivateApifoxClient } from '../../src/client/private-apifox-client.js';
import type { LoginManagerLike } from '../../src/auth/login.js';
import type { ApifoxApiFullInput } from '../../src/types/apifox.js';

describe('PrivateApifoxClient', () => {
  it('请求自动带上鉴权与分支头', async () => {
    const instance = axios.create();
    const mock = new MockAdapter(instance as unknown as ConstructorParameters<typeof MockAdapter>[0]);

    mock.onGet('https://api.dev.longbridge-inc.com/api/v1/projects/345101/http-apis/1').reply(200, {
      success: true,
      data: {
        id: 1,
        name: '查询用户',
        path: '/users/{id}',
        method: 'GET',
      },
    });

    const loginManager: LoginManagerLike = {
      getAccessToken: vi.fn(async () => 'token-abc'),
    };

    const client = new PrivateApifoxClient({
      axiosInstance: instance,
      baseUrl: 'https://api.dev.longbridge-inc.com',
      projectId: 345101,
      branchId: 0,
      clientVersion: '2.7.2',
      clientMode: 'web',
      loginManager,
    });

    const data = await client.getApiById(1);

    expect(data.id).toBe(1);
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0]?.headers?.Authorization).toBe('token-abc');
    expect(mock.history.get[0]?.headers?.['X-Project-Id']).toBe('345101');
    expect(mock.history.get[0]?.headers?.['X-Branch-Id']).toBe('0');
  });

  it('401 时强制刷新 token 后重试一次', async () => {
    const instance = axios.create();
    const mock = new MockAdapter(instance as unknown as ConstructorParameters<typeof MockAdapter>[0]);

    mock
      .onGet('https://api.dev.longbridge-inc.com/api/v1/projects/345101/http-apis/1')
      .replyOnce(401, { success: false });
    mock
      .onGet('https://api.dev.longbridge-inc.com/api/v1/projects/345101/http-apis/1')
      .replyOnce(200, {
        success: true,
        data: {
          id: 1,
          name: '查询用户',
          path: '/users/{id}',
          method: 'GET',
        },
      });

    const getAccessToken = vi
      .fn<(forceRefresh?: boolean) => Promise<string>>()
      .mockResolvedValueOnce('token-old')
      .mockResolvedValueOnce('token-new');

    const loginManager: LoginManagerLike = {
      getAccessToken,
    };

    const client = new PrivateApifoxClient({
      axiosInstance: instance,
      baseUrl: 'https://api.dev.longbridge-inc.com',
      projectId: 345101,
      branchId: 0,
      clientVersion: '2.7.2',
      clientMode: 'web',
      loginManager,
    });

    const data = await client.getApiById(1);

    expect(data.id).toBe(1);
    expect(getAccessToken).toHaveBeenNthCalledWith(1, false);
    expect(getAccessToken).toHaveBeenNthCalledWith(2, true);
    expect(mock.history.get).toHaveLength(2);
    expect(mock.history.get[1]?.headers?.Authorization).toBe('token-new');
  });

  it('updateApi 支持 success=true 且 data=null 的返回', async () => {
    const instance = axios.create();
    const mock = new MockAdapter(
      instance as unknown as ConstructorParameters<typeof MockAdapter>[0],
    );

    mock
      .onPut('https://api.dev.longbridge-inc.com/api/v1/api-details/3474867')
      .replyOnce(200, {
        success: true,
        data: null,
      });

    const loginManager: LoginManagerLike = {
      getAccessToken: vi.fn(async () => 'token-abc'),
    };

    const client = new PrivateApifoxClient({
      axiosInstance: instance,
      baseUrl: 'https://api.dev.longbridge-inc.com',
      projectId: 345101,
      branchId: 0,
      clientVersion: '2.7.2',
      clientMode: 'web',
      loginManager,
    });

    const payload: ApifoxApiFullInput = {
      name: 'Find pet by ID',
      path: '/pet/{petId}',
      method: 'GET',
    };

    const data = await client.updateApi(3474867, payload);

    expect(data).toBeNull();
    expect(mock.history.put).toHaveLength(1);
    expect(mock.history.put[0]?.headers?.Authorization).toBe('token-abc');
    expect(mock.history.put[0]?.headers?.['Content-Type']).toContain(
      'application/x-www-form-urlencoded',
    );
    const body = String(mock.history.put[0]?.data);
    expect(body).toContain('id=3474867');
    expect(body).toContain('type=http');
  });

  it('createApi 会注入默认字段并使用 x-www-form-urlencoded', async () => {
    const instance = axios.create();
    const mock = new MockAdapter(
      instance as unknown as ConstructorParameters<typeof MockAdapter>[0],
    );

    mock.onPost('https://api.dev.longbridge-inc.com/api/v1/api-details').replyOnce(200, {
      success: true,
      data: {
        id: 3483321,
        name: 'Untitled Endpoint',
        path: '/dog/{dogId}',
        method: 'get',
        parameters: {
          query: [],
          path: [],
        },
        responses: [],
      },
    });

    const loginManager: LoginManagerLike = {
      getAccessToken: vi.fn(async () => 'token-abc'),
    };

    const client = new PrivateApifoxClient({
      axiosInstance: instance,
      baseUrl: 'https://api.dev.longbridge-inc.com',
      projectId: 345101,
      branchId: 0,
      clientVersion: '2.7.2',
      clientMode: 'web',
      loginManager,
    });

    const payload: ApifoxApiFullInput = {
      name: 'Untitled Endpoint',
      path: '/dog/{dogId}',
      method: 'GET',
    };

    const data = await client.createApi(payload);

    expect(data.id).toBe(3483321);
    expect(mock.history.post).toHaveLength(1);
    expect(mock.history.post[0]?.headers?.['Content-Type']).toContain(
      'application/x-www-form-urlencoded',
    );
    const body = String(mock.history.post[0]?.data);
    expect(body).toContain('method=get');
    expect(body).toContain('type=http');
    expect(body).toContain('status=developing');
    expect(body).toContain('visibility=INHERITED');
    expect(body).toContain('responseId=0');
    expect(body).toContain('responsibleId=0');
  });
});
