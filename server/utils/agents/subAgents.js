const { SystemSettings } = require("../../models/systemSettings");
const { safeJsonParse } = require("../http");
const Provider = require("./aibitat/providers/ai-provider");

class SubAgent {
  constructor(config) {
    this.config = config;
    this.name = `@@subagent_${config.id}`;
    this.agentName = config.name;
    this.description = config.description;
    this.system_prompt = config.system_prompt;
    this.provider = config.provider;
    this.model = config.model;
    this.input_type = config.input_type || "text";
    this.output_type = config.output_type || "text";
  }

  static async activeSubAgents() {
    const configStr = await SystemSettings.getValueOrFallback(
      { label: "sub_agents" },
      "[]"
    );
    const subAgents = safeJsonParse(configStr, []);
    return subAgents.map((agent) => `@@subagent_${agent.id}`);
  }

  static async loadSubAgent(agentId, aibitat) {
    const configStr = await SystemSettings.getValueOrFallback(
      { label: "sub_agents" },
      "[]"
    );
    const subAgents = safeJsonParse(configStr, []);
    const agentConfig = subAgents.find((a) => a.id === agentId);
    if (!agentConfig) return null;

    return new SubAgent(agentConfig);
  }

  plugin() {
    const self = this;
    return {
      name: this.name,
      setup: (aibitat) => {
        aibitat.function({
          super: aibitat,
          name: this.name,
          description: `Call this agent when you need: ${this.description}. Provide a detailed task description.`,
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              task: {
                type: "string",
                description: "The detailed task for this agent to complete",
              },
            },
            required: ["task"],
            additionalProperties: false,
          },
          handler: async (args) => {
            const { task } = args;
            try {
              aibitat?.handlerProps?.log?.(`[Sub-Agent ${self.agentName}] Executing task: ${task}`);
              if (typeof aibitat?.introspect === "function") {
                aibitat.introspect(`[Sub-Agent] Calling ${self.agentName} to perform task...`);
              }
              
              const aiProvider = aibitat.getProviderForConfig({
                provider: self.provider,
                model: self.model,
              });

              // Build messages array in the standard OpenAI format
              const messages = [
                { role: "system", content: self.system_prompt },
                { role: "user", content: task },
              ];

              // Call the provider's complete method (no tool functions for sub-agents)
              const result = await aiProvider.complete(messages, []);
              const textResult = result?.textResponse || "";

              if (!textResult || textResult.trim().length === 0) {
                return `[ERROR: Sub-agent ${self.agentName} returned an empty response. The model may not support this task.]`;
              }

              aibitat?.handlerProps?.log?.(`[Sub-Agent ${self.agentName}] Task completed successfully.`);
              if (typeof aibitat?.introspect === "function") {
                aibitat.introspect(`[Sub-Agent] ${self.agentName} completed the task.`);
              }

              return `[Sub-Agent ${self.agentName} Result]:\n${textResult}`;
            } catch (error) {
              aibitat?.handlerProps?.log?.(`[Sub-Agent ${self.agentName}] Error: ${error.message}`);
              return `[ERROR: The sub-agent encountered an error: ${error.message}]`;
            }
          },
        });
      },
    };
  }
}

module.exports = SubAgent;
