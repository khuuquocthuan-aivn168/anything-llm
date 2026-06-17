import React, { useEffect, useState, useRef } from "react";
import DBConnection from "./DBConnection";
import { Plus, Database, CircleNotch } from "@phosphor-icons/react";
import NewSQLConnection from "./SQLConnectionModal";
import { useModal } from "@/hooks/useModal";
import SQLAgentImage from "@/media/agents/sql-agent.png";
import Admin from "@/models/admin";
import Toggle from "@/components/lib/Toggle";
import { Tooltip } from "react-tooltip";

const PANEL_STYLES = `
  @keyframes sqlSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .sql-animate-slide-in {
    animation: sqlSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

export default function AgentSQLConnectorSelection({
  skill,
  title,
  description,
  toggleSkill,
  enabled = false,
  setHasChanges,
  hasChanges = false,
}) {
  const { isOpen, openModal, closeModal } = useModal();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevHasChanges = useRef(hasChanges);

  // Load connections on mount
  useEffect(() => {
    setLoading(true);
    Admin.systemPreferencesByFields(["agent_sql_connections"])
      .then((res) => setConnections(res?.settings?.agent_sql_connections ?? []))
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, []);

  // Refresh connections from backend when save completes (hasChanges: true -> false)
  // This ensures we get clean data without stale action properties
  useEffect(() => {
    if (prevHasChanges.current === true && hasChanges === false) {
      Admin.systemPreferencesByFields(["agent_sql_connections"])
        .then((res) =>
          setConnections(res?.settings?.agent_sql_connections ?? [])
        )
        .catch(() => {});
    }
    prevHasChanges.current = hasChanges;
  }, [hasChanges]);

  /**
   * Marks a connection for removal by adding action: "remove".
   * The connection stays in the array (for undo capability) until saved.
   * @param {string} databaseId - The database_id of the connection to remove
   */
  function handleRemoveConnection(databaseId) {
    setHasChanges(true);
    setConnections((prev) =>
      prev.map((conn) => {
        if (conn.database_id === databaseId)
          return { ...conn, action: "remove" };
        return conn;
      })
    );
  }

  /**
   * Updates an existing connection by replacing it in the local state.
   * This removes the old connection (by originalDatabaseId) and adds the updated version.
   *
   * Note: The old connection is removed from local state immediately, but the backend
   * handles the actual update logic when saved. See mergeConnections in server/models/systemSettings.js
   *
   * @param {Object} updatedConnection - The updated connection data
   * @param {string} updatedConnection.originalDatabaseId - The original database_id before the update
   * @param {string} updatedConnection.database_id - The new database_id
   * @param {string} updatedConnection.action - Should be "update"
   */
  function handleUpdateConnection(updatedConnection) {
    setHasChanges(true);
    setConnections((prev) =>
      prev.map((conn) =>
        conn.database_id === updatedConnection.originalDatabaseId
          ? updatedConnection
          : conn
      )
    );
  }
  /**
   * Adds a new connection to the local state with action: "add".
   * The backend will validate and deduplicate when saved.
   * @param {Object} newConnection - The new connection data with action: "add"
   */
  function handleAddConnection(newConnection) {
    setHasChanges(true);
    setConnections((prev) => [...prev, newConnection]);
  }

  return (
    <>
      <style>{PANEL_STYLES}</style>
      <div className="p-3">
        <div className="sql-animate-slide-in flex flex-col gap-y-6 max-w-[500px]">
          {/* Header */}
          <div className="flex w-full justify-between items-center bg-zinc-800/10 p-3 rounded-2xl border border-zinc-800/20 backdrop-blur-sm">
            <div className="flex items-center gap-x-3">
              <div className="p-2 bg-theme-bg-secondary rounded-xl shadow-inner border border-zinc-800/30">
                <Database
                  size={24}
                  color="var(--theme-text-primary)"
                  weight="bold"
                />
              </div>
              <label
                htmlFor="name"
                className="text-theme-text-primary text-base font-bold tracking-wide"
              >
                {title}
              </label>
            </div>
            <Toggle
              size="lg"
              enabled={enabled}
              onChange={() => toggleSkill(skill)}
            />
          </div>

          {/* Image */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800/30 shadow-md group">
            <img
              src={SQLAgentImage}
              alt="SQL Agent"
              className="w-full transform group-hover:scale-102 transition-transform duration-700 ease-out"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-y-1">
            <p className="text-theme-text-secondary text-opacity-80 text-xs font-medium leading-relaxed pl-1">
              {description}
            </p>
          </div>

          {/* Configuration */}
          {enabled && (
            <div className="sql-animate-slide-in flex flex-col gap-y-5 mt-2">
              <input
                name="system::agent_sql_connections"
                type="hidden"
                value={JSON.stringify(connections)}
              />
              <input
                type="hidden"
                value={JSON.stringify(
                  connections.filter((conn) => conn.action !== "remove")
                )}
              />
              <div className="h-[1px] bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-transparent w-full" />
              <div className="flex justify-between items-center">
                <p className="text-theme-text-primary font-bold text-sm tracking-wide">
                  Your database connections
                </p>
              </div>
              <div className="flex flex-col gap-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <CircleNotch
                      size={28}
                      className="animate-spin text-theme-text-primary opacity-80"
                    />
                  </div>
                ) : (
                  connections
                    .filter((connection) => connection.action !== "remove")
                    .map((connection) => (
                      <DBConnection
                        key={connection.database_id}
                        connection={connection}
                        onRemove={handleRemoveConnection}
                        onUpdate={handleUpdateConnection}
                        setHasChanges={setHasChanges}
                        connections={connections}
                      />
                    ))
                )}
                <button
                  type="button"
                  onClick={openModal}
                  className="w-fit relative flex h-[40px] items-center border-none hover:bg-zinc-800/20 rounded-xl transition-all duration-300"
                >
                  <div className="flex w-full gap-x-2 items-center p-4">
                    <div className="bg-theme-bg-secondary p-2 rounded-xl h-[24px] w-[24px] flex items-center justify-center border border-zinc-800/30">
                      <Plus
                        weight="bold"
                        size={14}
                        className="shrink-0 text-theme-text-primary"
                      />
                    </div>
                    <p className="text-left text-theme-text-primary text-sm font-medium">
                      New SQL connection
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <NewSQLConnection
        isOpen={isOpen}
        closeModal={closeModal}
        setHasChanges={setHasChanges}
        onSubmit={handleAddConnection}
        connections={connections}
      />
      <Tooltip
        id="edit-sql-connection-tooltip"
        content="Edit SQL connection"
        place="top"
        delayShow={300}
        className="tooltip !text-xs !opacity-100"
        style={{
          maxWidth: "250px",
          whiteSpace: "normal",
          wordWrap: "break-word",
        }}
      />
      <Tooltip
        id="delete-sql-connection-tooltip"
        content="Delete SQL connection"
        place="top"
        delayShow={300}
        className="tooltip !text-xs !opacity-100"
        style={{
          maxWidth: "250px",
          whiteSpace: "normal",
          wordWrap: "break-word",
        }}
      />
    </>
  );
}
