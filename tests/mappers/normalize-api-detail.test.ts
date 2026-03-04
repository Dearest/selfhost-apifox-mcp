import { describe, expect, it } from 'vitest';
import { normalizeApiDetail } from '../../src/mappers/normalize-api-detail.js';
import type { ApifoxApiDetailRaw } from '../../src/types/apifox.js';

describe('normalizeApiDetail', () => {
  it('将原始结构转换为 LLM 标准结构', () => {
    const raw: ApifoxApiDetailRaw = {
      id: 100,
      name: '查询用户',
      path: '/users/{id}',
      method: 'GET',
      description: 'desc',
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
          name: 'ok',
          jsonSchema: { type: 'object' },
        },
      ],
    };

    const normalized = normalizeApiDetail(raw);

    expect(normalized.id).toBe(100);
    expect(normalized.method).toBe('GET');
    expect(normalized.path).toBe('/users/{id}');
    expect(normalized.request.pathParams).toHaveLength(1);
    expect(normalized.responses).toHaveLength(1);
  });
});
