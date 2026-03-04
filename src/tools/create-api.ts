import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import type { ApifoxService } from '../services/apifox-service.js';
import type { ApifoxApiFullInput } from '../types/apifox.js';
import { apifoxApiFullInputSchema } from './schemas.js';
import { toErrorResult, toSuccessResult } from './result.js';

export const registerCreateApiTool = (
  server: McpServer,
  service: ApifoxService,
): void => {
  server.registerTool(
    'create_api',
    {
      description: '创建 API（默认 dry-run，confirm=true 且 dryRun=false 才执行）',
      inputSchema: {
        payload: apifoxApiFullInputSchema.describe('完整 API 对象'),
        dryRun: z
          .boolean()
          .optional()
          .describe('默认 true，dry-run 模式只返回预览'),
        confirm: z
          .boolean()
          .optional()
          .describe('默认 false，必须 confirm=true 才允许写入'),
      },
    },
    async ({ payload, dryRun, confirm }) => {
      try {
        const result = await service.createApi({
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
