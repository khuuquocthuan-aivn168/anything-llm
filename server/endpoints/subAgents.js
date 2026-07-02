const { SubAgents } = require("../models/subAgents");
const { reqBody } = require("../utils/http");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid } = require("../utils/middleware/multiUserProtected");
const { v4: uuidv4 } = require("uuid");

function subAgentsEndpoints(app) {
  if (!app) return;

  // Get all sub agents
  app.get(
    "/admin/sub-agents",
    [validatedRequest, flexUserRoleValid(["admin", "manager"])],
    async (request, response) => {
      try {
        const subAgents = await SubAgents.get();
        return response.status(200).json({
          subAgents,
          error: null,
        });
      } catch (e) {
        console.error(e);
        return response.status(500).json({
          success: false,
          error: "Failed to get sub-agents",
        });
      }
    }
  );

  // Create a new sub agent
  app.post(
    "/admin/sub-agents",
    [validatedRequest, flexUserRoleValid(["admin", "manager"])],
    async (request, response) => {
      try {
        const body = reqBody(request);
        const newAgent = {
          uuid: uuidv4(),
          name: body.name,
          description: body.description,
          system_prompt: body.system_prompt,
          provider: body.provider,
          model: body.model,
          input_type: body.input_type || "text",
          output_type: body.output_type || "text",
        };

        const { subAgent, message } = await SubAgents.create(newAgent);
        
        if (!subAgent) {
          return response.status(400).json({ success: false, error: message });
        }

        return response.status(200).json({ success: true, subAgent, error: null });
      } catch (e) {
        console.error(e);
        return response.status(500).json({ success: false, error: e.message });
      }
    }
  );

  // Update a sub agent
  app.post(
    "/admin/sub-agents/:uuid",
    [validatedRequest, flexUserRoleValid(["admin", "manager"])],
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const updates = reqBody(request);
        
        const { subAgent, message } = await SubAgents.update(uuid, updates);
        
        if (!subAgent) {
          return response.status(400).json({ success: false, error: message });
        }

        return response.status(200).json({ success: true, subAgent, error: null });
      } catch (e) {
        console.error(e);
        return response.status(500).json({ success: false, error: e.message });
      }
    }
  );

  // Delete a sub agent
  app.delete(
    "/admin/sub-agents/:uuid",
    [validatedRequest, flexUserRoleValid(["admin", "manager"])],
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const { success, message } = await SubAgents.delete(uuid);
        
        if (!success) {
          return response.status(400).json({ success: false, error: message });
        }

        return response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.error(e);
        return response.status(500).json({ success: false, error: e.message });
      }
    }
  );
}

module.exports = { subAgentsEndpoints };
