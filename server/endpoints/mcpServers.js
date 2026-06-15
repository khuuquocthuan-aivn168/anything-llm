const { reqBody } = require("../utils/http");
const MCPCompatibilityLayer = require("../utils/MCP");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");

function mcpServersEndpoints(app) {
  if (!app) return;

  app.get(
    "/mcp-servers/force-reload",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (_request, response) => {
      try {
        const mcp = new MCPCompatibilityLayer();
        await mcp.reloadMCPServers();
        return response.status(200).json({
          success: true,
          error: null,
          servers: await mcp.servers(),
        });
      } catch (error) {
        console.error("Error force reloading MCP servers:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
          servers: [],
        });
      }
    }
  );

  app.get(
    "/mcp-servers/list",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (_request, response) => {
      try {
        const servers = await new MCPCompatibilityLayer().servers();
        return response.status(200).json({
          success: true,
          servers,
        });
      } catch (error) {
        console.error("Error listing MCP servers:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  app.post(
    "/mcp-servers/toggle",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { name } = reqBody(request);
        const result = await new MCPCompatibilityLayer().toggleServerStatus(
          name
        );
        return response.status(200).json({
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        console.error("Error toggling MCP server:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  app.post(
    "/mcp-servers/delete",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { name } = reqBody(request);
        const result = await new MCPCompatibilityLayer().deleteServer(name);
        return response.status(200).json({
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        console.error("Error deleting MCP server:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  app.post(
    "/mcp-servers/toggle-tool",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { serverName, toolName, enabled } = reqBody(request);
        const result = await new MCPCompatibilityLayer().toggleToolSuppression(
          serverName,
          toolName,
          enabled
        );
        return response.status(200).json({
          success: result.success,
          error: result.error,
          suppressedTools: result.suppressedTools,
        });
      } catch (error) {
        console.error("Error toggling MCP tool:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
          suppressedTools: [],
        });
      }
    }
  );

  app.post(
    "/mcp-servers/create",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { name, type, url, command, args, env, openApiJson, openApiToken } = reqBody(request);
        
        // Name validation
        if (!name || !/^[a-zA-Z0-9-]+$/.test(name)) {
          return response.status(400).json({
            success: false,
            error: "Tên máy chủ không hợp lệ. Chỉ chấp nhận chữ cái, số và dấu gạch ngang.",
          });
        }

        const mcp = new MCPCompatibilityLayer();
        
        let config = {};
        if (type === "sse") {
          if (!url) throw new Error("URL is required for SSE transport");
          config = { type: "sse", url };
        } else if (type === "stdio") {
          if (!command) throw new Error("Command is required for Stdio transport");
          config = {
            command,
            args: args ? (Array.isArray(args) ? args : args.split(",").map((a) => a.trim()).filter((a) => a)) : [],
            env: env ? (typeof env === "object" ? env : JSON.parse(env)) : {},
          };
        } else if (type === "openapi") {
          if (!openApiJson) throw new Error("OpenAPI JSON is required");
          
          const fs = require("fs");
          const path = require("path");
          
          const openApiDir = path.resolve(__dirname, "../storage/plugins/openapi");
          if (!fs.existsSync(openApiDir)) {
            fs.mkdirSync(openApiDir, { recursive: true });
          }
          
          const schemaFile = path.resolve(openApiDir, `${name}.json`);
          fs.writeFileSync(schemaFile, typeof openApiJson === "string" ? openApiJson : JSON.stringify(openApiJson, null, 2));

          config = {
            command: "node",
            args: [
              path.resolve(__dirname, "../utils/MCP/openapi_server.js"),
              schemaFile
            ],
            env: openApiToken ? { OPENAPI_BEARER_TOKEN: openApiToken } : {}
          };
        } else {
          throw new Error("Invalid transport type");
        }

        const added = mcp.addMCPServerToConfig(name, config);
        if (!added) {
          return response.status(400).json({
            success: false,
            error: "A server with this name already exists.",
          });
        }

        // Try to start the newly added server
        await mcp.startMCPServer(name);

        return response.status(200).json({
          success: true,
          error: null,
        });
      } catch (error) {
        console.error("Error creating MCP server:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { mcpServersEndpoints };
