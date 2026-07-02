const { SystemSettings } = require("../../models/systemSettings");
const { safeJsonParse } = require("../http");
const Provider = require("./aibitat/providers/ai-provider");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

class SubAgent {
  constructor(config) {
    this.config = config;
    const cleanUuid = (config.uuid || config.id).replace(/-/g, "_");
    this.name = `subagent_${cleanUuid}`;
    this.agentName = config.name;
    this.description = config.description;
    this.system_prompt = config.system_prompt;
    this.provider = config.provider;
    this.model = config.model;
    this.input_type = config.input_type || "text";
    this.output_type = config.output_type || "text";
  }

  static async activeSubAgents() {
    const { SubAgents } = require("../../models/subAgents");
    const subAgents = await SubAgents.get();
    return subAgents.map((agent) => `subagent_${agent.uuid.replace(/-/g, "_")}`);
  }

  static async loadSubAgent(agentUuid, aibitat) {
    const { SubAgents } = require("../../models/subAgents");
    const agentConfig = await SubAgents.getOne({ uuid: agentUuid });
    if (!agentConfig) return null;

    return new SubAgent(agentConfig);
  }

  /**
   * Save a base64 image to the storage directory and return its accessible URL path.
   * @param {string} base64Data - The base64 encoded image data (with or without data: prefix)
   * @param {string} [ext="png"] - The file extension
   * @returns {string} The URL path to access the saved image
   */
  static saveBase64Image(base64Data, ext = "png") {
    const storageDir = process.env.STORAGE_DIR
      ? path.resolve(process.env.STORAGE_DIR, "sub-agent-outputs")
      : path.resolve(__dirname, "../../storage/sub-agent-outputs");

    if (!fs.existsSync(storageDir))
      fs.mkdirSync(storageDir, { recursive: true });

    // Strip data URI prefix if present
    let cleanBase64 = base64Data;
    const dataUriMatch = base64Data.match(
      /^data:image\/([a-zA-Z+]+);base64,(.+)$/
    );
    if (dataUriMatch) {
      ext = dataUriMatch[1] === "jpeg" ? "jpg" : dataUriMatch[1];
      cleanBase64 = dataUriMatch[2];
    }

    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.resolve(storageDir, filename);
    fs.writeFileSync(filepath, Buffer.from(cleanBase64, "base64"));

    // Return a URL path that the frontend can access via the server's static file serving
    return `/api/sub-agent-outputs/${filename}`;
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
                description: "The detailed task, query, or prompt for this agent to complete",
              },
              query: {
                type: "string",
                description: "The query or prompt to process",
              },
              prompt: {
                type: "string",
                description: "The prompt to process",
              }
            },
            additionalProperties: true,
          },
          handler: async (args) => {
            const task = args.task || args.query || args.prompt || Object.values(args)[0] || "No task provided";
            try {
              aibitat?.handlerProps?.log?.(
                `[Sub-Agent ${self.agentName}] Executing task: ${task}`
              );
              if (typeof aibitat?.introspect === "function") {
                aibitat.introspect(
                  `[Sub-Agent] Calling ${self.agentName} to perform task...`
                );
              }

              // Get the provider instance to access its raw client
              const aiProvider = aibitat.getProviderForConfig({
                provider: self.provider,
                model: self.model,
              });

              // Build messages array in the standard OpenAI format
              const messages = [
                { role: "system", content: self.system_prompt },
                { role: "user", content: task },
              ];

              // For image/audio output models, call the raw client directly
              // to capture multimodal response content (images, audio, etc.)
              if (
                self.output_type === "image" ||
                self.output_type === "text+image"
              ) {
                return await self.#handleImageGeneration(
                  aiProvider,
                  messages,
                  aibitat
                );
              }

              // For text-only output, use the standard complete() method
              const result = await aiProvider.complete(messages, []);
              const textResult = result?.textResponse || "";

              if (!textResult || textResult.trim().length === 0) {
                return `[ERROR: Sub-agent ${self.agentName} returned an empty response. The model may not support this task.]`;
              }

              aibitat?.handlerProps?.log?.(
                `[Sub-Agent ${self.agentName}] Task completed successfully.`
              );
              if (typeof aibitat?.introspect === "function") {
                aibitat.introspect(
                  `[Sub-Agent] ${self.agentName} completed the task.`
                );
              }

              return `[Sub-Agent ${self.agentName} Result]:\n${textResult}`;
            } catch (error) {
              aibitat?.handlerProps?.log?.(
                `[Sub-Agent ${self.agentName}] Error: ${error.message}`
              );
              return `[ERROR: The sub-agent encountered an error: ${error.message}]`;
            }
          },
        });
      },
    };
  }

  /**
   * Handle image generation by calling the raw OpenAI-compatible client
   * and parsing the multimodal response for image content.
   * @param {Object} aiProvider - The aibitat provider instance
   * @param {Array} messages - The messages array
   * @param {Object} aibitat - The aibitat instance
   * @returns {string} Result string for the agent
   */
  async #handleImageGeneration(aiProvider, messages, aibitat) {
    const client = aiProvider.client || aiProvider._client;
    if (!client) {
      return `[ERROR: Could not access the raw API client for ${this.provider}. Image generation requires direct API access.]`;
    }

    aibitat?.handlerProps?.log?.(
      `[Sub-Agent ${this.agentName}] Calling model for image generation...`
    );

    try {
      const collectedTexts = [];
      const collectedImages = [];
      
      // 1. Try the dedicated Image Generation API (Recommended by OpenRouter & OpenAI for image models)
      if (typeof client.images?.generate === 'function') {
        try {
          // Extract the task from the messages array for the prompt
          const userMessage = [...messages].reverse().find(m => m.role === 'user')?.content || "";
          const systemMessage = messages.find(m => m.role === 'system')?.content || "";
          const prompt = `${systemMessage}\n\nTask: ${userMessage}`.trim();
          
          const imageResponse = await client.images.generate({
            model: this.model,
            prompt: prompt,
            n: 1,
            response_format: "b64_json"
          });
          
          if (imageResponse?.data?.length > 0) {
            for (const item of imageResponse.data) {
              if (item.b64_json) {
                collectedImages.push(`data:image/png;base64,${item.b64_json}`);
              } else if (item.url) {
                collectedImages.push(item.url);
              }
            }
          }
        } catch (imgError) {
          console.error(`[Sub-Agent] client.images.generate failed, falling back to chat.completions: ${imgError.message}`);
        }
      }

      // 2. Fallback to Chat Completions API (For multimodal models returning images in chat)
      if (collectedImages.length === 0) {
        const response = await client.chat.completions.create({
          model: this.model,
          messages,
        });

        if (!response?.choices?.length) {
          return `[ERROR: The image generation model returned no content.]`;
        }

        const message = response.choices[0].message;
        
        // OpenRouter specific format: `message.images` array
        if (Array.isArray(message?.images)) {
          for (const img of message.images) {
            if (img.type === "image_url" && img.image_url?.url) {
              collectedImages.push(img.image_url.url);
            }
          }
        }

        const content = message?.content || "";
        // Handle multimodal response (array of content parts)
        if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === "text" && part.text) {
              collectedTexts.push(part.text);
            } else if (part.type === "image_url" && part.image_url?.url) {
              collectedImages.push(part.image_url.url);
            } else if (
              part.type === "image" &&
              (part.url || part.image_url?.url || part.data)
            ) {
              collectedImages.push(
                part.url || part.image_url?.url || part.data
              );
            }
          }
        } else if (typeof content === "string") {
          // Some models return plain text with markdown image links
          const imgRegex = /!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g;
          let match;
          while ((match = imgRegex.exec(content)) !== null) {
            collectedImages.push(match[1]);
          }
          // Also check for raw base64 data
          const base64Regex =
            /data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/g;
          let b64Match;
          while ((b64Match = base64Regex.exec(content)) !== null) {
            if (!collectedImages.includes(b64Match[0])) {
              collectedImages.push(b64Match[0]);
            }
          }
          collectedTexts.push(
            content.replace(imgRegex, "").replace(base64Regex, "").trim()
          );
        }
      }

      // Process collected images - save base64 ones to disk
      const imageUrls = [];
      for (const imgSrc of collectedImages) {
        if (imgSrc.startsWith("data:image/")) {
          // Save base64 image to storage
          const savedPath = SubAgent.saveBase64Image(imgSrc);
          imageUrls.push(savedPath);
        } else if (imgSrc.startsWith("http")) {
          imageUrls.push(imgSrc);
        }
      }

      if (imageUrls.length > 0) {
        aibitat?.handlerProps?.log?.(
          `[Sub-Agent ${this.agentName}] Generated ${imageUrls.length} image(s).`
        );
        if (typeof aibitat?.introspect === "function") {
          aibitat.introspect(
            `[Sub-Agent] ${this.agentName} generated ${imageUrls.length} image(s) successfully.`
          );
        }

        // Format images as markdown for display in chat
        const imageMarkdown = imageUrls
          .map(
            (url, i) =>
              `![${this.agentName} Image ${i + 1}](${url})`
          )
          .join("\n\n");

        const textPart =
          collectedTexts.filter((t) => t.length > 0).join("\n") || "";

        return `[Sub-Agent ${this.agentName} Result]:\n${textPart}\n\n${imageMarkdown}`;
      }

      // No images found in response - return text
      const textOnly = collectedTexts.join("\n") || content?.toString() || "";
      if (textOnly.trim().length === 0) {
        return `[ERROR: The image generation model did not return any image or text. The model "${this.model}" may not support image generation.]`;
      }

      return `[Sub-Agent ${this.agentName} Result]:\n${textOnly}`;
    } catch (error) {
      aibitat?.handlerProps?.log?.(
        `[Sub-Agent ${this.agentName}] Image generation error: ${error.message}`
      );
      return `[ERROR: Image generation failed: ${error.message}]`;
    }
  }
}

module.exports = SubAgent;
