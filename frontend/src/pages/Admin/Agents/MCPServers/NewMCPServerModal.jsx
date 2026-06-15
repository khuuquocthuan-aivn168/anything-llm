import React, { useState } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import { X } from "@phosphor-icons/react";
import MCPServers from "@/models/mcpServers";
import showToast from "@/utils/toast";

export default function NewMCPServerModal({ isOpen, closeModal, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [jsonConfig, setJsonConfig] = useState("{\n  \"mcpServers\": {\n    \"my-server\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@modelcontextprotocol/server-everything\"]\n    }\n  }\n}");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsed = JSON.parse(jsonConfig);
      
      // Cho phép copy paste nguyên block "mcpServers" hoặc chỉ config của các server
      const serversToProcess = parsed.mcpServers ? parsed.mcpServers : parsed;
      
      let successCount = 0;
      let errorMsgs = [];

      for (const [name, config] of Object.entries(serversToProcess)) {
        if (!name || typeof config !== 'object') continue;
        
        let type = config.type || (config.command ? "stdio" : "sse");
        
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

    } catch (error) {
      showToast("Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow-xl border border-theme-modal-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-modal-border">
          <h3 className="text-xl font-semibold text-white">
            Thêm cấu hình MCP (JSON)
          </h3>
          <button
            onClick={closeModal}
            className="text-theme-text-secondary hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                JSON Configuration
              </label>
              <p className="text-xs text-theme-text-secondary mb-3">
                Dán cấu hình máy chủ MCP dưới định dạng JSON (có thể copy từ cấu hình của Claude Desktop).
              </p>
              <textarea
                required
                rows={12}
                className="w-full font-mono text-sm bg-theme-bg-primary text-white border border-theme-modal-border rounded-lg px-4 py-3 focus:outline-none focus:border-theme-sidebar-border"
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
              />
            </div>

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
