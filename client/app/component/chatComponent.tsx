"use client"
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  Copy,
  FileText,
  Send,
  User,
  FileSearch,
} from "lucide-react";
import axios from "axios";

type MessageRole = "user" | "assistant";

interface SourceDocument {
  pageContent: string;
  metadata?: {
    source?: string;
    loc?: {
      pageNumber?: number;
      lines?: {
        from?: number;
        to?: number;
      };
    };
    pdf?: {
      totalPages?: number;
      info?: {
        Title?: string;
      };
    };
  };
  id?: string;
}

interface Message {
  id: number;
  role: MessageRole;
  content: string;
  sources?: SourceDocument[];
}

interface ChatResponse {
  message: string;
  docs: SourceDocument[];
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Your PDF is ready. Ask me anything about the document.",
  },
];

export default function AIChat() {
  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const [input, setInput] = useState("");

  const [isTyping, setIsTyping] =
    useState(false);

  const [copiedMessageId, setCopiedMessageId] =
    useState<number | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * ==========================================
   * AUTO SCROLL
   * ==========================================
   */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  /*
   * ==========================================
   * SEND MESSAGE
   * ==========================================
   */

  const handleSend = async (): Promise<void> => {
    const text = input.trim();

    if (!text || isTyping) return;

    /*
     * Add user message
     */

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    try {
      /*
       * ========================================
       * API URL
       * ========================================
       */

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          "NEXT_PUBLIC_API_URL is not defined"
        );
      }

      /*
       * ========================================
       * CALL BACKEND
       * ========================================
       *
       * Example:
       *
       * NEXT_PUBLIC_API_URL=http://localhost:5300
       *
       * Request:
       *
       * POST http://localhost:5300/api/chat
       *
       * Body:
       *
       * {
       *   question: "How does YouTube help education?"
       * }
       */

      const response =
        await axios.post<ChatResponse>(
          `${apiUrl}/api/chat`,
          {
            question: text,
          }
        );

      /*
       * ========================================
       * AI RESPONSE
       * ========================================
       */

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          response.data.message,
        sources:
          response.data.docs || [],
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (error) {
      console.error(
        "Chat API error:",
        error
      );

      /*
       * Error message
       */

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Sorry, I couldn't process your question. Please try again.",
      };

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /*
   * ==========================================
   * KEYBOARD
   * ==========================================
   *
   * Enter = Send
   * Shift + Enter = New line
   */

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      handleSend();
    }
  };

  /*
   * ==========================================
   * COPY MESSAGE
   * ==========================================
   */

  const handleCopy = async (
    text: string,
    messageId: number
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopiedMessageId(messageId);

      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy:",
        error
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">

      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

      <header
        className="
          flex
          h-16
          shrink-0
          items-center
          border-b
          border-gray-200
          px-6
        "
      >
        <div className="flex items-center gap-3">

          {/* Logo */}

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-blue-600
            "
          >
            <FileText
              size={19}
              className="text-white"
            />
          </div>

          {/* Title */}

          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              AI Chat PDF
            </h1>

            <p className="text-xs text-gray-500">
              Ask questions about your document
            </p>
          </div>

        </div>
      </header>

      {/* ======================================== */}
      {/* CHAT CONTENT */}
      {/* ======================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
        "
      >
        <div className="w-full px-6 py-8">

          <div className="space-y-8">

            {messages.map(
              (message: Message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onCopy={handleCopy}
                  copiedMessageId={
                    copiedMessageId
                  }
                />
              )
            )}

            {/* Typing */}

            {isTyping && (
              <TypingIndicator />
            )}

            {/* Scroll anchor */}

            <div ref={messagesEndRef} />

          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* FLOATING INPUT */}
      {/* ======================================== */}

      <div
        className="
          sticky
          bottom-0
          z-20
          w-full
          bg-white/95
          px-6
          pb-5
          pt-4
          backdrop-blur-sm
        "
      >
        <div className="w-full">

          {/* Input box */}

          <div
            className="
              relative
              flex
              items-end
              rounded-2xl
              border
              border-gray-300
              bg-white
              shadow-lg
              transition

              focus-within:border-blue-400
              focus-within:ring-2
              focus-within:ring-blue-100
            "
          >

            {/* Textarea */}

            <textarea
              value={input}
              onChange={(
                e: React.ChangeEvent<HTMLTextAreaElement>
              ) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your PDF..."
              rows={1}
              disabled={isTyping}
              className="
                max-h-40
                min-h-[58px]
                w-full
                resize-none
                bg-transparent
                px-5
                py-4
                pr-14
                text-sm
                leading-6
                text-gray-900
                outline-none
                placeholder:text-gray-400
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

            {/* Send button */}

            <button
              type="button"
              onClick={handleSend}
              disabled={
                !input.trim() ||
                isTyping
              }
              className="
                absolute
                bottom-3
                right-3
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-blue-600
                text-white
                transition

                hover:bg-blue-700

                disabled:cursor-not-allowed
                disabled:bg-gray-200
                disabled:text-gray-400
              "
              aria-label="Send message"
            >
              <Send size={17} />
            </button>

          </div>

          {/* Disclaimer */}

          <p className="mt-2 text-center text-[11px] text-gray-400">
            AI Chat PDF can make mistakes. Check
            important information against your
            document.
          </p>

        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* MESSAGE ITEM */
/* ================================================= */

interface MessageItemProps {
  message: Message;

  onCopy: (
    text: string,
    messageId: number
  ) => void;

  copiedMessageId: number | null;
}

function MessageItem({
  message,
  onCopy,
  copiedMessageId,
}: MessageItemProps) {
  const isUser =
    message.role === "user";

  return (
    <div
      className="
        group
        flex
        w-full
        gap-3
        sm:gap-4
      "
    >

      {/* ======================================== */}
      {/* AVATAR */}
      {/* ======================================== */}

      <div
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full

          ${
            isUser
              ? "bg-gray-100 text-gray-600"
              : "bg-blue-600 text-white"
          }
        `}
      >
        {isUser ? (
          <User size={16} />
        ) : (
          <Bot size={17} />
        )}
      </div>

      {/* ======================================== */}
      {/* MESSAGE */}
      {/* ======================================== */}

      <div className="min-w-0 flex-1">

        {/* Name */}

        <div
          className="
            mb-1
            text-xs
            font-semibold
            text-gray-700
          "
        >
          {isUser
            ? "You"
            : "AI Chat PDF"}
        </div>

        {/* Answer */}

        <div
          className="
            text-sm
            leading-7
            text-gray-700
          "
        >
          <MessageContent
            content={message.content}
          />
        </div>

        {/* ====================================== */}
        {/* SOURCE PAGES */}
        {/* ====================================== */}

        {!isUser &&
          message.sources &&
          message.sources.length > 0 && (
            <SourcePages
              sources={message.sources}
            />
          )}

        {/* ====================================== */}
        {/* COPY */}
        {/* ====================================== */}

        {!isUser && (
          <button
            type="button"
            onClick={() =>
              onCopy(
                message.content,
                message.id
              )
            }
            className="
              mt-2
              inline-flex
              items-center
              gap-1.5
              rounded-md
              px-2
              py-1.5
              text-xs
              text-gray-400
              transition

              hover:bg-gray-100
              hover:text-gray-700
            "
          >
            {copiedMessageId ===
            message.id ? (
              <>
                <Check
                  size={14}
                  className="text-green-600"
                />

                <span className="text-green-600">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy size={14} />

                <span>Copy</span>
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
}

/* ================================================= */
/* SOURCE PAGES */
/* ================================================= */

interface SourcePagesProps {
  sources: SourceDocument[];
}

function SourcePages({
  sources,
}: SourcePagesProps) {

  /*
   * Get page numbers
   */

  const pages = Array.from(
    new Set(
      sources
        .map(
          (source) =>
            source.metadata?.loc
              ?.pageNumber
        )
        .filter(
          (
            page
          ): page is number =>
            typeof page === "number"
        )
    )
  ).sort(
    (a, b) => a - b
  );

  /*
   * No page information
   */

  if (pages.length === 0) {
    return null;
  }

  return (
    <div
      className="
        mt-4
        flex
        flex-wrap
        items-center
        gap-2
      "
    >

      {/* Label */}

      <div
        className="
          flex
          items-center
          gap-1.5
          text-xs
          font-medium
          text-gray-400
        "
      >
        <FileSearch size={14} />

        <span>Sources:</span>
      </div>

      {/* Pages */}

      {pages.map((page) => (
        <span
          key={page}
          className="
            inline-flex
            items-center
            rounded-md
            border
            border-gray-200
            bg-gray-50
            px-2.5
            py-1
            text-xs
            font-medium
            text-gray-600
          "
        >
          Page {page}
        </span>
      ))}

    </div>
  );
}

/* ================================================= */
/* MESSAGE CONTENT */
/* ================================================= */

interface MessageContentProps {
  content: string;
}

function MessageContent({
  content,
}: MessageContentProps) {

  const parts = content.split(
    /(\*\*.*?\*\*|`.*?`)/g
  );

  return (
    <div className="whitespace-pre-wrap">

      {parts.map(
        (
          part: string,
          index: number
        ) => {

          /*
           * Bold
           */

          if (
            part.startsWith("**") &&
            part.endsWith("**")
          ) {
            return (
              <strong
                key={index}
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {part.slice(2, -2)}
              </strong>
            );
          }

          /*
           * Inline code
           */

          if (
            part.startsWith("`") &&
            part.endsWith("`")
          ) {
            return (
              <code
                key={index}
                className="
                  rounded-md
                  bg-gray-100
                  px-1.5
                  py-0.5
                  font-mono
                  text-xs
                  text-gray-800
                "
              >
                {part.slice(1, -1)}
              </code>
            );
          }

          return (
            <span key={index}>
              {part}
            </span>
          );
        }
      )}

    </div>
  );
}

/* ================================================= */
/* TYPING INDICATOR */
/* ================================================= */

function TypingIndicator() {
  return (
    <div className="flex gap-3 sm:gap-4">

      {/* Avatar */}

      <div
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-blue-600
          text-white
        "
      >
        <Bot size={17} />
      </div>

      {/* Dots */}

      <div
        className="
          flex
          items-center
          gap-1
          pt-2
        "
      >

        <span
          className="
            h-1.5
            w-1.5
            animate-bounce
            rounded-full
            bg-gray-400
            [animation-delay:-0.3s]
          "
        />

        <span
          className="
            h-1.5
            w-1.5
            animate-bounce
            rounded-full
            bg-gray-400
            [animation-delay:-0.15s]
          "
        />

        <span
          className="
            h-1.5
            w-1.5
            animate-bounce
            rounded-full
            bg-gray-400
          "
        />

      </div>
    </div>
  );
}