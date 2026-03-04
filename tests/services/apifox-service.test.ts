import { describe, expect, it, vi } from 'vitest';
import { ApifoxService } from '../../src/services/apifox-service.js';
import type {
  ApifoxApiDetailRaw,
  ApifoxApiFullInput,
  ApifoxClient,
} from '../../src/types/apifox.js';

const sampleRawApi: ApifoxApiDetailRaw = {
  id: 1,
  name: '查询用户',
  path: '/users/{id}',
  method: 'GET',
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      statusCode: 200,
      name: 'ok',
      jsonSchema: { type: 'object' },
    },
  ],
};

const sampleRawApiPost: ApifoxApiDetailRaw = {
  id: 2,
  name: '更新用户',
  path: '/users/{id}',
  method: 'POST',
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      statusCode: 200,
      name: 'ok',
      jsonSchema: { type: 'object' },
    },
  ],
};

const createClientMock = (): ApifoxClient => ({
  getApiById: vi.fn(async () => sampleRawApi),
  listApiDetails: vi.fn(async () => [sampleRawApi]),
  createApi: vi.fn(async () => ({ ...sampleRawApi, id: 3 })),
  updateApi: vi.fn(async () => ({ ...sampleRawApi })),
});

describe('ApifoxService', () => {
  it('getApiByPath 在 path+method 唯一时返回命中', async () => {
    const client = createClientMock();
    const service = new ApifoxService(client);

    const result = await service.getApiByPath({
      path: '/users/{id}',
      method: 'GET',
      strict: true,
    });

    expect(result.conflicts).toHaveLength(0);
    expect(result.api?.id).toBe(1);
  });

  it('getApiByPath 在 strict=false 且未传 method 时按 path 唯一命中', async () => {
    const client = createClientMock();
    const service = new ApifoxService(client);

    const result = await service.getApiByPath({
      path: '/users/{id}/',
      strict: false,
    });

    expect(result.conflicts).toHaveLength(0);
    expect(result.api?.id).toBe(1);
  });

  it('getApiByPath 在 strict=false 且未传 method 时多命中返回冲突', async () => {
    const client: ApifoxClient = {
      ...createClientMock(),
      listApiDetails: vi.fn(async () => [sampleRawApi, sampleRawApiPost]),
    };
    const service = new ApifoxService(client);

    const result = await service.getApiByPath({
      path: '/users/{id}',
      strict: false,
    });

    expect(result.api).toBeNull();
    expect(result.conflicts).toHaveLength(2);
    expect(result.conflicts.map((item) => item.method)).toEqual(['GET', 'POST']);
  });

  it('getApiByPath 在 strict=true 且缺失 method 时抛错', async () => {
    const client = createClientMock();
    const service = new ApifoxService(client);

    await expect(
      service.getApiByPath({
        path: '/users/{id}',
        strict: true,
      }),
    ).rejects.toThrow('method is required when strict=true');
  });

  it('updateApi 执行态遇到 data=null 时会回读详情并返回标准结构', async () => {
    const client: ApifoxClient = {
      ...createClientMock(),
      getApiById: vi.fn(async () => sampleRawApiPost),
      updateApi: vi.fn(async () => null),
    };
    const service = new ApifoxService(client);

    const result = await service.updateApi({
      apiId: 2,
      payload: {
        name: '更新用户',
        path: '/users/{id}',
        method: 'POST',
      },
      dryRun: false,
      confirm: true,
    });

    expect(result.executed).toBe(true);
    expect(result.api?.id).toBe(2);
    expect(result.api?.method).toBe('POST');
    expect(client.updateApi).toHaveBeenCalledTimes(1);
    expect(client.getApiById).toHaveBeenCalledTimes(2);
  });

  it('createApi 默认 dry-run 只返回预览', async () => {
    const client = createClientMock();
    const service = new ApifoxService(client);

    const payload: ApifoxApiFullInput = {
      name: '创建用户',
      path: '/users',
      method: 'POST',
    };

    const result = await service.createApi({
      payload,
      dryRun: true,
      confirm: false,
    });

    expect(result.executed).toBe(false);
    expect(result.requestPreview.path).toBe('/users');
    expect(client.createApi).not.toHaveBeenCalled();
  });

  it('createApi 执行态返回对象时可正确标准化分组参数与响应 code', async () => {
    const createdRaw: ApifoxApiDetailRaw = {
      id: 3483321,
      name: 'Untitled Endpoint',
      path: '/dog/{dogId}',
      method: 'get',
      parameters: {
        query: [
          {
            name: 'id',
            required: false,
          },
        ],
        path: [
          {
            name: 'dogId',
            required: true,
          },
        ],
      },
      responses: [
        {
          code: 200,
          name: 'Success',
          jsonSchema: { type: 'object' },
        },
      ],
    };

    const client: ApifoxClient = {
      ...createClientMock(),
      createApi: vi.fn(async () => createdRaw),
    };
    const service = new ApifoxService(client);

    const result = await service.createApi({
      payload: {
        name: 'Untitled Endpoint',
        path: '/dog/{dogId}',
        method: 'GET',
      },
      dryRun: false,
      confirm: true,
    });

    expect(result.executed).toBe(true);
    expect(result.createdId).toBe(3483321);
    expect(result.api?.method).toBe('GET');
    expect(result.api?.request.queryParams).toHaveLength(1);
    expect(result.api?.request.pathParams).toHaveLength(1);
    expect(result.api?.responses[0]?.statusCode).toBe(200);
    expect(client.createApi).toHaveBeenCalledTimes(1);
  });

  it('updateApi 默认 dry-run 生成 diff', async () => {
    const client = createClientMock();
    const service = new ApifoxService(client);

    const result = await service.updateApi({
      apiId: 1,
      payload: {
        name: '查询用户(新)',
        path: '/users/{id}',
        method: 'GET',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: [
          {
            statusCode: 200,
            name: 'ok',
            jsonSchema: { type: 'object' },
          },
        ],
      },
      dryRun: true,
      confirm: false,
    });

    expect(result.executed).toBe(false);
    expect(result.diff.changedKeys).toContain('name');
    expect(client.updateApi).not.toHaveBeenCalled();
  });
});
