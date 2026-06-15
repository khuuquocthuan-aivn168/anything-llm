#!/usr/bin/env node

/**
 * Universal OpenAPI MCP Server
 * 
 * This server reads an OpenAPI JSON schema file and automatically
 * exposes all its endpoints as MCP Tools.
 */

const fs = require("fs");
const path = require("path");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

// 1. Read Arguments
const schemaPath = process.argv[2];
if (!schemaPath) {
  console.error("Lỗi: Vui lòng truyền đường dẫn tới file OpenAPI JSON schema.");
  process.exit(1);
}

const API_KEY = process.env.OPENAPI_BEARER_TOKEN || "";

// 2. Read and Parse Schema
let openApiSchema = {};
try {
  const fileContent = fs.readFileSync(path.resolve(schemaPath), "utf8");
  openApiSchema = JSON.parse(fileContent);
} catch (error) {
  console.error(`Lỗi đọc file Schema: ${error.message}`);
  process.exit(1);
}

// Extract base URL
let baseUrl = "";
if (openApiSchema.servers && openApiSchema.servers.length > 0) {
  baseUrl = openApiSchema.servers[0].url.replace(/\/$/, "");
}

// 3. Extract Tools from Schema
const toolsMap = new Map(); // Store endpoint metadata
const mcpTools = [];

if (openApiSchema.paths) {
  for (const [apiPath, methods] of Object.entries(openApiSchema.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (!["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())) continue;
      
      const toolName = details.operationId || `${method.toLowerCase()}_${apiPath.replace(/[^a-zA-Z0-9]/g, "_")}`.replace(/_+/g, "_").replace(/_$/, "");
      const description = details.summary || details.description || `Call ${method.toUpperCase()} ${apiPath}`;
      
      let inputSchema = {
        type: "object",
        properties: {},
        required: []
      };

      // Extract body schema if exists (mainly for POST/PUT)
      if (details.requestBody && details.requestBody.content && details.requestBody.content["application/json"]) {
        const bodySchema = details.requestBody.content["application/json"].schema;
        if (bodySchema) {
          inputSchema = { ...bodySchema };
        }
      }

      mcpTools.push({
        name: toolName,
        description: description,
        inputSchema: inputSchema,
      });

      toolsMap.set(toolName, {
        path: apiPath,
        method: method.toUpperCase(),
        details: details
      });
    }
  }
}

// 4. Initialize MCP Server
const serverName = openApiSchema.info?.title ? openApiSchema.info.title.replace(/[^a-zA-Z0-9-]/g, "") : "openapi-dynamic-server";
const server = new Server(
  {
    name: serverName,
    version: openApiSchema.info?.version || "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Tool List
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: mcpTools };
});

// Register Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  if (!toolsMap.has(toolName)) {
    throw new Error(`Công cụ không tồn tại: ${toolName}`);
  }

  const endpointMeta = toolsMap.get(toolName);
  const args = request.params.arguments || {};

  // For Universal APIs, we inject fixed properties if defined by user's openapi (e.g., blocking response mode)
  // Or just pass the args directly as JSON body
  const payload = { ...args };
  
  // Specific override for Dify/AIHA if detected (response_mode defaults to streaming if not set, we force blocking for tools)
  if (endpointMeta.details?.requestBody?.content?.["application/json"]?.schema?.properties?.response_mode) {
    payload.response_mode = "blocking";
  }

  const requestUrl = `${baseUrl}${endpointMeta.path}`;
  const headers = {
    "Content-Type": "application/json"
  };

  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  try {
    const fetchOptions = {
      method: endpointMeta.method,
      headers: headers
    };

    if (endpointMeta.method !== "GET" && endpointMeta.method !== "HEAD") {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(requestUrl, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{ type: "text", text: `API Error [${response.status}]: ${errorText}` }],
        isError: true,
      };
    }

    const data = await response.json();
    let answerText = "";

    // Smart Extract logic
    try {
      if (data.json && Array.isArray(data.json) && data.json.length > 0) {
        // Dify/AIHA format
        const firstItem = data.json[0];
        answerText = firstItem?.data?.output?.llm_response?.message?.text 
                  || firstItem?.data?.output?.text
                  || firstItem?.answer
                  || JSON.stringify(data.json);
      } else if (data.answer) {
        answerText = data.answer;
      } else if (data.text) {
        answerText = data.text;
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        // OpenAI format
        answerText = data.choices[0].message.content;
      } else {
        answerText = JSON.stringify(data, null, 2);
      }
    } catch (e) {
      answerText = `Không thể phân tích dữ liệu: ${JSON.stringify(data)}`;
    }

    return {
      content: [{ type: "text", text: answerText }]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Lỗi kết nối tới API: ${error.message}` }],
      isError: true,
    };
  }
});

// Run Server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`OpenAPI MCP Server (${serverName}) đang chạy...`);
}

run().catch((error) => {
  console.error("Lỗi khi chạy OpenAPI MCP Server:", error);
  process.exit(1);
});
