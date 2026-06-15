import React, { useState } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import { X } from "@phosphor-icons/react";
import MCPServers from "@/models/mcpServers";
import showToast from "@/utils/toast";

export default function NewMCPServerModal({ isOpen, closeModal, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("form"); // "form" | "json" | "openapi"

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "stdio",
    url: "",
    command: "",
    args: "",
    env: "{\n  \n}",
  });

  // JSON State
  const [jsonConfig, setJsonConfig] = useState("{\n  \"mcpServers\": {\n    \"my-server\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@modelcontextprotocol/server-everything\"]\n    }\n  }\n}");

  // OpenAPI State
  const [openApiState, setOpenApiState] = useState({
    name: "",
    token: "",
    json: "{\n  \"openapi\": \"3.0.3\",\n  \"info\": {\n    \"title\": \"My API\",\n    \"version\": \"1.0.0\"\n  },\n  \"paths\": {}\n}"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "json") {
        const parsed = JSON.parse(jsonConfig);
        const serversToProcess = parsed.mcpServers ? parsed.mcpServers : parsed;
        
        let successCount = 0;
        let errorMsgs = [];

        for (const [name, config] of Object.entries(serversToProcess)) {
          if (!name || typeof config !== 'object') continue;
          
          let type = config.type || (config.command ? "stdio" : "sse");
          if (type === "sse" && !config.url) {
             errorMsgs.push(`${name}: URL is required for SSE transport`);
             continue;
          }

          const payload = {
            name,
            type,
            url: config.url || "",
            command: config.command || "",
            args: config.args || [],
            env: config.env ? JSON.stringify(config.env) : "{}",
          };

          const { success, error } = await MCPServers.createServer(payload);
          if (success) {
            successCount++;
          } else {
            errorMsgs.push(`${name}: ${error}`);
          }
        }

        if (errorMsgs.length > 0) {
          showToast(`Lỗi: ${errorMsgs.join(", ")}`, "error");
        }
        if (successCount > 0) {
          showToast(`Đã thêm thành công ${successCount} máy chủ MCP`, "success");
          onSuccess();
          closeModal();
        } else if (errorMsgs.length === 0) {
          showToast("Không tìm thấy cấu hình máy chủ hợp lệ", "warning");
        }

      } else if (mode === "openapi") {
        try {
          const parsedOpenApi = JSON.parse(openApiState.json);
          const payload = {
            type: "openapi",
            name: openApiState.name,
            openApiJson: parsedOpenApi,
            openApiToken: openApiState.token
          };

          const { success, error } = await MCPServers.createServer(payload);
          if (success) {
            showToast("Đã biến OpenAPI thành MCP Server thành công", "success");
            onSuccess();
            closeModal();
          } else {
            showToast(error || "Không thể tạo máy chủ từ OpenAPI", "error");
          }
        } catch (e) {
          showToast("Định dạng OpenAPI JSON không hợp lệ.", "error");
          setLoading(false);
          return;
        }
      } else {
        // Form Mode
        const payload = {
          name: formData.name,
          type: formData.type,
        };

        if (formData.type === "sse") {
          if (!formData.url) throw new Error("URL is required for SSE transport");
          payload.url = formData.url;
        } else {
          if (!formData.command) throw new Error("Command is required for Stdio transport");
          payload.command = formData.command;
          payload.args = formData.args.split("\n").filter((a) => a.trim());
          try {
            payload.env = formData.env ? JSON.parse(formData.env) : {};
          } catch (e) {
            throw new Error("Environment variables must be valid JSON");
          }
        }

        const { success, error } = await MCPServers.createServer(payload);
        if (success) {
          showToast("Đã thêm máy chủ MCP thành công", "success");
          onSuccess();
          closeModal();
        } else {
          showToast(error || "Không thể thêm máy chủ", "error");
        }
      }
    } catch (error) {
      showToast(error.message || "Định dạng JSON không hợp lệ.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow-xl border border-theme-modal-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-modal-border">
          <h3 className="text-xl font-semibold text-white">
            Thêm Máy chủ MCP
          </h3>
          <button
            onClick={closeModal}
            className="text-theme-text-secondary hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-x-4 mb-6 border-b border-theme-modal-border pb-2">
            <button
              type="button"
              onClick={() => setMode("form")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${mode === "form" ? "border-theme-sidebar-border text-white" : "border-transparent text-theme-text-secondary hover:text-white"}`}
            >
              Nhập theo Form
            </button>
            <button
              type="button"
              onClick={() => setMode("json")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${mode === "json" ? "border-theme-sidebar-border text-white" : "border-transparent text-theme-text-secondary hover:text-white"}`}
            >
              Nhập bằng JSON
            </button>
            <button
              type="button"
              onClick={() => setMode("openapi")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${mode === "openapi" ? "border-theme-sidebar-border text-white" : "border-transparent text-theme-text-secondary hover:text-white"}`}
            >
              Nhập từ OpenAPI
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "openapi" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Tên API/Skill
                  </label>
                  <input
                    required
                    type="text"
                    pattern="^[a-zA-Z0-9-]+$"
                    placeholder="aiha-chat-api"
                    className="w-full bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                    value={openApiState.name}
                    onChange={(e) =>
                      setOpenApiState({ ...openApiState, name: e.target.value })
                    }
                  />
                  <p className="text-xs text-theme-text-secondary mt-1">
                    Tên không dấu, không chứa khoảng trắng.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    API Key (Bearer Token)
                  </label>
                  <input
                    type="text"
                    placeholder="Tuỳ chọn nếu API yêu cầu xác thực..."
                    className="w-full bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                    value={openApiState.token}
                    onChange={(e) =>
                      setOpenApiState({ ...openApiState, token: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    OpenAPI JSON Schema
                  </label>
                  <p className="text-xs text-theme-text-secondary mb-3">
                    Dán nội dung JSON OpenAPI của bạn vào đây. Hệ thống sẽ tự động phân tích các endpoints và biến chúng thành MCP Tools.
                  </p>
                  <textarea
                    required
                    rows={8}
                    className="w-full font-mono text-sm bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-3 focus:outline-none focus:border-theme-sidebar-border"
                    value={openApiState.json}
                    onChange={(e) => setOpenApiState({ ...openApiState, json: e.target.value })}
                  />
                </div>
              </>
            ) : mode === "json" ? (
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  JSON Configuration
                </label>
                <p className="text-xs text-theme-text-secondary mb-3">
                  Dán cấu hình máy chủ MCP dưới định dạng JSON. Bạn có thể sử dụng <code>"type": "sse"</code> hoặc <code>"type": "stdio"</code>.
                </p>
                <textarea
                  required
                  rows={12}
                  className="w-full font-mono text-sm bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-3 focus:outline-none focus:border-theme-sidebar-border"
                  value={jsonConfig}
                  onChange={(e) => setJsonConfig(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Tên máy chủ (Server Name)
                  </label>
                  <input
                    required
                    type="text"
                    pattern="^[a-zA-Z0-9-]+$"
                    placeholder="my-mcp-server"
                    className="w-full bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <p className="text-xs text-theme-text-secondary mt-1">
                    Chỉ dùng chữ cái, số và dấu gạch ngang.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Loại kết nối (Transport Type)
                  </label>
                  <select
                    className="w-full bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="stdio">Stdio (Command Line)</option>
                    <option value="sse">SSE (Server-Sent Events)</option>
                  </select>
                </div>

                {formData.type === "sse" ? (
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Server URL
                    </label>
                    <input
                      required
                      type="url"
                      placeholder="http://localhost:3000/sse"
                      className="w-full bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Câu lệnh (Command)
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="npx"
                        className="w-full bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                        value={formData.command}
                        onChange={(e) =>
                          setFormData({ ...formData, command: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Tham số (Arguments - Mỗi tham số một dòng)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="-y&#10;@modelcontextprotocol/server-everything"
                        className="w-full bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                        value={formData.args}
                        onChange={(e) =>
                          setFormData({ ...formData, args: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Biến môi trường (Environment Variables - JSON)
                      </label>
                      <textarea
                        rows={4}
                        placeholder={'{\n  "API_KEY": "your-key-here"\n}'}
                        className="w-full font-mono bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-sidebar-border"
                        value={formData.env}
                        onChange={(e) =>
                          setFormData({ ...formData, env: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex justify-end pt-4 border-t border-theme-modal-border">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-white hover:bg-theme-bg-primary rounded-lg transition-colors mr-2"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-theme-sidebar-border hover:bg-theme-sidebar-border/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Lưu máy chủ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalWrapper>
  );
}
