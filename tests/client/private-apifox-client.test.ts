import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { describe, expect, it, vi } from 'vitest';
import { PrivateApifoxClient } from '../../src/client/private-apifox-client.js';
import type { LoginManagerLike } from '../../src/auth/login.js';

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
});
