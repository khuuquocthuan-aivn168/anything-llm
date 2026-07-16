import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const StorageFiles = {
  /**
   * Download a file from the server
   * @param {string} filename - The filename to download
   * @returns {Promise<Blob|null>}
   */
  download: async function (storageFilename) {
    return await fetch(
      `${API_BASE}/agent-skills/generated-files/${encodeURIComponent(storageFilename)}`,
      { headers: baseHeaders() }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to download file");
        return res.blob();
      })
      .catch((e) => {
        console.error("Download failed:", e);
        return null;
      });
  },

  /**
   * Load an inline PDF preview of a generated file
   * @param {string} storageFilename - The storage filename to preview
   * @returns {Promise<Blob|null>}
   */
  preview: async (storageFilename) => {
    return await fetch(
      `${API_BASE}/agent-skills/generated-files/${storageFilename}/preview`,
      { method: "GET", headers: baseHeaders() }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load preview");
        return res.blob();
      })
      .catch((e) => {
        console.error(e);
        return null;
      });
  },

  /**
   * List the recent generated files visible to the current user (the "shelf").
   * @returns {Promise<{files: Array, windowDays: number}>}
   */
  listRecent: async function () {
    return await fetch(`${API_BASE}/agent-skills/generated-files`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to list generated files");
        return res.json();
      })
      .catch((e) => {
        console.error(e);
        return { files: [], windowDays: 7 };
      });
  },

  /**
   * Remove a single file from the shelf view (does not delete the file itself).
   * @param {string} storageFilename
   * @returns {Promise<boolean>}
   */
  dismiss: async function (storageFilename) {
    return await fetch(
      `${API_BASE}/agent-skills/generated-files/shelf/${encodeURIComponent(
        storageFilename
      )}`,
      { method: "DELETE", headers: baseHeaders() }
    )
      .then((res) => res.ok)
      .catch((e) => {
        console.error(e);
        return false;
      });
  },

  /**
   * Clear the whole shelf view for the current user (does not delete files).
   * @returns {Promise<boolean>}
   */
  clearShelf: async function () {
    return await fetch(`${API_BASE}/agent-skills/generated-files/shelf`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.ok)
      .catch((e) => {
        console.error(e);
        return false;
      });
  },
};

export default StorageFiles;
