import SettingsSidebar from "@/components/SettingsSidebar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";
import Admin from "@/models/admin";
import System from "@/models/system";
import showToast from "@/utils/toast";
import { Plus, Trash, PencilSimple, Robot, Brain, Image, MusicNotes, TextT, ArrowLeft } from "@phosphor-icons/react";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function SubAgents() {
  const { t } = useTranslation();
  const [subAgents, setSubAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    input_type: "text",
    output_type: "text",
    provider: "openrouter",
    model: "",
    system_prompt: "",
  });

  const [availableModels, setAvailableModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      setLoading(true);
      const res = await Admin.systemPreferencesByFields(["sub_agents"]);
      if (res && res.settings && res.settings.sub_agents) {
        try {
          setSubAgents(JSON.parse(res.settings.sub_agents));
        } catch {
          setSubAgents([]);
        }
      }
      setLoading(false);
    }
    loadPreferences();
  }, []);

  // Fetch models for chosen provider
  useEffect(() => {
    if (!formData.provider) return;
    async function fetchModels() {
      setFetchingModels(true);
      const { models } = await System.customModels(formData.provider);
      setAvailableModels(models || []);
      setFetchingModels(false);
    }
    fetchModels();
  }, [formData.provider]);

  // Apply strict filtering on OpenRouter models based on input/output types
  useEffect(() => {
    if (formData.provider === "openrouter") {
      const filtered = availableModels.filter((model) => {
        const modality = model.architecture?.modality || "text->text";
        
        // Filter based on input_type (Vision/Image)
        if (formData.input_type === "image" && !modality.startsWith("text+image")) {
          return false;
        }

        // Filter based on output_type (Image/Audio)
        if (formData.output_type === "image" && !modality.endsWith("->image")) {
          return false;
        }
        if (formData.output_type === "audio" && !modality.endsWith("->audio")) {
          return false;
        }
        if (formData.output_type === "text" && modality.endsWith("->image")) {
          // If expecting text output, filter out image generators
          return false;
        }

        return true;
      });
      setFilteredModels(filtered);
    } else {
      // For other providers, show all models as they lack standard modality metadata
      setFilteredModels(availableModels);
    }
  }, [availableModels, formData.input_type, formData.output_type]);

  const handleOpenAdd = () => {
    setEditingAgent(null);
    setFormData({
      name: "",
      description: "",
      input_type: "text",
      output_type: "text",
      provider: "openrouter",
      model: "",
      system_prompt: "",
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      input_type: agent.input_type || "text",
      output_type: agent.output_type || "text",
      provider: agent.provider || "openrouter",
      model: agent.model || "",
      system_prompt: agent.system_prompt || "",
    });
    setOpenModal(true);
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this sub-agent?")) return;
    const updated = subAgents.filter((a) => a.id !== agentId);
    setSubAgents(updated);
    const { success, error } = await Admin.updateSystemPreferences({
      sub_agents: JSON.stringify(updated),
    });
    if (success) {
      showToast("Sub-agent deleted successfully", "success");
    } else {
      showToast(`Error deleting sub-agent: ${error}`, "error");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.model) {
      showToast("Please fill in the Name and select a Model", "error");
      return;
    }

    let updatedList;
    if (editingAgent) {
      // Update
      updatedList = subAgents.map((a) =>
        a.id === editingAgent.id ? { ...a, ...formData } : a
      );
    } else {
      // Add
      updatedList = [...subAgents, { ...formData, id: crypto.randomUUID() }];
    }

    setSubAgents(updatedList);
    setOpenModal(false);

    const { success, error } = await Admin.updateSystemPreferences({
      sub_agents: JSON.stringify(updatedList),
    });

    if (success) {
      showToast(
        editingAgent
          ? "Sub-agent updated successfully"
          : "Sub-agent created successfully",
        "success"
      );
    } else {
      showToast(`Error saving sub-agent: ${error}`, "error");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5 text-purple-400" />;
      case "audio":
        return <MusicNotes className="w-5 h-5 text-blue-400" />;
      default:
        return <TextT className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-theme-bg-container text-white">
      <SettingsSidebar />
      <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 flex flex-col justify-start">
        <div className="w-full flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Robot className="w-8 h-8 text-sky-400" />
              Multi-Agent Orchestration
            </h1>
            <p className="text-sm text-theme-text-secondary mt-1">
              Configure specialized Sub-Agents that the Manager Agent (`@agent`) can delegate tasks to dynamically.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-medium transition-all shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Sub-Agent
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Skeleton.default count={3} height={120} className="rounded-xl" />
          </div>
        ) : subAgents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-theme-bg-sidebar border border-theme-sidebar-border rounded-2xl max-w-xl mx-auto w-full shadow-inner mt-10">
            <Brain className="w-16 h-16 text-sky-400/50 mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">No Sub-Agents Defined</h3>
            <p className="text-sm text-theme-text-secondary text-center mb-6">
              Create sub-agents for specialized tasks like creating images, synthesising voice, or deep analysis.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {subAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex flex-col justify-between p-5 bg-theme-bg-sidebar/50 backdrop-blur-md border border-theme-sidebar-border rounded-2xl hover:border-sky-500/50 transition-all shadow-lg group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-sky-300 flex items-center gap-2">
                      <Robot className="w-6 h-6" />
                      {agent.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(agent)}
                        className="p-1.5 hover:bg-theme-bg-secondary rounded-lg transition-colors"
                        title="Edit Agent"
                      >
                        <PencilSimple className="w-5 h-5 text-theme-text-secondary hover:text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-1.5 hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Delete Agent"
                      >
                        <Trash className="w-5 h-5 text-red-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-theme-text-secondary line-clamp-2 mb-4">
                    {agent.description || "No description provided."}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-theme-bg-secondary rounded-full border border-theme-sidebar-border">
                      Input: {getTypeIcon(agent.input_type)} {agent.input_type.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-theme-bg-secondary rounded-full border border-theme-sidebar-border">
                      Output: {getTypeIcon(agent.output_type)} {agent.output_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-theme-text-secondary bg-theme-bg-secondary/40 p-2.5 rounded-lg border border-theme-sidebar-border/30">
                    <div className="font-semibold text-white/60 mb-0.5">Model Preference:</div>
                    <div className="truncate font-mono text-sky-400/80">{agent.model}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Premium Modal */}
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-theme-bg-sidebar border border-theme-sidebar-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
              <div className="p-6 border-b border-theme-sidebar-border flex justify-between items-center bg-theme-bg-sidebar/90">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Robot className="w-6 h-6 text-sky-400" />
                  {editingAgent ? `Edit Sub-Agent: ${editingAgent.name}` : "Create New Sub-Agent"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-theme-text-primary mb-1">Agent Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ImageGenerator"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-theme-text-primary mb-1">Description (How/when the Manager should use this agent)</label>
                  <textarea
                    required
                    placeholder="e.g. Generates high-quality images. Use this agent when the user asks to draw or visualize things."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-theme-text-primary mb-1">Input Type</label>
                    <select
                      value={formData.input_type}
                      onChange={(e) => setFormData({ ...formData, input_type: e.target.value })}
                      className="w-full bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="text">Text Only</option>
                      <option value="image">Image (Vision)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-theme-text-primary mb-1">Output Type</label>
                    <select
                      value={formData.output_type}
                      onChange={(e) => setFormData({ ...formData, output_type: e.target.value })}
                      className="w-full bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="text">Text/Analysis</option>
                      <option value="image">Generated Image</option>
                      <option value="audio">Synthesized Audio</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-theme-text-primary mb-1">Model Provider</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value, model: "" })}
                      className="w-full bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="openrouter">OpenRouter</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="groq">Groq</option>
                      <option value="ollama">Ollama (Local)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-theme-text-primary mb-1 flex items-center gap-1.5">
                      Model
                      {fetchingModels && <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>}
                    </label>
                    <select
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      disabled={fetchingModels}
                      className="w-full bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 disabled:opacity-55"
                    >
                      <option value="">Select a Model</option>
                      {filteredModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.id}
                        </option>
                      ))}
                    </select>
                    {formData.provider === "openrouter" && filteredModels.length === 0 && !fetchingModels && (
                      <p className="text-xs text-amber-400 mt-1">
                        ⚠️ No matching OpenRouter models found for this input/output type combination.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-theme-text-primary mb-1">System Prompt (Instructions for this agent)</label>
                  <textarea
                    required
                    placeholder="e.g. You are a professional painter. When given a request, write a detailed and concise Stable Diffusion prompt to generate that visual. ONLY reply with the generated Stable Diffusion prompt, nothing else."
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={4}
                    className="w-full bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-theme-sidebar-border">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-5 py-2 bg-theme-bg-secondary hover:bg-theme-bg-secondary/80 rounded-lg text-theme-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-semibold transition-all shadow-md active:scale-95"
                  >
                    Save Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
