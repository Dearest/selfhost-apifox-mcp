import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import type { ApifoxService } from '../services/apifox-service.js';
import type { ApifoxApiFullInput } from '../types/apifox.js';
import { apifoxApiFullInputSchema } from './schemas.js';
import { toErrorResult, toSuccessResult } from './result.js';

export const registerUpdateApiTool = (
  server: McpServer,
  service: ApifoxService,
): void => {
  server.registerTool(
    'update_api',
    {
      description: '全量对象更新 API（默认 dry-run，confirm=true 且 dryRun=false 才执行）',
      inputSchema: {
        apiId: z.number().int().positive().describe('目标 API ID'),
        payload: apifoxApiFullInputSchema.describe('完整 API 对象'),
        dryRun: z
          .boolean()
          .optional()
          .describe('默认 true，dry-run 模式只返回 diff 和预览'),
        confirm: z
          .boolean()
          .optional()
          .describe('默认 false，必须 confirm=true 才允许写入'),
      },
    },
    async ({ apiId, payload, dryRun, confirm }) => {
      try {
        const result = await service.updateApi({
          apiId,
          payload: payload as ApifoxApiFullInput,
          dryRun,
          confirm,
        });
        return toSuccessResult(result);
      } catch (error) {
        return toErrorResult(error);
      }
    },
  );
};
