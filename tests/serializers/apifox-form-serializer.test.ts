import { describe, expect, it } from 'vitest';
import { serializeApiPayloadForForm } from '../../src/serializers/apifox-form-serializer.js';
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
});
