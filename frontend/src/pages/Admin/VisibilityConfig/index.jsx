import React, { useEffect, useState } from "react";
import SettingsSidebar from "@/components/SettingsSidebar";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";
import showToast from "@/utils/toast";
import { Eye, EyeSlash, Key, ShieldCheck } from "@phosphor-icons/react";
import { API_BASE } from "@/utils/constants";
import { useVisibility } from "@/VisibilityContext";

export default function VisibilityConfig() {
  const { t } = useTranslation();
  const { refreshConfig } = useVisibility();
  
  const [passwordSet, setPasswordSet] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [visibilityMap, setVisibilityMap] = useState({
    // Sidebar FE
    "search-box": true,
    "new-workspace-button": true,
    "settings-button": true,
    "footer-custom-icons": true,
    "active-workspaces": true,
    "threads": true,

    // Settings categories & options
    "ai-providers": true,
    "llm": true,
    "vector-database": true,
    "embedder": true,
    "text-splitting": true,
    "voice-speech": true,
    "transcription": true,
    "model-router": true,
    
    "admin": true,
    "users": true,
    "workspaces": true,
    "workspace-chats": true,
    "invites": true,
    "default-system-prompt": true,
    
    "agent-skills": true,
    
    "customization": true,
    "interface": true,
    "branding": true,
    "chat": true,
    
    "channels": true,
    "available-channels-telegram": true,
    
    "tools": true,
    "embeds": true,
    "event-logs": true,
    "scheduled-jobs": true,
    "api-keys": true,
    "system-prompt-variables": true,
    "browser-extension": true,
    
    "privacy": true,
    "support-email": true,
    "app-version": true,
    "footer": true,
  });

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/visibility/status`);
      if (res.ok) {
        const data = await res.json();
        setPasswordSet(data.passwordSet);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/visibility/config`);
      if (res.ok) {
        const data = await res.json();
        const config = data.config || {};
        setVisibilityMap((prev) => {
          const updated = { ...prev };
          Object.keys(prev).forEach((key) => {
            if (config[key] !== undefined) {
              updated[key] = config[key];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkStatus();
    loadConfig();
  }, []);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu không khớp!", "error");
      return;
    }
    if (newPassword.length < 4) {
      showToast("Mật khẩu phải dài ít nhất 4 ký tự!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/visibility/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        showToast("Đặt mật khẩu quản trị ẩn thành công!", "success");
        setPassword(newPassword);
        setAuthenticated(true);
        setPasswordSet(true);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Không thể đặt mật khẩu.", "error");
      }
    } catch (err) {
      showToast("Đã xảy ra lỗi kết nối.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/visibility/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setAuthenticated(true);
          showToast("Xác thực thành công!", "success");
        } else {
          showToast("Sai mật khẩu!", "error");
        }
      } else {
        showToast("Xác thực thất bại.", "error");
      }
    } catch (err) {
      showToast("Đã xảy ra lỗi kết nối.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/visibility/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, config: visibilityMap }),
      });
      if (res.ok) {
        showToast("Lưu cấu hình hiển thị thành công!", "success");
        refreshConfig();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Không thể lưu cấu hình.", "error");
      }
    } catch (err) {
      showToast("Đã xảy ra lỗi kết nối.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleKey = (key) => {
    setVisibilityMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (checkingAuth) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-theme-bg-container">
        <p className="text-white text-lg">Đang kiểm tra trạng thái bảo mật...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-theme-bg-container px-4">
        <div className="w-full max-w-md bg-theme-bg-secondary p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center">
          <div className="p-4 bg-theme-bg-primary rounded-full mb-4 text-blue-500">
            <Key size={32} weight="bold" />
          </div>
          
          {!passwordSet ? (
            <form onSubmit={handleSetPassword} className="w-full flex flex-col gap-y-4">
              <h2 className="text-xl font-bold text-white text-center">Thiết lập mật khẩu quản trị ẩn</h2>
              <p className="text-xs text-theme-text-secondary text-center mb-2">
                Thiết lập mật khẩu đầu tiên để bảo vệ cấu hình ẩn sidebar & tabs cài đặt.
              </p>
              
              <div className="flex flex-col gap-y-1">
                <label className="text-xs font-semibold text-white">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="bg-zinc-950 text-white rounded-lg border border-white/10 p-3 focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-y-1">
                <label className="text-xs font-semibold text-white">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                  className="bg-zinc-950 text-white rounded-lg border border-white/10 p-3 focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
              >
                {isSubmitting ? "Đang xử lý..." : "Thiết lập & Đăng nhập"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="w-full flex flex-col gap-y-4">
              <h2 className="text-xl font-bold text-white text-center">Yêu cầu xác thực mật khẩu</h2>
              <p className="text-xs text-theme-text-secondary text-center mb-2">
                Hãy nhập mật khẩu quản trị ẩn để thay đổi cấu hình hiển thị giao diện.
              </p>

              <div className="flex flex-col gap-y-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu truy cập"
                  className="bg-zinc-950 text-white rounded-lg border border-white/10 p-3 focus:outline-none focus:border-blue-500 text-sm"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
              >
                {isSubmitting ? "Đang xác thực..." : "Xác nhận truy cập"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <SettingsSidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                Cấu hình ẩn / hiện Sidebar và Settings Tabs
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              Tích chọn để hiển thị phần đó trên giao diện; bỏ tích để ẩn phần đó đi đối với tất cả người dùng hệ thống.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="mt-6 space-y-6">
            {/* Sidebar Elements */}
            <div className="bg-theme-bg-primary/30 p-6 rounded-2xl border border-white/5 flex flex-col gap-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thành phần Sidebar chính (FE)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ToggleItem label="Hộp Tìm kiếm (Search Box)" active={visibilityMap["search-box"]} onToggle={() => toggleKey("search-box")} />
                <ToggleItem label="Nút Tạo Không gian (New Workspace)" active={visibilityMap["new-workspace-button"]} onToggle={() => toggleKey("new-workspace-button")} />
                <ToggleItem label="Nút Cài đặt (Settings button)" active={visibilityMap["settings-button"]} onToggle={() => toggleKey("settings-button")} />
                <ToggleItem label="Danh sách Không gian làm việc" active={visibilityMap["active-workspaces"]} onToggle={() => toggleKey("active-workspaces")} />
                <ToggleItem label="Nhánh hội thoại (Workspace Threads)" active={visibilityMap["threads"]} onToggle={() => toggleKey("threads")} />
                <ToggleItem label="Các icon liên kết custom ở Footer" active={visibilityMap["footer-custom-icons"]} onToggle={() => toggleKey("footer-custom-icons")} />
              </div>
            </div>

            {/* Settings Tabs Elements */}
            <div className="bg-theme-bg-primary/30 p-6 rounded-2xl border border-white/5 flex flex-col gap-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Các Tab / Danh mục Cài đặt</h3>
              
              <div className="flex flex-col gap-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-blue-400">Danh mục Nhà cung cấp AI (AI Providers)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleItem label="Hiển thị nhóm AI Providers" active={visibilityMap["ai-providers"]} onToggle={() => toggleKey("ai-providers")} />
                  <ToggleItem label="Tab LLM" active={visibilityMap["llm"]} onToggle={() => toggleKey("llm")} />
                  <ToggleItem label="Tab Vector Database" active={visibilityMap["vector-database"]} onToggle={() => toggleKey("vector-database")} />
                  <ToggleItem label="Tab Embedder" active={visibilityMap["embedder"]} onToggle={() => toggleKey("embedder")} />
                  <ToggleItem label="Tab Text Splitter" active={visibilityMap["text-splitting"]} onToggle={() => toggleKey("text-splitting")} />
                  <ToggleItem label="Tab Voice & Speech" active={visibilityMap["voice-speech"]} onToggle={() => toggleKey("voice-speech")} />
                  <ToggleItem label="Tab Transcription" active={visibilityMap["transcription"]} onToggle={() => toggleKey("transcription")} />
                  <ToggleItem label="Tab Model Router" active={visibilityMap["model-router"]} onToggle={() => toggleKey("model-router")} />
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-blue-400">Danh mục Quản trị viên (Admin Settings)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleItem label="Hiển thị nhóm Admin Settings" active={visibilityMap["admin"]} onToggle={() => toggleKey("admin")} />
                  <ToggleItem label="Quản lý Người dùng (Users)" active={visibilityMap["users"]} onToggle={() => toggleKey("users")} />
                  <ToggleItem label="Quản lý Không gian làm việc" active={visibilityMap["workspaces"]} onToggle={() => toggleKey("workspaces")} />
                  <ToggleItem label="Quản lý Hội thoại (Chats)" active={visibilityMap["workspace-chats"]} onToggle={() => toggleKey("workspace-chats")} />
                  <ToggleItem label="Lời mời (Invites)" active={visibilityMap["invites"]} onToggle={() => toggleKey("invites")} />
                  <ToggleItem label="System Prompt mặc định" active={visibilityMap["default-system-prompt"]} onToggle={() => toggleKey("default-system-prompt")} />
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-blue-400">Danh mục Tùy chỉnh (Customization)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleItem label="Hiển thị nhóm Customization" active={visibilityMap["customization"]} onToggle={() => toggleKey("customization")} />
                  <ToggleItem label="Giao diện (Interface)" active={visibilityMap["interface"]} onToggle={() => toggleKey("interface")} />
                  <ToggleItem label="Thương hiệu (Branding)" active={visibilityMap["branding"]} onToggle={() => toggleKey("branding")} />
                  <ToggleItem label="Cấu hình Chat" active={visibilityMap["chat"]} onToggle={() => toggleKey("chat")} />
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-blue-400">Danh mục Công cụ & Khác (Tools & Integrations)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleItem label="Kỹ năng của Agent (Agent Skills)" active={visibilityMap["agent-skills"]} onToggle={() => toggleKey("agent-skills")} />
                  <ToggleItem label="Hiển thị nhóm Kênh kết nối (Channels)" active={visibilityMap["channels"]} onToggle={() => toggleKey("channels")} />
                  <ToggleItem label="Kết nối Telegram" active={visibilityMap["available-channels-telegram"]} onToggle={() => toggleKey("available-channels-telegram")} />
                  <ToggleItem label="Hiển thị nhóm Công cụ (Tools)" active={visibilityMap["tools"]} onToggle={() => toggleKey("tools")} />
                  <ToggleItem label="Nhúng hội thoại (Embeds)" active={visibilityMap["embeds"]} onToggle={() => toggleKey("embeds")} />
                  <ToggleItem label="Nhật ký sự kiện (Event Logs)" active={visibilityMap["event-logs"]} onToggle={() => toggleKey("event-logs")} />
                  <ToggleItem label="Lịch trình Job (Scheduled Jobs)" active={visibilityMap["scheduled-jobs"]} onToggle={() => toggleKey("scheduled-jobs")} />
                  <ToggleItem label="Developer API Keys" active={visibilityMap["api-keys"]} onToggle={() => toggleKey("api-keys")} />
                  <ToggleItem label="Biến System Prompt" active={visibilityMap["system-prompt-variables"]} onToggle={() => toggleKey("system-prompt-variables")} />
                  <ToggleItem label="Tiện ích trình duyệt (Browser Extension)" active={visibilityMap["browser-extension"]} onToggle={() => toggleKey("browser-extension")} />
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-blue-400">Chính sách & Thông tin hỗ trợ</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleItem label="Quyền riêng tư (Privacy)" active={visibilityMap["privacy"]} onToggle={() => toggleKey("privacy")} />
                  <ToggleItem label="Liên hệ hỗ trợ (Support Email)" active={visibilityMap["support-email"]} onToggle={() => toggleKey("support-email")} />
                  <ToggleItem label="Hiển thị Phiên bản App (App Version)" active={visibilityMap["app-version"]} onToggle={() => toggleKey("app-version")} />
                  <ToggleItem label="Hiển thị Footer cài đặt" active={visibilityMap["footer"]} onToggle={() => toggleKey("footer")} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-x-2 text-green-500">
                <ShieldCheck size={20} weight="fill" />
                <span className="text-xs font-medium">Bảo mật bằng mật khẩu quản trị ẩn</span>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-md shadow-blue-600/20"
              >
                {isSubmitting ? "Đang lưu cấu hình..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 w-full text-left ${
        active
          ? "bg-blue-600/10 border-blue-500/50 text-white"
          : "bg-zinc-950/40 border-white/5 text-theme-text-secondary hover:border-white/10"
      }`}
    >
      <span className="text-xs font-medium truncate pr-2">{label}</span>
      <div className="flex items-center shrink-0">
        {active ? (
          <Eye className="h-5 w-5 text-blue-400" weight="fill" />
        ) : (
          <EyeSlash className="h-5 w-5 text-zinc-500" weight="bold" />
        )}
      </div>
    </button>
  );
}
