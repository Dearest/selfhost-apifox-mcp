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

  it('parameters/responses 不是数组时回退为空数组', () => {
    const raw: ApifoxApiDetailRaw = {
      id: 101,
      name: '异常结构',
      path: '/broken',
      method: 'POST',
      parameters: '{"name":"id","in":"path"}',
      responses: '{"statusCode":200}',
    };

    const normalized = normalizeApiDetail(raw);

    expect(normalized.request.pathParams).toHaveLength(0);
    expect(normalized.request.queryParams).toHaveLength(0);
    expect(normalized.responses).toHaveLength(0);
  });

  it('parameters 为 query/path 分组对象时可正常解析', () => {
    const raw: ApifoxApiDetailRaw = {
      id: 102,
      name: '分组参数',
      path: '/pets/{petId}',
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
            name: 'petId',
            required: true,
            description: 'pet ID',
          },
        ],
      },
      responses: [
        {
          code: 200,
          name: 'OK',
          jsonSchema: { type: 'object' },
        },
      ],
    };

    const normalized = normalizeApiDetail(raw);

    expect(normalized.method).toBe('GET');
    expect(normalized.request.queryParams).toHaveLength(1);
    expect(normalized.request.pathParams).toHaveLength(1);
    expect(normalized.responses[0]?.statusCode).toBe(200);
  });
});
