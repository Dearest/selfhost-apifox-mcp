import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ApifoxService } from '../services/apifox-service.js';
import { registerCreateApiTool } from './create-api.js';
import { registerGetApiByIdTool } from './get-api-by-id.js';
import { registerGetApiByPathTool } from './get-api-by-path.js';
import { registerUpdateApiTool } from './update-api.js';

export const registerTools = (server: McpServer, service: ApifoxService): void => {
  registerGetApiByIdTool(server, service);
  registerGetApiByPathTool(server, service);
  registerCreateApiTool(server, service);
  registerUpdateApiTool(server, service);
};
