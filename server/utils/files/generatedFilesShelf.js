const fs = require("fs");
const path = require("path");

/**
 * Persists the per-user state of the "recent generated files" shelf.
 *
 * The shelf is a convenience view of files an agent created in the last N days.
 * It does NOT own the files themselves (those live in storage/generated-files
 * and are referenced by workspace_chats). This store only remembers which files
 * a user has manually removed *from the shelf view* ("dismissed") and the
 * timestamp of a "clear all" action. Actual files and chat records are never
 * touched here.
 *
 * State lives in a single JSON file on disk so no database change is required:
 *   storage/generated-files-shelf.json
 * Shape:
 *   {
 *     "<key>": { "dismissed": ["pptx-<uuid>.pptx", ...], "clearedAt": "<ISO>|null" }
 *   }
 * where <key> is `user:<id>` in multi-user mode or `single` otherwise.
 */

const SHELF_WINDOW_DAYS = 7;

function storageRoot() {
  return (
    process.env.STORAGE_DIR || path.resolve(__dirname, "../../storage")
  );
}

function shelfFilePath() {
  return path.join(storageRoot(), "generated-files-shelf.json");
}

/**
 * Builds the per-identity key used to partition shelf state.
 * @param {{id: number}|null} user
 * @param {boolean} isMultiUser
 * @returns {string}
 */
function shelfKey(user, isMultiUser) {
  if (isMultiUser && user?.id) return `user:${user.id}`;
  return "single";
}

// Serialize read-modify-write cycles so concurrent requests don't clobber the
// file. All mutations chain off this promise.
let writeChain = Promise.resolve();

function readAll() {
  try {
    const file = shelfFilePath();
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("[generatedFilesShelf] readAll failed:", error.message);
    return {};
  }
}

function writeAll(state) {
  try {
    const file = shelfFilePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state), "utf8");
  } catch (error) {
    console.error("[generatedFilesShelf] writeAll failed:", error.message);
  }
}

/**
 * Returns the shelf state for a given identity key.
 * @param {string} key
 * @returns {{dismissed: string[], clearedAt: string|null}}
 */
function getState(key) {
  const entry = readAll()[key];
  return {
    dismissed: Array.isArray(entry?.dismissed) ? entry.dismissed : [],
    clearedAt: entry?.clearedAt || null,
  };
}

function mutate(key, updater) {
  writeChain = writeChain.then(() => {
    const state = readAll();
    const current = {
      dismissed: Array.isArray(state[key]?.dismissed)
        ? state[key].dismissed
        : [],
      clearedAt: state[key]?.clearedAt || null,
    };
    state[key] = updater(current);
    writeAll(state);
  });
  return writeChain;
}

/**
 * Marks a single file as removed from the shelf view for this identity.
 * @param {string} key
 * @param {string} storageFilename
 */
async function dismissFile(key, storageFilename) {
  await mutate(key, (current) => {
    const dismissed = new Set(current.dismissed);
    dismissed.add(storageFilename);
    return { dismissed: [...dismissed], clearedAt: current.clearedAt };
  });
}

/**
 * Clears the whole shelf for this identity by recording a cutoff timestamp.
 * Any file whose chat was created at/before this time is hidden; files created
 * afterwards still appear. Also resets the per-file dismissed list.
 * @param {string} key
 * @param {string} clearedAtISO
 */
async function clearAll(key, clearedAtISO) {
  await mutate(key, () => ({ dismissed: [], clearedAt: clearedAtISO }));
}

/**
 * Prunes the dismissed list down to filenames still inside the active window,
 * so the store cannot grow without bound as old files naturally age off.
 * @param {string} key
 * @param {Set<string>} activeFilenames - storage filenames still in the window
 */
async function pruneDismissed(key, activeFilenames) {
  const { dismissed } = getState(key);
  const kept = dismissed.filter((f) => activeFilenames.has(f));
  if (kept.length === dismissed.length) return;
  await mutate(key, (current) => ({
    dismissed: kept,
    clearedAt: current.clearedAt,
  }));
}

module.exports = {
  SHELF_WINDOW_DAYS,
  shelfKey,
  getState,
  dismissFile,
  clearAll,
  pruneDismissed,
};
