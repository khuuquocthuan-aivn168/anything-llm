import cn from "@/utils/cn";

export default function ChatGreeting({ children, className = "" }) {
  return (
    <div className={cn("chat-greeting-wrap", className)}>
      <h1 className="chat-greeting-text">{children}</h1>
    </div>
  );
}
