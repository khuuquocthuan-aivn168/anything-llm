import React, { useState } from "react";
import { FileArrowUp } from "@phosphor-icons/react";
import TransferDocModal from "../Modals/TransferDocModal";

export default function TransferDocButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex w-fit">
        <button
          onClick={() => setShowModal(true)}
          className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
          aria-label="Cấu hình xử lý văn bản"
          data-tooltip-id="footer-item"
          data-tooltip-content="Cấu hình xử lý văn bản"
        >
          <FileArrowUp
            className="h-5 w-5 text-white light:text-slate-800"
            weight="fill"
          />
        </button>
      </div>
      
      {showModal && (
        <TransferDocModal 
          hideModal={() => setShowModal(false)} 
          onSubmit={(data) => {
            console.log("Transfer Doc Config:", data);
            // In the future, we could save this to local storage or state
          }} 
        />
      )}
    </>
  );
}
