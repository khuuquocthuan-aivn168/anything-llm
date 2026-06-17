/* eslint-disable react-hooks/refs */
import { memo, useRef, useEffect } from "react";
import { Warning } from "@phosphor-icons/react";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "@/utils/chat/purify";
import Citations from "../Citation";
import {
  THOUGHT_REGEX_CLOSE,
  THOUGHT_REGEX_COMPLETE,
  THOUGHT_REGEX_OPEN,
  ThoughtChainComponent,
} from "../ThoughtContainer";

const STREAMING_STYLES = `
  @keyframes blink {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }
  @keyframes stream-entry {
    from {
      opacity: 0.85;
      transform: translateY(1.5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes bounce-subtle {
    0%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.95; }
    50% { opacity: 0.8; }
  }
  .animate-bounce-subtle {
    animation: bounce-subtle 1.2s infinite ease-in-out;
  }
  .animate-pulse-slow {
    animation: pulse-slow 2s infinite ease-in-out;
  }
  .assistant-streaming-text > *:last-child::after {
    content: "▊";
    display: inline-block;
    margin-left: 4px;
    color: #3b82f6; /* Modern Blue */
    animation: blink 0.8s step-end infinite;
    vertical-align: middle;
    text-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  }
  .assistant-streaming-text > * {
    animation: stream-entry 0.15s ease-out forwards;
  }
`;

const PromptReply = ({ uuid, reply, pending, error, sources = [] }) => {
  if (!reply && sources.length === 0 && !pending && !error) return null;

  if (pending) {
    return (
      <div className="flex justify-start w-full">
        <style dangerouslySetInnerHTML={{ __html: STREAMING_STYLES }} />
        <div className="py-4 pl-0 pr-4 flex flex-col md:max-w-[80%] animate-pulse-slow">
          <div className="flex items-center gap-x-2 py-3 px-4 rounded-2xl bg-zinc-800/30 light:bg-slate-100/30 border border-zinc-700/20 light:border-slate-200/20 backdrop-blur-sm w-fit shadow-sm">
            <span className="w-2 h-2 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full animate-bounce-subtle" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full animate-bounce-subtle" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-bounce-subtle" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-start w-full">
        <div className="py-4 pl-0 pr-4 flex flex-col md:max-w-[80%]">
          <span className="inline-block p-2 rounded-lg bg-red-50 text-red-500">
            <Warning className="h-4 w-4 mb-1 inline-block" /> Could not respond
            to message.
            <span className="text-xs">Reason: {error || "unknown"}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div key={uuid} className="flex justify-start w-full">
      <style dangerouslySetInnerHTML={{ __html: STREAMING_STYLES }} />
      <div className="py-4 pl-0 pr-4 flex flex-col w-full">
        <RenderAssistantChatContent
          key={`${uuid}-prompt-reply-content`}
          message={reply}
          messageId={uuid}
        />
        <Citations sources={sources} />
      </div>
    </div>
  );
};

function RenderAssistantChatContent({ message, messageId }) {
  const contentRef = useRef("");
  const thoughtChainRef = useRef(null);

  useEffect(() => {
    const thinking =
      message.match(THOUGHT_REGEX_OPEN) && !message.match(THOUGHT_REGEX_CLOSE);

    if (thinking && thoughtChainRef.current) {
      thoughtChainRef.current.updateContent(message);
      return;
    }

    const completeThoughtChain = message.match(THOUGHT_REGEX_COMPLETE)?.[0];
    const msgToRender = message.replace(THOUGHT_REGEX_COMPLETE, "");

    if (completeThoughtChain && thoughtChainRef.current) {
      thoughtChainRef.current.updateContent(completeThoughtChain);
    }

    contentRef.current = msgToRender;
  }, [message]);

  const thinking =
    message.match(THOUGHT_REGEX_OPEN) && !message.match(THOUGHT_REGEX_CLOSE);
  if (thinking)
    return (
      <ThoughtChainComponent
        ref={thoughtChainRef}
        content=""
        messageId={messageId}
      />
    );

  return (
    <div className="flex flex-col gap-y-1">
      {message.match(THOUGHT_REGEX_COMPLETE) && (
        <ThoughtChainComponent
          ref={thoughtChainRef}
          content=""
          messageId={messageId}
        />
      )}
      <span
        className="break-words assistant-streaming-text"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(renderMarkdown(contentRef.current)),
        }}
      />
    </div>
  );
}

export default memo(PromptReply);

