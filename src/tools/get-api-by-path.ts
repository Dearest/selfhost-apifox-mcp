import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import type { ApifoxService } from '../services/apifox-service.js';
import { httpMethodSchema } from './schemas.js';
import { toErrorResult, toSuccessResult } from './result.js';

export const registerGetApiByPathTool = (
  server: McpServer,
  service: ApifoxService,
): void => {
  server.registerTool(
    'get_api_by_path',
    {
      description: '通过 path + method 查询 API 详情',
      inputSchema: {
        path: z.string().min(1).describe('API Path，例如 /users/{id}'),
        method: httpMethodSchema.describe('HTTP Method'),
        strict: z
          .boolean()
          .optional()
          .describe('是否严格匹配 path，默认 true'),
      },
    },
    async ({ path, method, strict }) => {
      try {
        const result = await service.getApiByPath({ path, method, strict });

        if (result.api) {
          return toSuccessResult({
            found: true,
            api: result.api,
            conflicts: [],
          });
        }

        if (result.conflicts.length > 0) {
          return toSuccessResult({
            found: false,
            reason: 'conflict',
            conflicts: result.conflicts,
          });
        }

        return toSuccessResult({
          found: false,
          reason: 'not_found',
          conflicts: [],
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },
  );
};
