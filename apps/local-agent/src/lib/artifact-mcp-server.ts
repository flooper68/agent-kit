import { createSdkMcpServer, tool } from '@anthropic-ai/claude-code';
import { z } from 'zod';
import type { ArtifactToolRelay } from './artifact-tool-relay';
import { createLogger } from './logger';

const log = createLogger('ArtifactMcpServer');

/**
 * Format a result as an MCP tool response.
 * Returns an object with content array as expected by MCP protocol.
 */
function formatMcpResult(result: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof result === 'string' ? result : JSON.stringify(result),
      },
    ],
  };
}

/**
 * Creates an in-process MCP server for artifact tools.
 *
 * This uses `createSdkMcpServer()` from the Claude Code SDK which allows
 * tools to run in the same process as the local agent, enabling direct
 * access to the artifact relay without IPC.
 *
 * @param artifactRelay - The relay for communicating artifact operations to the server
 * @param sessionId - The session ID for artifact operations
 * @returns An MCP server instance that can be passed to the Claude Code SDK query()
 */
export function createArtifactMcpServer(
  artifactRelay: ArtifactToolRelay,
  sessionId: string
) {
  log.debug('Creating in-process MCP server for artifact tools', {
    sessionId: sessionId.slice(0, 8) + '...',
  });

  return createSdkMcpServer({
    name: 'agent-kit-artifacts',
    version: '1.0.0',
    tools: [
      tool(
        'writeArtifact',
        'Create or save a markdown document/note to the server. Use this when the user asks you to save, write, or create a document, note, or artifact.',
        {
          title: z
            .string()
            .min(1)
            .max(255)
            .describe('The title of the document (1-255 characters)'),
          content: z
            .string()
            .min(1)
            .max(1_000_000)
            .describe('The markdown content of the document (max 1MB)'),
          summary: z
            .string()
            .max(500)
            .optional()
            .describe(
              'A brief 1-2 sentence summary of the content for search purposes (max 500 characters)'
            ),
        },
        async (args) => {
          log.debug('writeArtifact tool called', {
            titleLength: args.title.length,
            contentLength: args.content.length,
            hasSummary: !!args.summary,
          });

          const result = await artifactRelay.executeArtifactTool(
            'writeArtifact',
            args,
            sessionId
          );

          log.debug('writeArtifact tool completed', {
            result: typeof result === 'object' ? 'object' : result,
          });

          return formatMcpResult(result);
        }
      ),
      tool(
        'readArtifact',
        'Read the full content of a saved document by its ID. Use this after searching to retrieve the complete document content.',
        {
          artifactId: z
            .string()
            .uuid()
            .describe('The UUID of the document to read'),
        },
        async (args) => {
          log.debug('readArtifact tool called', {
            artifactId: args.artifactId.slice(0, 8) + '...',
          });

          const result = await artifactRelay.executeArtifactTool(
            'readArtifact',
            args,
            sessionId
          );

          log.debug('readArtifact tool completed');

          return formatMcpResult(result);
        }
      ),
      tool(
        'searchArtifacts',
        'Search through saved documents/notes by title and summary. Use an empty query to list recent documents.',
        {
          query: z
            .string()
            .describe('Search query (empty string to list recent documents)'),
          limit: z
            .number()
            .optional()
            .default(10)
            .describe('Maximum number of results to return (default: 10)'),
          offset: z
            .number()
            .optional()
            .default(0)
            .describe('Number of results to skip for pagination (default: 0)'),
        },
        async (args) => {
          log.debug('searchArtifacts tool called', {
            queryLength: args.query.length,
            limit: args.limit,
            offset: args.offset,
          });

          const result = await artifactRelay.executeArtifactTool(
            'searchArtifacts',
            args,
            sessionId
          );

          log.debug('searchArtifacts tool completed');

          return formatMcpResult(result);
        }
      ),
    ],
  });
}
