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
