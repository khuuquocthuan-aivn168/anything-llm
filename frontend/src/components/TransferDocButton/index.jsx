import React, { useState } from "react";
import { FileArrowUp } from "@phosphor-icons/react";
import TransferDocModal from "../Modals/TransferDocModal";
import cn from "@/utils/cn";

export default function TransferDocButton({ className = "" }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex w-fit">
        <button
          onClick={() => setShowModal(true)}
          className={cn(
            "transition-all duration-300 p-2 rounded-full",
            "border border-white/[0.55] bg-white/90 text-[#4F8CFF] shadow-sm",
            "hover:bg-white hover:text-[#2F6BFF] hover:shadow-md",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]",
            className
          )}
          aria-label="Cấu hình xử lý văn bản"
          data-tooltip-id="footer-item"
          data-tooltip-content="Cấu hình xử lý văn bản"
        >
          <FileArrowUp className="h-5 w-5" weight="fill" />
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
