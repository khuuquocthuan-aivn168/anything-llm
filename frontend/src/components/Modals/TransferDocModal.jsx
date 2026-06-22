import React, { useRef, useState } from "react";
import { X, Info, Calendar, MagicWand } from "@phosphor-icons/react";
import ModalWrapper from "@/components/ModalWrapper";

const noop = () => false;

export default function TransferDocModal({ hideModal = noop, onSubmit = noop }) {
  const formEl = useRef(null);
  
  // Visibility toggles
  const [showFollow, setShowFollow] = useState(false);
  const [showDirection, setShowDirection] = useState(false);
  const [showDraftConsult, setShowDraftConsult] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {};
    const form = new FormData(formEl.current);
    for (let [key, value] of form.entries()) {
      data[key] = value;
    }
    onSubmit(data);
    hideModal();
  };

  const InputField = ({ id, label, placeholder, type = "text" }) => (
    <div className="flex flex-col md:flex-row md:items-center gap-y-1 gap-x-4">
      <div className="md:w-1/3 shrink-0">
        <label htmlFor={id} className="block text-sm font-medium text-white">
          {label}
        </label>
      </div>
      <div className="w-full">
        <input
          name={id}
          type={type}
          id={id}
          className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
    </div>
  );

  return (
    <ModalWrapper isOpen={true}>
      <div className="w-full max-w-4xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative p-6 border-b rounded-t border-theme-modal-border shrink-0">
          <div className="w-full flex gap-x-2 items-center">
            <Info size={24} className="text-blue-400" weight="fill" />
            <h3 className="text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap">
              Thông tin xử lý văn bản
            </h3>
          </div>
          <button
            onClick={hideModal}
            type="button"
            className="absolute top-4 right-4 transition-all duration-300 bg-transparent rounded-lg text-sm p-1 inline-flex items-center hover:bg-theme-modal-border hover:border-theme-modal-border hover:border-opacity-50 border-transparent border"
          >
            <X size={24} weight="bold" className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="h-full w-full overflow-y-auto px-8 py-6">
          <form ref={formEl} onSubmit={handleSubmit} className="space-y-6">
            
            {/* Core Fields */}
            <div className="space-y-4">
              <InputField 
                id="mainProcessor" 
                label="Xử lý chính:" 
                placeholder="+ Chọn người, phòng ban xử lý chính" 
              />
              <InputField 
                id="participants" 
                label="Phối hợp xử lý:" 
                placeholder="+ Chọn người, phòng ban phối hợp xử lý" 
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4 pt-2 text-sm">
              <div className="md:w-1/3 hidden md:block"></div>
              <div className="flex flex-wrap gap-2 text-blue-400">
                <button type="button" onClick={() => setShowFollow(!showFollow)} className="hover:underline hover:text-blue-300">
                  {showFollow ? "Ẩn người theo dõi" : "Hiện người theo dõi"}
                </button>
                <span className="text-gray-500">|</span>
                <button type="button" onClick={() => setShowDirection(!showDirection)} className="hover:underline hover:text-blue-300">
                  {showDirection ? "Ẩn thông tin chỉ đạo" : "Hiện thông tin chỉ đạo"}
                </button>
                <span className="text-gray-500">|</span>
                <button type="button" onClick={() => setShowDraftConsult(!showDraftConsult)} className="hover:underline hover:text-blue-300">
                  {showDraftConsult ? "Ẩn lấy ý kiến dự thảo" : "Hiện lấy ý kiến dự thảo"}
                </button>
              </div>
            </div>

            {/* Draft Consult Section */}
            {showDraftConsult && (
              <div className="p-4 rounded-lg bg-theme-sidebar-border/30 border border-theme-modal-border space-y-4">
                <InputField 
                  id="draftConsultUnit" 
                  label="Đơn vị cần lấy ý kiến:" 
                  placeholder="+ Chọn đơn vị hoặc nhóm đơn vị" 
                />
              </div>
            )}

            {/* Follow Section */}
            {showFollow && (
              <div className="p-4 rounded-lg bg-theme-sidebar-border/30 border border-theme-modal-border space-y-4">
                <InputField 
                  id="follower" 
                  label="Theo dõi:" 
                  placeholder="+ Chọn người, phòng ban theo dõi" 
                />
                <div className="flex flex-col md:flex-row md:items-center gap-y-1 gap-x-4">
                  <div className="md:w-1/3 shrink-0">
                    <label htmlFor="followDeadline" className="block text-sm font-medium text-white">
                      Hạn theo dõi:
                    </label>
                  </div>
                  <div className="w-full md:w-1/3 relative">
                    <input
                      name="followDeadline"
                      type="date"
                      id="followDeadline"
                      className="border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Direction Section */}
            {showDirection && (
              <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30 space-y-4">
                <h4 className="text-blue-400 font-bold mb-2">Thông tin chỉ đạo:</h4>
                <InputField 
                  id="director" 
                  label="Người chỉ đạo (*):" 
                  placeholder="+ Chọn người chỉ đạo" 
                />
                <div className="flex flex-col md:flex-row md:items-center gap-y-1 gap-x-4">
                  <div className="md:w-1/3 shrink-0">
                    <label htmlFor="directionDate" className="block text-sm font-medium text-white">
                      Ngày chỉ đạo:
                    </label>
                  </div>
                  <div className="w-full md:w-1/3 relative">
                    <input
                      name="directionDate"
                      type="date"
                      id="directionDate"
                      className="border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-y-1 gap-x-4">
                  <div className="md:w-1/3 shrink-0 pt-2">
                    <label htmlFor="directionNote" className="block text-sm font-medium text-white">
                      Nội dung chỉ đạo (*):
                    </label>
                  </div>
                  <div className="w-full relative">
                    <textarea
                      name="directionNote"
                      id="directionNote"
                      rows="2"
                      className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5 resize-y"
                      placeholder="Nhập nội dung chỉ đạo..."
                    ></textarea>
                    <MagicWand className="absolute right-3 top-3 text-gray-400" size={18} />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-y-1 gap-x-4">
                  <div className="md:w-1/3 shrink-0"></div>
                  <div className="w-full">
                    <label className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="directionWatch" 
                        defaultChecked 
                        className="rounded bg-theme-settings-input-bg border-none"
                      />
                      <span>Cần theo dõi tình hình xử lý</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom fields: Deadline, Priority, Content */}
            <div className="space-y-4 pt-4 border-t border-theme-modal-border">
              <div className="flex flex-col md:flex-row md:items-center gap-y-1 gap-x-4">
                <div className="md:w-1/3 shrink-0">
                  <label htmlFor="deadlineDate" className="block text-sm font-medium text-white">
                    Hạn xử lý:
                  </label>
                </div>
                <div className="w-full md:w-1/2 flex items-center gap-2">
                  <input
                    name="deadlineDays"
                    type="number"
                    id="deadlineDays"
                    placeholder="Số ngày"
                    className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-1/3 p-2.5 text-right"
                  />
                  <input
                    name="deadlineDate"
                    type="date"
                    id="deadlineDate"
                    className="border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-2/3 p-2.5"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-y-1 gap-x-4">
                <div className="md:w-1/3 shrink-0">
                  <label htmlFor="priority" className="block text-sm font-medium text-white">
                    Độ khẩn:
                  </label>
                </div>
                <div className="w-full md:w-1/2">
                  <select
                    name="priority"
                    id="priority"
                    className="border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                  >
                    <option value="0">Bình thường</option>
                    <option value="1">Khẩn</option>
                    <option value="2">Thượng khẩn</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-y-1 gap-x-4">
                <div className="md:w-1/3 shrink-0 pt-2">
                  <label htmlFor="content" className="block text-sm font-medium text-white">
                    Nội dung:
                  </label>
                </div>
                <div className="w-full relative">
                  <textarea
                    name="content"
                    id="content"
                    rows="4"
                    className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5 resize-y"
                    placeholder="Nội dung xử lý..."
                  ></textarea>
                  <MagicWand className="absolute right-3 top-3 text-gray-400" size={18} />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex w-full justify-end items-center p-6 space-x-2 border-t border-theme-modal-border rounded-b shrink-0 bg-theme-bg-secondary">
          <button
            type="button"
            onClick={hideModal}
            className="transition-all duration-300 bg-transparent text-white border border-slate-500 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            className="transition-all duration-300 bg-white text-black hover:opacity-60 px-4 py-2 rounded-lg text-sm"
          >
            Lưu cấu hình
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export function useTransferDocModal() {
  const [showing, setShowing] = useState(false);
  const showModal = () => setShowing(true);
  const hideModal = () => setShowing(false);

  return { showing, showModal, hideModal };
}
