import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const toSuccessResult = (payload: unknown): CallToolResult => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(payload, null, 2),
    },
  ],
});

export const toErrorResult = (error: unknown): CallToolResult => {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: message,
          },
          null,
          2,
        ),
      },
    ],
  };
};
