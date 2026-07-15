const {
  userFromSession,
  multiUserMode,
  safeJsonParse,
} = require("../utils/http");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { WorkspaceChats } = require("../models/workspaceChats");
const { Workspace } = require("../models/workspace");
const createFilesLib = require("../utils/agents/aibitat/plugins/create-files/lib");
const shelf = require("../utils/files/generatedFilesShelf");

/**
 * Endpoints backing the "recent generated files" shelf — a convenience view
 * that lists files an agent created in the last N days across the workspaces a
 * user can access. It is derived entirely from existing data (workspace_chats +
 * files on disk); the only extra state is the per-user dismiss/clear list kept
 * by utils/files/generatedFilesShelf (a JSON file, no DB).
 *
 * Removing a file here only hides it from this shelf. The physical file and the
 * download card inside the original chat are never modified.
 */
function generatedFilesShelfEndpoints(app) {
  if (!app) return;

  // List recent generated files visible to the requesting user.
  app.get(
    "/agent-skills/generated-files",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const isMultiUser = multiUserMode(response);
        const key = shelf.shelfKey(user, isMultiUser);

        const workspaces =
          isMultiUser && user
            ? await Workspace.whereWithUser(user)
            : await Workspace.where();
        const workspaceById = new Map(workspaces.map((w) => [w.id, w]));
        const workspaceIds = workspaces.map((w) => w.id);
        if (workspaceIds.length === 0)
          return response.status(200).json({ files: [] });

        const windowStart = new Date();
        windowStart.setDate(windowStart.getDate() - shelf.SHELF_WINDOW_DAYS);

        // Pull only recent, kept chats that actually reference a generated file.
        const chats = await WorkspaceChats.where(
          {
            workspaceId: { in: workspaceIds },
            include: true,
            createdAt: { gte: windowStart },
            response: { contains: "storageFilename" },
          },
          null,
          { id: "desc" }
        );

        // All storage filenames present in the current window (pre-filtering),
        // used to keep the dismissed list from growing unbounded.
        const activeFilenames = new Set();
        const files = [];
        for (const chat of chats) {
          const { outputs = [] } = safeJsonParse(chat.response, {
            outputs: [],
          });
          if (!Array.isArray(outputs)) continue;

          for (const output of outputs) {
            const payload = output?.payload;
            const storageFilename = payload?.storageFilename;
            if (!storageFilename) continue;
            if (!createFilesLib.parseFilename(storageFilename)) continue;
            activeFilenames.add(storageFilename);

            const workspace = workspaceById.get(chat.workspaceId);
            const displayFilename =
              payload.filename || payload.displayFilename || storageFilename;
            const extension =
              displayFilename.split(".").pop()?.toLowerCase() || "";

            files.push({
              storageFilename,
              filename: displayFilename,
              extension,
              fileSize: payload.fileSize ?? null,
              prompt: chat.prompt || "",
              chatId: chat.id,
              workspaceId: chat.workspaceId,
              workspaceName: workspace?.name || "",
              workspaceSlug: workspace?.slug || null,
              threadId: chat.thread_id || null,
              createdAt: chat.createdAt,
            });
          }
        }

        // Apply the user's shelf preferences (dismissed files + clear-all cutoff).
        const { dismissed, clearedAt } = shelf.getState(key);
        const dismissedSet = new Set(dismissed);
        const clearedAtMs = clearedAt ? new Date(clearedAt).getTime() : null;

        const visible = files.filter((f) => {
          if (dismissedSet.has(f.storageFilename)) return false;
          if (
            clearedAtMs !== null &&
            new Date(f.createdAt).getTime() <= clearedAtMs
          )
            return false;
          return true;
        });

        // Housekeeping: drop dismissed entries that have aged out of the window.
        shelf.pruneDismissed(key, activeFilenames).catch(() => {});

        return response.status(200).json({
          windowDays: shelf.SHELF_WINDOW_DAYS,
          files: visible,
        });
      } catch (error) {
        console.error("[generatedFilesShelf] list error:", error.message);
        return response
          .status(500)
          .json({ error: "Failed to list generated files" });
      }
    }
  );

  // Remove a single file from the shelf view (dismiss). Does not delete the file.
  app.delete(
    "/agent-skills/generated-files/shelf/:filename",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const isMultiUser = multiUserMode(response);
        const { filename } = request.params;

        if (!filename || !createFilesLib.parseFilename(filename))
          return response
            .status(400)
            .json({ error: "Invalid filename format" });

        const key = shelf.shelfKey(user, isMultiUser);
        await shelf.dismissFile(key, filename);
        return response.status(200).json({ success: true });
      } catch (error) {
        console.error("[generatedFilesShelf] dismiss error:", error.message);
        return response.status(500).json({ error: "Failed to remove file" });
      }
    }
  );

  // Clear the whole shelf view for this user. Does not delete any files.
  app.delete(
    "/agent-skills/generated-files/shelf",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const isMultiUser = multiUserMode(response);
        const key = shelf.shelfKey(user, isMultiUser);
        await shelf.clearAll(key, new Date().toISOString());
        return response.status(200).json({ success: true });
      } catch (error) {
        console.error("[generatedFilesShelf] clear error:", error.message);
        return response.status(500).json({ error: "Failed to clear shelf" });
      }
    }
  );
}

module.exports = { generatedFilesShelfEndpoints };
