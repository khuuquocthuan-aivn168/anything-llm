import { API_BASE } from "../utils/constants";
import { baseHeaders } from "../utils/request";

const SubAgents = {
  getAll: async () => {
    return await fetch(`${API_BASE}/admin/sub-agents`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.subAgents || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  },

  create: async (data) => {
    return await fetch(`${API_BASE}/admin/sub-agents`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },

  update: async (uuid, data) => {
    return await fetch(`${API_BASE}/admin/sub-agents/${uuid}`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },

  delete: async (uuid) => {
    return await fetch(`${API_BASE}/admin/sub-agents/${uuid}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
};

export default SubAgents;
