import { describe, expect, it } from 'vitest';
import { parseEnvConfig } from '../../src/config/env.js';

describe('parseEnvConfig', () => {
  it('解析有效环境变量并填充默认值', () => {
    const config = parseEnvConfig({
      APIFOX_PROJECT_ID: '345101',
      APIFOX_EMAIL: 'test@example.com',
      APIFOX_PASSWORD: 'secret',
    });

    expect(config.baseUrl).toBe('https://api.dev.longbridge-inc.com');
    expect(config.projectId).toBe(345101);
    expect(config.locale).toBe('zh-CN');
    expect(config.branchId).toBe(0);
    expect(config.clientVersion).toBe('2.7.2');
    expect(config.clientMode).toBe('web');
    expect(config.loginUseLdap).toBe(false);
  });

  it('必填字段缺失时抛错', () => {
    expect(() =>
      parseEnvConfig({
        APIFOX_PROJECT_ID: '345101',
      }),
    ).toThrowError(/APIFOX_EMAIL|APIFOX_PASSWORD/);
  });

  it('非法 URL 抛错', () => {
    expect(() =>
      parseEnvConfig({
        APIFOX_BASE_URL: 'not-url',
        APIFOX_PROJECT_ID: '345101',
        APIFOX_EMAIL: 'test@example.com',
        APIFOX_PASSWORD: 'secret',
      }),
    ).toThrowError(/APIFOX_BASE_URL/);
  });
});
