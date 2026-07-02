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
              aibitat?.handlerProps?.log?.(`[Sub-Agent ${this.agentName}] Executing task: ${task}`);
              if (typeof aibitat?.introspect === "function") {
                aibitat.introspect(`[Sub-Agent] Calling ${this.agentName} to perform task...`);
              }
              
              const aiProvider = aibitat.getProviderForConfig({
                provider: this.provider,
                model: this.model,
              });

              // Construct proper input depending on input type
              const attachments = this.input_type === 'image' && aibitat.handlerProps?.attachments
                ? aibitat.handlerProps.attachments
                : [];

              const messages = aiProvider.constructPrompt({
                systemPrompt: this.system_prompt,
                userPrompt: task,
                attachments,
                chatHistory: [] // Keep history clean for sub-agents to focus on the task
              });

              const result = await aiProvider.getChatCompletion(messages, { temperature: 0.7 });
              let textResult = result.textResponse;

              if (this.output_type === 'image' || this.output_type === 'audio') {
                aibitat?.handlerProps?.log?.(`[Sub-Agent ${this.agentName}] Media generated, sending to UI.`);
                if (typeof aibitat?.introspect === "function") {
                  aibitat.introspect(`[Sub-Agent] ${this.agentName} generated media successfully.`);
                }
                const uuid = require('uuid').v4();
                
                // Construct the media markdown/html depending on output type
                const content = this.output_type === 'audio' 
                  ? `<audio controls autoplay src="${textResult}"></audio>`
                  : `![${this.agentName} Output](${textResult})`;

                aibitat?.socket?.send("reportStreamEvent", {
                  type: "fullTextResponse",
                  uuid,
                  content: content,
                });
                
                aibitat?.socket?.send("reportStreamEvent", {
                  type: "chatId",
                  uuid,
                  chatId: aibitat.trackedChatId,
                });

                return `[SUCCESS: The requested ${this.output_type} was successfully generated and sent directly to the user. Do not try to output it again.]`;
              }

              return `[Sub-Agent Result]:\n${textResult}`;
            } catch (error) {
              aibitat?.handlerProps?.log?.(`[Sub-Agent ${this.agentName}] Error: ${error.message}`);
              return `[ERROR: The sub-agent encountered an error: ${error.message}]`;
            }
          },
        });
      },
    };
  }
}

module.exports = SubAgent;
