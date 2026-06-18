const { safeJsonParse } = require("../../http");

/**
 * Execute an API call flow step
 * @param {Object} config Flow step configuration
 * @param {Object} context Execution context with introspect function
 * @returns {Promise<string>} Response data
 */
async function executeApiCall(config, context) {
  const { url, method, headers = [], body, bodyType, formData } = config;
  const { introspect, logger } = context;
  logger(`\x1b[43m[AgentFlowToolExecutor]\x1b[0m - executing API Call block`);
  const upperMethod = (method || "GET").toUpperCase();
  introspect(`Making ${upperMethod} request to external API...`);

  const requestConfig = {
    method: upperMethod,
    headers: headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
  };

  if (["POST", "PUT", "PATCH"].includes(upperMethod)) {
    if (bodyType === "form") {
      const formDataObj = new URLSearchParams();
      if (Array.isArray(formData)) {
        formData.forEach(({ key, value }) => {
          if (key) formDataObj.append(key, value || "");
        });
      }
      requestConfig.body = formDataObj.toString();
      requestConfig.headers["Content-Type"] =
        "application/x-www-form-urlencoded";
    } else if (bodyType === "json") {
      if (body) {
        if (typeof body === "object") {
          requestConfig.body = JSON.stringify(body);
        } else {
          const parsedBody = safeJsonParse(body, null);
          if (parsedBody !== null) {
            requestConfig.body = JSON.stringify(parsedBody);
          } else {
            requestConfig.body = body; // Fallback to raw string if parsing failed
          }
        }
      }
      requestConfig.headers["Content-Type"] = "application/json";
    } else if (bodyType === "text") {
      requestConfig.body = String(body || "");
    } else {
      if (body !== undefined && body !== null) {
        requestConfig.body = typeof body === "object" ? JSON.stringify(body) : body;
      }
    }
  }

  try {
    introspect(`Sending body to ${url}: ${requestConfig?.body || "No body"}`);
    const response = await fetch(url, requestConfig);
    if (!response.ok) {
      introspect(`Request failed with status ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    introspect(`API call completed`);
    
    // Check if we should stream the response
    if (config.streamChunks && response.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '' || line.startsWith('event:')) continue;
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              let extractedText = "";

              // Dify format (event: message)
              if (data.event === 'message' && data.answer !== undefined) {
                extractedText = data.answer;
              } 
              // OpenAI format
              else if (data.choices?.[0]?.delta?.content !== undefined) {
                extractedText = data.choices[0].delta.content;
              }
              // Anthropic format
              else if (data.type === 'content_block_delta' && data.delta?.text !== undefined) {
                extractedText = data.delta.text;
              }
              // Generic fallback if it's just an object with a text/content field
              else if (typeof data.text === 'string') {
                extractedText = data.text;
              } else if (typeof data.content === 'string' && !data.choices) {
                extractedText = data.content;
              }

              if (extractedText) {
                fullResponse += extractedText;
                if (context.aibitat && context.aibitat.socket) {
                  context.aibitat.socket.send?.("reportStreamEvent", {
                    type: "textResponseChunk",
                    content: extractedText,
                    uuid: context.aibitat.id
                  });
                }
              }
            } catch (e) {
              // Not JSON, treat as raw string if we really wanted to, 
              // but standard SSE data is usually JSON. We'll ignore parse errors.
            }
          }
        }
      }
      return { directOutput: true, result: fullResponse };
    }

    return await response
      .text()
      .then((text) =>
        safeJsonParse(text, "Failed to parse output from API call block")
      );
  } catch (error) {
    console.error(error);
    throw new Error(`API Call failed: ${error.message}`);
  }
}

module.exports = executeApiCall;
