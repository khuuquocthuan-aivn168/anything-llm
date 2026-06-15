import React, { useState } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import { X } from "@phosphor-icons/react";
import MCPServers from "@/models/mcpServers";
import showToast from "@/utils/toast";

export default function NewMCPServerModal({ isOpen, closeModal, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "stdio",
    url: "",
    command: "",
    args: "",
    env: "{\n  \n}",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
      };

      if (formData.type === "sse") {
        payload.url = formData.url;
      } else {
        payload.command = formData.command;
        payload.args = formData.args.split("\n").filter((a) => a.trim());
        try {
          payload.env = formData.env ? JSON.parse(formData.env) : {};
        } catch (e) {
          showToast("Environment variables must be valid JSON", "error");
          setLoading(false);
          return;
        }
      }

      const { success, error } = await MCPServers.createServer(payload);
      
      if (success) {
        showToast("MCP Server added successfully", "success");
        onSuccess();
        closeModal();
      } else {
        showToast(error || "Failed to add MCP Server", "error");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow-xl border border-theme-modal-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-modal-border">
          <h3 className="text-xl font-semibold text-white">
            Thêm Máy chủ MCP (Add MCP Server)
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
                Server Name
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
                Only alphanumeric characters and dashes.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Transport Type
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
                    Command
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
                    Arguments (One per line)
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
                    Environment Variables (JSON format)
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

            <div className="flex justify-end pt-4 border-t border-theme-modal-border">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-white hover:bg-theme-bg-primary rounded-lg transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-theme-sidebar-border hover:bg-theme-sidebar-border/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Add Server"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalWrapper>
  );
}
