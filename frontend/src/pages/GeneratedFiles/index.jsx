import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { isMobile } from "react-device-detect";
import { saveAs } from "file-saver";
import {
  DownloadSimple,
  Eye,
  Trash,
  CircleNotch,
  MagnifyingGlass,
  FileArrowDown,
} from "@phosphor-icons/react";
import StorageFiles from "@/models/files";
import { usePreview } from "@/components/DocumentPreview/PreviewContext";
import { PREVIEWABLE_EXTENSIONS } from "@/components/DocumentPreview/previewable";
import { humanFileSize } from "@/utils/numbers";
import showToast from "@/utils/toast";

/**
 * "Recent generated files" shelf — a convenience view of files an agent created
 * in the last N days. Files and their in-chat download cards are never modified
 * here; removing an item only hides it from this shelf (see backend
 * endpoints/generatedFilesShelf.js).
 */
export default function GeneratedFiles() {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [windowDays, setWindowDays] = useState(7);
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);

  async function loadFiles() {
    setLoading(true);
    const { files = [], windowDays = 7 } = await StorageFiles.listRecent();
    setFiles(files);
    setWindowDays(windowDays);
    setLoading(false);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => {
      return (
        f.filename?.toLowerCase().includes(q) ||
        f.prompt?.toLowerCase().includes(q) ||
        f.workspaceName?.toLowerCase().includes(q)
      );
    });
  }, [files, search]);

  const handleDismiss = async (storageFilename) => {
    // Optimistic removal from the shelf view.
    setFiles((prev) =>
      prev.filter((f) => f.storageFilename !== storageFilename)
    );
    const ok = await StorageFiles.dismiss(storageFilename);
    if (!ok) {
      showToast("Không thể gỡ file khỏi danh sách.", "error");
      loadFiles();
    }
  };

  const handleClearAll = async () => {
    if (files.length === 0) return;
    const confirmed = window.confirm(
      "Gỡ tất cả file khỏi danh sách gần đây? File và lịch sử trò chuyện của bạn vẫn được giữ nguyên."
    );
    if (!confirmed) return;
    setClearing(true);
    const ok = await StorageFiles.clearShelf();
    setClearing(false);
    if (ok) {
      setFiles([]);
      showToast("Đã dọn danh sách file gần đây.", "success");
    } else {
      showToast("Không thể dọn danh sách.", "error");
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      {!isMobile && <Sidebar />}
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll flex flex-col"
      >
        <div className="flex flex-col w-full px-6 py-6 md:px-8 md:py-8 gap-y-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-y-3">
            <div>
              <p className="text-lg font-semibold text-white light:text-theme-text-primary">
                File đã tạo gần đây
              </p>
              <p className="text-xs text-theme-text-secondary mt-1">
                Nơi tạm lưu các file agent vừa tạo trong {windowDays} ngày gần
                nhất để bạn dễ tìm. File cũ hơn sẽ tự rời khỏi đây — bản gốc
                trong cuộc trò chuyện vẫn luôn được giữ.
              </p>
            </div>
            <button
              onClick={handleClearAll}
              disabled={clearing || files.length === 0}
              className="flex items-center gap-x-2 px-3 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed self-start whitespace-nowrap"
            >
              {clearing ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <Trash size={16} weight="bold" />
              )}
              <span>Xóa tất cả</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-md">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên file, câu lệnh, hoặc workspace..."
              className="w-full bg-theme-settings-input-bg text-white light:text-theme-text-primary placeholder:text-theme-text-secondary text-sm rounded-lg pl-9 pr-3 py-2 border border-theme-sidebar-border focus:outline-none focus:border-primary-button"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-theme-text-secondary">
              <CircleNotch size={24} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasFiles={files.length > 0} />
          ) : (
            <div className="flex flex-col gap-y-2">
              {filtered.map((file) => (
                <FileRow
                  key={file.storageFilename}
                  file={file}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFiles }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-y-3">
      <FileArrowDown size={40} className="text-theme-text-secondary" />
      <p className="text-theme-text-secondary text-sm max-w-sm">
        {hasFiles
          ? "Không có file nào khớp với tìm kiếm."
          : "Chưa có file nào gần đây. Khi agent tạo file (PPTX, Excel, Word...), chúng sẽ xuất hiện ở đây."}
      </p>
    </div>
  );
}

function FileRow({ file, onDismiss }) {
  const { open } = usePreview();
  const [downloading, setDownloading] = useState(false);
  const { badge, badgeBg, badgeText, fileType } = getFileDisplayInfo(
    file.filename
  );
  const canPreview = PREVIEWABLE_EXTENSIONS.has(file.extension);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await StorageFiles.download(file.storageFilename);
      if (!blob) throw new Error("Failed to download");
      saveAs(blob, file.filename || file.storageFilename);
    } catch {
      showToast("Không thể tải file.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = () => {
    if (!canPreview) return;
    open({
      storageFilename: file.storageFilename,
      filename: file.filename,
      fileSize: file.fileSize,
    });
  };

  return (
    <div className="group flex items-center justify-between gap-x-3 bg-theme-bg-primary light:bg-slate-100 border border-theme-sidebar-border rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-x-3 min-w-0">
        <div
          className={`${badgeBg} ${badgeText} rounded-lg flex items-center justify-center flex-shrink-0 h-[44px] w-[44px] text-xs font-bold`}
        >
          {badge}
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-white light:text-slate-900 text-sm font-medium truncate leading-snug">
            {file.filename || "Unknown file"}
          </p>
          <p className="text-theme-text-secondary text-xs leading-snug truncate">
            {humanFileSize(file.fileSize, true, 1)}
            {file.fileSize ? " · " : ""}
            {fileType}
            {file.workspaceName ? ` · ${file.workspaceName}` : ""}
            {file.createdAt
              ? ` · ${new Date(file.createdAt).toLocaleString()}`
              : ""}
          </p>
          {file.prompt ? (
            <p
              className="text-theme-text-secondary text-xs italic truncate leading-snug mt-0.5 opacity-80"
              title={file.prompt}
            >
              “{file.prompt}”
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-x-2 flex-shrink-0">
        {canPreview && (
          <button
            onClick={handlePreview}
            className="flex items-center gap-x-1.5 px-3 py-2 rounded-lg border border-theme-sidebar-border hover:bg-theme-bg-secondary transition-colors text-white light:text-theme-text-primary text-sm font-medium"
            title="Xem trước"
          >
            <Eye size={16} weight="bold" />
            <span className="hidden sm:inline">Xem trước</span>
          </button>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-x-1.5 px-3 py-2 rounded-lg border border-theme-sidebar-border hover:bg-theme-bg-secondary transition-colors text-white light:text-theme-text-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Tải về"
        >
          {downloading ? (
            <CircleNotch size={16} className="animate-spin" />
          ) : (
            <DownloadSimple size={16} weight="bold" />
          )}
          <span className="hidden sm:inline">Tải về</span>
        </button>
        <button
          onClick={() => onDismiss(file.storageFilename)}
          className="flex items-center justify-center p-2 rounded-lg border border-transparent text-theme-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Gỡ khỏi danh sách (không xóa file gốc)"
        >
          <Trash size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

/**
 * Display metadata (badge label/colors) for a file based on its extension.
 * Mirrors FileDownloadCard's getFileDisplayInfo.
 */
function getFileDisplayInfo(filename) {
  const extension = filename?.split(".")?.pop()?.toLowerCase() ?? "txt";
  switch (extension) {
    case "pptx":
    case "ppt":
      return {
        badge: "PPT",
        badgeBg: "bg-orange-100",
        badgeText: "text-orange-700",
        fileType: "PowerPoint",
      };
    case "pdf":
      return {
        badge: "PDF",
        badgeBg: "bg-red-100",
        badgeText: "text-red-700",
        fileType: "PDF Document",
      };
    case "doc":
    case "docx":
      return {
        badge: "DOC",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-700",
        fileType: "Word Document",
      };
    case "xls":
    case "xlsx":
      return {
        badge: "XLS",
        badgeBg: "bg-green-100",
        badgeText: "text-green-700",
        fileType: "Spreadsheet",
      };
    case "csv":
      return {
        badge: "CSV",
        badgeBg: "bg-green-100",
        badgeText: "text-green-700",
        fileType: "Spreadsheet",
      };
    default:
      return {
        badge: extension.toUpperCase().slice(0, 4),
        badgeBg: "bg-slate-200",
        badgeText: "text-slate-700",
        fileType: "File",
      };
  }
}
