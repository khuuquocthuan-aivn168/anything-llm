import paths from "@/utils/paths";
import { FolderStar } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

/**
 * Footer icon that opens the "recent generated files" shelf page.
 */
export default function GeneratedFilesButton() {
  return (
    <div className="flex w-fit">
      <Link
        to={paths.generatedFiles()}
        className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
        aria-label="File đã tạo gần đây"
        data-tooltip-id="footer-item"
        data-tooltip-content="File đã tạo gần đây"
      >
        <FolderStar
          className="h-5 w-5 text-white light:text-slate-800"
          weight="fill"
        />
      </Link>
    </div>
  );
}
