import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import type { ApifoxService } from '../services/apifox-service.js';
import { toErrorResult, toSuccessResult } from './result.js';

export const registerGetApiByIdTool = (
  server: McpServer,
  service: ApifoxService,
): void => {
  server.registerTool(
    'get_api_by_id',
    {
      description: '通过 apiId 查询 API 详情（请求参数、响应结构等）',
      inputSchema: {
        apiId: z.number().int().positive().describe('Apifox API ID'),
        includeRaw: z
          .boolean()
          .optional()
          .describe('是否返回原始 Apifox 响应结构'),
      },
    },
    async ({ apiId, includeRaw }) => {
      try {
        const detail = await service.getApiByIdDetail(apiId);
        return toSuccessResult({
          api: detail.api,
          raw: includeRaw ? detail.raw : undefined,
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },
  );
};
