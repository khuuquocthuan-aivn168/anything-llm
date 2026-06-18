const { SystemSettings } = require("../models/systemSettings");
const bcrypt = require("bcryptjs");

function visibilityEndpoints(app) {
  if (!app) return;

  // Get status: whether visibility password has been set
  app.get("/visibility/status", async (_, response) => {
    try {
      const password = await SystemSettings.get({
        label: "sidebar_visibility_password",
      });
      return response.status(200).json({ passwordSet: !!password?.value });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ error: e.message });
    }
  });

  // Verify/Authenticate password
  app.post("/visibility/auth", async (request, response) => {
    try {
      const { password } = request.body;
      const storedPasswordSetting = await SystemSettings.get({
        label: "sidebar_visibility_password",
      });
      if (!storedPasswordSetting || !storedPasswordSetting.value) {
        return response.status(400).json({ error: "Password not set yet." });
      }
      const matches = bcrypt.compareSync(password, storedPasswordSetting.value);
      return response.status(200).json({ valid: matches });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ error: e.message });
    }
  });

  // Set initial password (only allowed if not already set)
  app.post("/visibility/set-password", async (request, response) => {
    try {
      const { password } = request.body;
      const storedPasswordSetting = await SystemSettings.get({
        label: "sidebar_visibility_password",
      });
      if (storedPasswordSetting && storedPasswordSetting.value) {
        return response.status(400).json({ error: "Password is already set." });
      }

      if (!password || password.length < 4) {
        return response
          .status(400)
          .json({ error: "Password must be at least 4 characters long." });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      await SystemSettings._updateSettings({
        sidebar_visibility_password: hashedPassword,
      });

      return response.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ error: e.message });
    }
  });

  // Get current visibility config
  app.get("/visibility/config", async (_, response) => {
    try {
      const configSetting = await SystemSettings.get({
        label: "sidebar_visibility_config",
      });
      let config = {};
      if (configSetting && configSetting.value) {
        try {
          config = JSON.parse(configSetting.value);
        } catch (err) {
          config = {};
        }
      }
      return response.status(200).json({ config });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ error: e.message });
    }
  });

  // Update visibility config (requires password validation)
  app.post("/visibility/update", async (request, response) => {
    try {
      const { password, config } = request.body;
      const storedPasswordSetting = await SystemSettings.get({
        label: "sidebar_visibility_password",
      });
      if (!storedPasswordSetting || !storedPasswordSetting.value) {
        return response.status(400).json({ error: "Password not set." });
      }
      const matches = bcrypt.compareSync(password, storedPasswordSetting.value);
      if (!matches) {
        return response.status(401).json({ error: "Invalid password." });
      }

      await SystemSettings._updateSettings({
        sidebar_visibility_config: JSON.stringify(config || {}),
      });

      return response.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ error: e.message });
    }
  });
}

module.exports = { visibilityEndpoints };
