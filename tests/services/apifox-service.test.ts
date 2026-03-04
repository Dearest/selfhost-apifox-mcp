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

const createClientMock = (): ApifoxClient => ({
  getApiById: vi.fn(async () => sampleRawApi),
  listApiDetails: vi.fn(async () => [sampleRawApi]),
  createApi: vi.fn(async () => ({ ...sampleRawApi, id: 2 })),
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
