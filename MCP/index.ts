#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

interface ToolArguments {
  max_count?: number;
  path?: string;
  query?: string;
  file_pattern?: string;
  max_results?: number;
  recursive?: boolean;
  content?: string;
}

class CodeRepositoryServer {
  private server: Server;
  private repoPath: string;

  constructor() {
    this.repoPath = process.argv[2] || process.cwd();

    this.server = new Server(
      {
        name: 'code-repository',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: 'Read the contents of a file in the repository',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to repository root',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: 'Write content to a file in the repository',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to repository root',
                },
                content: {
                  type: 'string',
                  description: 'Content to write to the file',
                },
              },
              required: ['path', 'content'],
            },
          },
          {
            name: 'list_files',
            description: 'List files and directories in a path within the repository',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path relative to repository root (default: ".")',
                  default: '.',
                },
                recursive: {
                  type: 'boolean',
                  description: 'Whether to list files recursively',
                  default: false,
                },
              },
            },
          },
          {
            name: 'search_files',
            description: 'Search for text within files in the repository',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Text to search for',
                },
                file_pattern: {
                  type: 'string',
                  description: 'File pattern to search in (e.g., "*.ts", "*.js")',
                  default: '*',
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 20,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'git_status',
            description: 'Get git status of the repository',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'git_log',
            description: 'Get git commit history',
            inputSchema: {
              type: 'object',
              properties: {
                max_count: {
                  type: 'number',
                  description: 'Maximum number of commits to return',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'get_file_info',
            description: 'Get information about a file (size, modified date, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to repository root',
                },
              },
              required: ['path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const typedArgs = args as ToolArguments;

      try {
        switch (name) {
          case 'read_file':
            return await this.readFile(typedArgs.path || '');
          case 'write_file':
            return await this.writeFile(typedArgs.path as string, typedArgs.content as string);
          case 'list_files':
            return await this.listFiles(typedArgs.path || '.', typedArgs.recursive as boolean || false);
          case 'search_files':
            return await this.searchFiles(typedArgs.query || '', typedArgs.file_pattern || '*', typedArgs.max_results || 20);
          case 'git_status':
            return await this.gitStatus();
          case 'git_log':
            return await this.gitLog(typedArgs.max_count || 10);
          case 'get_file_info':
            return await this.getFileInfo(typedArgs.path || '');
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });
  }

  private resolvePath(relativePath: string): string {
    const resolvedPath = path.resolve(this.repoPath, relativePath);

    // Security check: ensure the path is within the repository
    if (!resolvedPath.startsWith(path.resolve(this.repoPath))) {
      throw new McpError(ErrorCode.InvalidRequest, 'Path is outside repository scope');
    }

    return resolvedPath;
  }

  private async readFile(relativePath: string) {
    const filePath = this.resolvePath(relativePath);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `File: ${relativePath}\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Failed to read file: ${error}`);
    }
  }

  private async writeFile(relativePath: string, content: string) {
    const filePath = this.resolvePath(relativePath);

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, content, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote to ${relativePath}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Failed to write file: ${error}`);
    }
  }

  private async listFiles(relativePath: string, recursive: boolean) {
    const dirPath = this.resolvePath(relativePath);

    try {
      const items = await this.getDirectoryContents(dirPath, recursive);
      const itemList = items.map(item => `${item.type === 'directory' ? '📁' : '📄'} ${item.path}`).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Contents of ${relativePath}:\n\n${itemList}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Failed to list files: ${error}`);
    }
  }

  private async getDirectoryContents(dirPath: string, recursive: boolean): Promise<Array<{ path: string, type: string }>> {
    const items: Array<{ path: string, type: string }> = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.repoPath, fullPath);

        if (entry.isDirectory()) {
          items.push({ path: relativePath, type: 'directory' });
          if (recursive) {
            const subItems = await this.getDirectoryContents(fullPath, true);
            items.push(...subItems);
          }
        } else {
          items.push({ path: relativePath, type: 'file' });
        }
      }
    } catch (error) {
      // Ignore permission errors and continue
      console.warn(`Warning: Could not read directory ${dirPath}: ${error}`);
    }

    return items;
  }

  private async searchFiles(query: string, filePattern: string, maxResults: number) {
    try {
      // Use grep for searching (works on most Unix systems)
      const grepCommand = `grep -r -n "${query}" --include="${filePattern}" "${this.repoPath}" | head -${maxResults}`;
      const output = execSync(grepCommand, { encoding: 'utf-8', cwd: this.repoPath });

      return {
        content: [
          {
            type: 'text',
            text: `Search results for "${query}" in ${filePattern}:\n\n${output}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `No results found for "${query}" in ${filePattern}`,
          },
        ],
      };
    }
  }

  private async gitStatus() {
    try {
      const output = execSync('git status --porcelain', {
        encoding: 'utf-8',
        cwd: this.repoPath
      });

      return {
        content: [
          {
            type: 'text',
            text: `Git status:\n\n${output || 'Working tree clean'}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Git status failed: ${error}`);
    }
  }

  private async gitLog(maxCount: number) {
    try {
      const output = execSync(`git log --oneline -${maxCount}`, {
        encoding: 'utf-8',
        cwd: this.repoPath
      });

      return {
        content: [
          {
            type: 'text',
            text: `Git log (last ${maxCount} commits):\n\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Git log failed: ${error}`);
    }
  }

  private async getFileInfo(relativePath: string) {
    const filePath = this.resolvePath(relativePath);

    try {
      const stats = await fs.stat(filePath);
      const info = {
        path: relativePath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString(),
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };

      return {
        content: [
          {
            type: 'text',
            text: `File info for ${relativePath}:\n\n${JSON.stringify(info, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Failed to get file info: ${error}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Code Repository MCP server running on ${this.repoPath}`);
  }
}

const server = new CodeRepositoryServer();
server.run().catch(console.error);