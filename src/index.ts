import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LoginManager } from './auth/login.js';
import { PrivateApifoxClient } from './client/private-apifox-client.js';
import { parseEnvConfig } from './config/env.js';
import { ApifoxService } from './services/apifox-service.js';
import { registerTools } from './tools/index.js';

const bootstrap = async (): Promise<void> => {
  const env = parseEnvConfig(process.env);
  const axiosInstance = axios.create({
    timeout: 30_000,
  });

  const loginManager = new LoginManager({
    axiosInstance,
    baseUrl: env.baseUrl,
    email: env.email,
    password: env.password,
    loginUseLdap: env.loginUseLdap,
    locale: env.locale,
    branchId: env.branchId,
    clientVersion: env.clientVersion,
    clientMode: env.clientMode,
    projectId: env.projectId,
  });

  const client = new PrivateApifoxClient({
    axiosInstance,
    loginManager,
    baseUrl: env.baseUrl,
    projectId: env.projectId,
    branchId: env.branchId,
    clientVersion: env.clientVersion,
    clientMode: env.clientMode,
  });

  const service = new ApifoxService(client);

  const server = new McpServer({
    name: 'apifox-private-mcp-server',
    version: '0.1.0',
  });

  registerTools(server, service);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('apifox-private-mcp-server started');
};

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`apifox-private-mcp-server failed: ${message}`);
  process.exit(1);
});
