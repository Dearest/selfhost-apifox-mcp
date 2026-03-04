import { describe, expect, it } from 'vitest';
import {
  prepareApiPayloadForWrite,
  serializeApiPayloadForForm,
} from '../../src/serializers/apifox-form-serializer.js';
import type { ApifoxApiFullInput } from '../../src/types/apifox.js';

describe('serializeApiPayloadForForm', () => {
  it('将复杂字段序列化为字符串', () => {
    const payload: ApifoxApiFullInput = {
      name: '获取用户',
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
      requestBody: {
        contentType: 'application/json',
        jsonSchema: { type: 'object' },
      },
      responses: [
        {
          statusCode: 200,
          name: '成功',
          jsonSchema: { type: 'object' },
        },
      ],
      tags: ['user'],
      auth: {
        type: 'none',
      },
      customApiFields: {
        owner: 'tester',
      },
    };

    const serialized = serializeApiPayloadForForm(payload);

    expect(typeof serialized.parameters).toBe('string');
    expect(typeof serialized.requestBody).toBe('string');
    expect(typeof serialized.responses).toBe('string');
    expect(typeof serialized.tags).toBe('string');
    expect(typeof serialized.auth).toBe('string');
    expect(typeof serialized.customApiFields).toBe('string');
  });

  it('基础字段保留原始值', () => {
    const payload: ApifoxApiFullInput = {
      name: '创建用户',
      path: '/users',
      method: 'POST',
      folderId: 10,
      deprecated: false,
    };

    const serialized = serializeApiPayloadForForm(payload);

    expect(serialized.name).toBe('创建用户');
    expect(serialized.folderId).toBe(10);
    expect(serialized.deprecated).toBe(false);
  });

  it('prepare(create) 会注入创建默认字段并规范 method 小写', () => {
    const payload: ApifoxApiFullInput = {
      name: '创建用户',
      path: '/users',
      method: 'POST',
    };

    const prepared = prepareApiPayloadForWrite(payload, { mode: 'create' });

    expect(prepared.method).toBe('post');
    expect(prepared.type).toBe('http');
    expect(prepared.status).toBe('developing');
    expect(prepared.visibility).toBe('INHERITED');
    expect(prepared.responsibleId).toBe(0);
    expect(prepared.responseId).toBe(0);
    expect(prepared.serverId).toBe('');
    expect(prepared.oasExtensions).toBe('');
  });

  it('prepare(update) 会注入 id/type/responseId 并规范 method 小写', () => {
    const payload: ApifoxApiFullInput = {
      name: '更新用户',
      path: '/users/{id}',
      method: 'PUT',
    };

    const prepared = prepareApiPayloadForWrite(payload, {
      mode: 'update',
      apiId: 123,
    });

    expect(prepared.id).toBe(123);
    expect(prepared.method).toBe('put');
    expect(prepared.type).toBe('http');
    expect(prepared.responseId).toBe(0);
    expect(prepared.oasExtensions).toBe('');
  });
});
