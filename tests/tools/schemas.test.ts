import { describe, expect, it } from 'vitest';
import { apifoxApiFullInputSchema } from '../../src/tools/schemas.js';

describe('apifoxApiFullInputSchema', () => {
  it('兼容抓包常见结构（小写 method + 对象型 parameters/common*）', () => {
    const payload = {
      name: 'Find pet by ID',
      path: '/pet/{petId}',
      method: 'get',
      parameters: {
        query: [],
        path: [],
      },
      commonResponseStatus: {
        '38159': true,
      },
      commonParameters: {
        query: [],
        body: [],
        cookie: [],
        header: [],
      },
      tags: ['pet'],
    };

    const result = apifoxApiFullInputSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('method 非法值时校验失败', () => {
    const payload = {
      name: 'Find pet by ID',
      path: '/pet/{petId}',
      method: 'TRACE',
    };

    const result = apifoxApiFullInputSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
