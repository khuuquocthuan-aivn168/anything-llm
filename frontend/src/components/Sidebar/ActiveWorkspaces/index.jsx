import React, { useState, useEffect } from "react";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Workspace from "@/models/workspace";
import ManageWorkspace, {
  useManageWorkspaceModal,
} from "../../Modals/ManageWorkspace";
import paths from "@/utils/paths";
import { Link, useParams, useNavigate, useMatch } from "react-router-dom";
import { GearSix, UploadSimple, DotsSixVertical } from "@phosphor-icons/react";
import useUser from "@/hooks/useUser";
import ThreadContainer from "./ThreadContainer";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import showToast from "@/utils/toast";
import { LAST_VISITED_WORKSPACE } from "@/utils/constants";
import { safeJsonParse } from "@/utils/request";
import { useVisibility } from "@/VisibilityContext";
import cn from "@/utils/cn";

export default function ActiveWorkspaces() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { isVisible } = useVisibility();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWs, setSelectedWs] = useState(null);
  const { showing, showModal, hideModal } = useManageWorkspaceModal();
  const { user } = useUser();
  const isInWorkspaceSettings = !!useMatch("/workspace/:slug/settings/:tab");
  const isHomePage = !!useMatch("/");

  useEffect(() => {
    async function getWorkspaces() {
      const workspaces = await Workspace.all();
      setLoading(false);
      setWorkspaces(Workspace.orderWorkspaces(workspaces));
    }
    getWorkspaces();
  }, []);

  if (loading) {
    return (
      <Skeleton.default
        height={40}
        width="100%"
        count={5}
        baseColor="var(--theme-sidebar-item-default)"
        highlightColor="var(--theme-sidebar-item-hover)"
        enableAnimation={true}
        className="my-1"
      />
    );
  }

  /**
   * Reorders workspaces in the UI via localstorage on client side.
   * @param {number} startIndex - the index of the workspace to move
   * @param {number} endIndex - the index to move the workspace to
   */
  function reorderWorkspaces(startIndex, endIndex) {
    const reorderedWorkspaces = Array.from(workspaces);
    const [removed] = reorderedWorkspaces.splice(startIndex, 1);
    reorderedWorkspaces.splice(endIndex, 0, removed);
    setWorkspaces(reorderedWorkspaces);
    const success = Workspace.storeWorkspaceOrder(
      reorderedWorkspaces.map((w) => w.id)
    );
    if (!success) {
      showToast("Failed to reorder workspaces", "error");
      Workspace.all().then((workspaces) => setWorkspaces(workspaces));
    }
  }

  const onDragEnd = (result) => {
    if (!result.destination) return;
    reorderWorkspaces(result.source.index, result.destination.index);
  };

  // When on the home page, resolve which workspace should be virtually active
  const virtualActiveSlug = (() => {
    if (!isHomePage || workspaces.length === 0) return null;
    const lastVisited = safeJsonParse(
      localStorage.getItem(LAST_VISITED_WORKSPACE)
    );
    if (
      lastVisited?.slug &&
      workspaces.some((ws) => ws.slug === lastVisited.slug)
    )
      return lastVisited.slug;
    return workspaces[0]?.slug ?? null;
  })();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="workspaces">
        {(provided) => (
          <div
            role="list"
            aria-label="Workspaces"
            className="flex flex-col gap-y-[8px]"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {workspaces.map((workspace, index) => {
              const isVirtuallyActive = workspace.slug === virtualActiveSlug;
              const isActive = workspace.slug === slug || isVirtuallyActive;
              return (
                <Draggable
                  key={workspace.id}
                  draggableId={workspace.id.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex flex-col w-full group ${
                        snapshot.isDragging ? "opacity-50" : ""
                      }`}
                      role="listitem"
                    >
                      <div className="flex w-full items-center justify-between gap-x-2">
                        <Link
                          to={paths.workspace.chat(workspace.slug)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex w-full min-w-0 flex-grow items-center gap-x-2 rounded-lg py-[6px] pl-1 pr-2",
                            "transition-all duration-200",
                            isActive
                              ? "bg-[#EAF4FC] font-semibold text-[#3A6FB5]"
                              : "bg-white/30 text-sidebar-muted hover:bg-white/45 hover:translate-x-1",
                            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF] focus-visible:outline-offset-2"
                          )}
                        >
                          <div className="flex w-full min-w-0 flex-row items-center justify-between">
                            <div
                              {...provided.dragHandleProps}
                              className="mr-[3px] shrink-0 cursor-grab"
                            >
                              <DotsSixVertical
                                size={20}
                                className={
                                  isActive ? "text-[#5B8FD4]" : "text-sidebar-icon/80"
                                }
                                weight="bold"
                              />
                            </div>
                            <div
                              data-tooltip-id="workspace-name"
                              data-tooltip-content={workspace.name}
                              className="flex min-w-0 flex-grow items-center overflow-hidden"
                            >
                              <p
                                className={cn(
                                  "w-full truncate text-[14px] leading-loose",
                                  isActive
                                    ? "font-semibold text-[#3A6FB5]"
                                    : "font-medium text-sidebar-muted"
                                )}
                              >
                                {workspace.name}
                              </p>
                            </div>
                            {user?.role !== "default" && (
                              <div
                                className={`flex items-center gap-x-[2px] transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedWs(workspace);
                                    showModal();
                                  }}
                                  data-tooltip-id="upload-workspace"
                                  data-tooltip-content="Upload documents to this workspace for RAG indexing"
                                  className={`group/upload border-none rounded-lg flex items-center justify-center ml-auto p-[2px] transition-colors duration-250 ${isActive ? "hover:bg-[#D6E9FA]" : "hover:bg-white/55"}`}
                                >
                                  <UploadSimple
                                    className={`h-[20px] w-[20px] ${isActive ? "text-[#5B8FD4] hover:text-[#3A6FB5]" : "text-sidebar-icon/80 hover:text-[#4F8CFF]"}`}
                                  />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(
                                      isInWorkspaceSettings
                                        ? paths.workspace.chat(workspace.slug)
                                        : paths.workspace.settings.generalAppearance(
                                            workspace.slug
                                          )
                                    );
                                  }}
                                  className={`group/gear rounded-lg flex items-center justify-center ml-auto p-[2px] transition-colors duration-250 ${isActive ? "hover:bg-[#D6E9FA]" : "hover:bg-white/55"}`}
                                  aria-label="Cài đặt chung"
                                  data-tooltip-id="gear-workspace"
                                  data-tooltip-content="Cài đặt chung"
                                >
                                  <GearSix
                                    color={
                                      isInWorkspaceSettings &&
                                      workspace.slug === slug
                                        ? "#4F8CFF"
                                        : undefined
                                    }
                                    className={`h-[20px] w-[20px] ${isActive ? "text-[#5B8FD4] hover:text-[#3A6FB5]" : "text-sidebar-icon/80 hover:text-[#4F8CFF]"}`}
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                        </Link>
                      </div>
                      {isVisible("threads") && isActive && (
                        <ThreadContainer
                          workspace={workspace}
                          isActive={isActive}
                          isVirtualThread={isVirtuallyActive}
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {showing && (
        <ManageWorkspace
          hideModal={hideModal}
          providedSlug={selectedWs ? selectedWs.slug : null}
        />
      )}
    </DragDropContext>
  );
}
