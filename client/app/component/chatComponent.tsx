"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { ArrowUp, Check, Copy, Loader2, Menu, Plus, Trash2, X } from "lucide-react";

import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import FileUpload from "./fileUpload";

type MessageRole = "user" | "assistant";

interface SourceDocument {
  pageContent: string;
  metadata?: {
    source?: string;
    loc?: {
      pageNumber?: number;
    };
  };
  id?: string;
}

interface Message {
  id: string | number;
  role: MessageRole;
  content: string;
  sources?: SourceDocument[];
}

interface UserDocument {
  id: string;
  filename: string;
  originalName: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  pageCount: number;
  createdAt: string;
  _count?: {
    chats: number;
  };
}

const PROMPT_SUGGESTIONS = [
  "Summarize the main points of this document.",
  "What are the key conclusions or takeaways?",
  "List any tables, metrics, or financial data found.",
  "What recommendations are provided in this PDF?",
];

export default function AIChat() {
  const { getToken, userId } = useAuth();

  /*
   * ---------------------------------------------------------
   * STATE
   * ---------------------------------------------------------
   */

  // Documents
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [selectedDoc, setSelectedDoc] =
    useState<UserDocument | null>(null);
  const [docCount, setDocCount] = useState<number>(0);
  const [docLimit] = useState<number>(5);

  // Document loading
  const [loadingDocuments, setLoadingDocuments] =
    useState<boolean>(true);

  // Chat history loading
  const [loadingHistory, setLoadingHistory] =
    useState<boolean>(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Copy
  const [copiedMessageId, setCopiedMessageId] =
    useState<string | number | null>(null);

  // Upload modal
  const [showUploadModal, setShowUploadModal] =
    useState(false);

  // Mobile sidebar
  const [showSidebar, setShowSidebar] = useState(false);

  // Delete
  const [deletingDocId, setDeletingDocId] =
    useState<string | null>(null);

  // Errors
  const [documentsError, setDocumentsError] =
    useState<string | null>(null);

  const [historyError, setHistoryError] =
    useState<string | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_PDF ||
    "http://localhost:8080";

  /*
   * ---------------------------------------------------------
   * AUTO SCROLL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  /*
   * ---------------------------------------------------------
   * FETCH USER DOCUMENTS
   *
   * silent = true is used during polling so we don't
   * show the full-page/sidebar loading state every 2 sec.
   * ---------------------------------------------------------
   */

  const fetchUserDocuments = useCallback(
    async (
      preferredDocId?: string,
      silent: boolean = false
    ) => {
      try {
        if (!silent) {
          setLoadingDocuments(true);
        }

        setDocumentsError(null);

        const token = await getToken();

        if (!token && !userId) {
          return;
        }

        const res = await axios.get(
          `${apiUrl}/api/user-documents`,
          {
            headers: {
              Authorization: token
                ? `Bearer ${token}`
                : undefined,

              ...(userId
                ? {
                    "x-user-id": userId,
                  }
                : {}),
            },
          }
        );

        const docs: UserDocument[] =
          res.data?.data?.documents || [];

        const count =
          res.data?.data?.count ?? docs.length;

        setDocuments(docs);
        setDocCount(count);

        /*
         * Keep selected document synchronized with
         * the latest API response.
         */
        setSelectedDoc((prev) => {
          // If upload just completed, select the new document.
          if (preferredDocId) {
            const found = docs.find(
              (doc) => doc.id === preferredDocId
            );

            if (found) {
              return found;
            }
          }

          // No selected document yet.
          if (!prev && docs.length > 0) {
            return docs[0];
          }

          // No documents left.
          if (docs.length === 0) {
            return null;
          }

          // Keep currently selected document updated.
          if (prev) {
            const updated = docs.find(
              (doc) => doc.id === prev.id
            );

            if (updated) {
              return updated;
            }

            return docs[0];
          }

          return null;
        });
      } catch (error) {
        console.error(
          "Failed to fetch user documents:",
          error
        );

        if (!silent) {
          setDocumentsError(
            "Unable to load your documents."
          );
        }
      } finally {
        if (!silent) {
          setLoadingDocuments(false);
        }
      }
    },
    [getToken, userId, apiUrl]
  );

  /*
   * ---------------------------------------------------------
   * INITIAL DOCUMENT FETCH
   * ---------------------------------------------------------
   */

  useEffect(() => {
    fetchUserDocuments();
  }, [fetchUserDocuments]);

  /*
   * ---------------------------------------------------------
   * POLL PROCESSING DOCUMENTS
   *
   * This does NOT activate the main loading spinner.
   * Otherwise the sidebar would flash every 2 seconds.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const hasProcessingDocument = documents.some(
      (doc) => doc.status === "PROCESSING"
    );

    if (!hasProcessingDocument) {
      return;
    }

    const interval = setInterval(() => {
      fetchUserDocuments(undefined, true);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [documents, fetchUserDocuments]);

  /*
   * ---------------------------------------------------------
   * FETCH CHAT HISTORY
   * ---------------------------------------------------------
   */

  const fetchChatHistory = useCallback(
    async (docId: string) => {
      try {
        setLoadingHistory(true);
        setHistoryError(null);

        const token = await getToken();

        if (!token && !userId) {
          setMessages([]);
          return;
        }

        const res = await axios.get(
          `${apiUrl}/api/chat/history/${docId}`,
          {
            headers: {
              Authorization: token
                ? `Bearer ${token}`
                : undefined,

              ...(userId
                ? {
                    "x-user-id": userId,
                  }
                : {}),
            },
          }
        );

        const rawHistory =
          res.data?.data?.history || [];

        const formattedMessages: Message[] =
          rawHistory.map((item: any) => ({
            id: item.id,
            role: item.role,
            content: item.content,
            sources: item.sources || [],
          }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error(
          "Failed to fetch chat history:",
          error
        );

        setHistoryError(
          "Unable to load chat history."
        );

        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [getToken, userId, apiUrl]
  );

  /*
   * ---------------------------------------------------------
   * LOAD HISTORY WHEN DOCUMENT CHANGES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (selectedDoc?.id) {
      fetchChatHistory(selectedDoc.id);
    } else {
      setMessages([]);
      setLoadingHistory(false);
    }
  }, [selectedDoc?.id, fetchChatHistory]);

  /*
   * ---------------------------------------------------------
   * SEND MESSAGE
   * ---------------------------------------------------------
   */

  const handleSendMessage = async (
    textToSend?: string
  ): Promise<void> => {
    const query = (textToSend || input).trim();

    if (
      !query ||
      isTyping ||
      loadingHistory ||
      !selectedDoc
    ) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: query,
    };

    // Immediately show user message.
    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");

    // Start AI loading state.
    setIsTyping(true);

    try {
      const token = await getToken();

      if (!token && !userId) {
        throw new Error("Authentication required");
      }

      const response = await axios.post(
        `${apiUrl}/api/chat`,
        {
          question: query,
          documentId: selectedDoc.id,
        },
        {
          headers: {
            Authorization: token
              ? `Bearer ${token}`
              : undefined,

            ...(userId
              ? {
                  "x-user-id": userId,
                }
              : {}),
          },
        }
      );

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          response.data?.message ||
          "I couldn't generate a response.",
        sources: response.data?.docs || [],
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (error: any) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          error?.response?.data?.message ||
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
   * ---------------------------------------------------------
   * DELETE DOCUMENT
   * ---------------------------------------------------------
   */

  const handleDeleteDocument = async (
    docId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this PDF and its chat history?"
      )
    ) {
      return;
    }

    setDeletingDocId(docId);

    try {
      const token = await getToken();

      if (!token && !userId) {
        throw new Error("Authentication required");
      }

      await axios.delete(
        `${apiUrl}/api/documents/${docId}`,
        {
          headers: {
            Authorization: token
              ? `Bearer ${token}`
              : undefined,

            ...(userId
              ? {
                  "x-user-id": userId,
                }
              : {}),
          },
        }
      );

      const updatedDocuments =
        documents.filter(
          (doc) => doc.id !== docId
        );

      setDocuments(updatedDocuments);

      setDocCount((prev) =>
        Math.max(0, prev - 1)
      );

      /*
       * If deleted document was selected,
       * automatically select another document.
       */
      if (selectedDoc?.id === docId) {
        const nextDoc =
          updatedDocuments[0] || null;

        setSelectedDoc(nextDoc);

        if (!nextDoc) {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error(
        "Failed to delete document:",
        error
      );

      alert(
        "Failed to delete the document. Please try again."
      );
    } finally {
      setDeletingDocId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * KEYBOARD HANDLER
   * ---------------------------------------------------------
   */

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  /*
   * ---------------------------------------------------------
   * COPY MESSAGE
   * ---------------------------------------------------------
   */

  const handleCopy = async (
    text: string,
    messageId: string | number
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);

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

  /*
   * ---------------------------------------------------------
   * FILTER DOCUMENTS
   * ---------------------------------------------------------
   */

  const filteredDocuments =
    documents.filter((doc) =>
      doc.originalName
        .toLowerCase()
        .includes(
          searchQuery.toLowerCase()
        )
    );

  const chatDisabled =
    isTyping ||
    loadingHistory ||
    !selectedDoc ||
    selectedDoc.status !== "COMPLETED";

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">

      {/* Mobile backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-ink/20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR — LIBRARY
      ===================================================== */}

      <aside
        className={`fixed inset-y-14 left-0 z-40 flex w-80 shrink-0 flex-col border-r border-rule bg-paper transition-transform md:static md:inset-auto md:translate-x-0 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col px-5 pt-6">

          {/* HEADER */}
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-3xl italic">Library</h2>
            <span className="font-mono text-[11px] text-muted">
              {docCount}/{docLimit}
            </span>
          </div>

          {/* SLOTS — one mark per allowed document */}
          <div className="mt-3 flex gap-1" title={`${docCount} of ${docLimit} documents used`}>
            {Array.from({ length: docLimit }).map((_, i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 transition-colors ${
                  i < docCount
                    ? docCount >= docLimit
                      ? "bg-accent"
                      : "bg-ink"
                    : "bg-rule"
                }`}
              />
            ))}
          </div>

          {/* UPLOAD */}
          <button
            type="button"
            onClick={() => {
              setShowUploadModal(true);
              setShowSidebar(false);
            }}
            disabled={docCount >= docLimit}
            className="mt-6 flex w-full items-center justify-between border border-dashed border-rule px-4 py-3 text-sm transition enabled:cursor-pointer enabled:hover:border-ink disabled:cursor-not-allowed disabled:text-muted"
          >
            <span>
              {docCount >= docLimit
                ? "Library full — delete one to add"
                : "Add a PDF"}
            </span>
            <Plus size={15} className="text-muted" />
          </button>

          {/* SEARCH */}
          {documents.length > 0 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter…"
              className="mt-4 w-full border-b border-rule bg-transparent py-2 text-sm placeholder:text-muted focus:border-ink focus:outline-none"
            />
          )}

          {/* DOCUMENT LIST */}
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto pb-6">

            {loadingDocuments ? (

              <p className="py-10 text-center font-mono text-[11px] text-muted">
                loading<span className="animate-caret">_</span>
              </p>

            ) : documentsError ? (

              <div className="py-10 text-center">
                <p className="text-sm">Couldn’t load your library.</p>
                <button
                  type="button"
                  onClick={() => fetchUserDocuments()}
                  className="mt-2 cursor-pointer font-mono text-[11px] text-accent underline underline-offset-4"
                >
                  try again
                </button>
              </div>

            ) : documents.length === 0 ? (

              <p className="py-10 text-center font-serif text-xl italic text-muted">
                Nothing on the shelf yet.
              </p>

            ) : filteredDocuments.length === 0 ? (

              <p className="py-10 text-center text-sm text-muted">
                No match for “{searchQuery}”.
              </p>

            ) : (

              <ol className="divide-y divide-rule">
                {filteredDocuments.map((doc) => {
                  const index = documents.indexOf(doc);
                  const isSelected = selectedDoc?.id === doc.id;
                  const isProcessing = doc.status === "PROCESSING";
                  const isFailed = doc.status === "FAILED";
                  const isDeleting = deletingDocId === doc.id;

                  return (
                    <li
                      key={doc.id}
                      onClick={() => {
                        if (!isDeleting && !loadingHistory) {
                          setSelectedDoc(doc);
                          setShowSidebar(false);
                        }
                      }}
                      className={`group relative flex items-start gap-3 py-3.5 pl-3 pr-1 transition ${
                        isDeleting ? "opacity-50" : "cursor-pointer"
                      }`}
                    >
                      {/* selected marker */}
                      <span
                        className={`absolute left-0 top-3.5 bottom-3.5 w-0.5 transition ${
                          isSelected ? "bg-accent" : "bg-transparent group-hover:bg-rule"
                        }`}
                      />

                      <span
                        className={`pt-0.5 font-mono text-[11px] ${
                          isSelected ? "text-accent" : "text-muted"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            isSelected ? "text-ink" : "text-ink/75"
                          }`}
                          title={doc.originalName}
                        >
                          {doc.originalName}
                        </p>

                        <p className="mt-1 font-mono text-[10px] text-muted">
                          {isProcessing ? (
                            <span className="text-accent">
                              indexing<span className="animate-caret">_</span>
                            </span>
                          ) : isFailed ? (
                            <span className="text-accent">failed</span>
                          ) : (
                            <span>{doc.pageCount || 0} pp</span>
                          )}
                          <span className="mx-1.5">·</span>
                          {new Date(doc.createdAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="shrink-0 cursor-pointer p-1 text-muted opacity-0 transition hover:text-accent focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed max-md:opacity-100"
                        title="Delete document"
                      >
                        {isDeleting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN — READING ROOM
      ===================================================== */}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-rule px-5 sm:px-8">
          <button
            type="button"
            onClick={() => setShowSidebar(true)}
            className="cursor-pointer text-muted hover:text-ink md:hidden"
            aria-label="Open library"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-2xl leading-tight">
              {selectedDoc ? selectedDoc.originalName : "No document open"}
            </h1>
          </div>

          {selectedDoc && (
            <span
              className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] ${
                selectedDoc.status === "COMPLETED" ? "text-muted" : "text-accent"
              }`}
            >
              {selectedDoc.status === "COMPLETED"
                ? `${selectedDoc.pageCount || 0} pages · ready`
                : selectedDoc.status === "PROCESSING"
                ? "indexing…"
                : "failed"}
            </span>
          )}
        </header>

        {/* MESSAGES */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">

            {loadingHistory ? (

              <p className="py-24 text-center font-mono text-[11px] text-muted">
                opening conversation<span className="animate-caret">_</span>
              </p>

            ) : historyError ? (

              <div className="py-24 text-center">
                <p className="font-serif text-2xl italic">
                  The conversation wouldn’t open.
                </p>
                <button
                  type="button"
                  onClick={() => selectedDoc && fetchChatHistory(selectedDoc.id)}
                  className="mt-3 cursor-pointer font-mono text-[11px] text-accent underline underline-offset-4"
                >
                  try again
                </button>
              </div>

            ) : !selectedDoc ? (

              <div className="py-20">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
                  Begin here
                </p>
                <h3 className="mt-4 font-serif text-5xl leading-[1.05]">
                  Open a PDF and
                  <br />
                  <span className="italic">ask it anything.</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-10 cursor-pointer rounded-full bg-ink px-6 py-3 text-sm text-paper transition hover:bg-accent"
                >
                  Add a PDF →
                </button>
              </div>

            ) : messages.length === 0 ? (

              <div className="py-12">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
                  {selectedDoc.status === "COMPLETED"
                    ? "Ready when you are"
                    : "Still reading this one"}
                </p>
                <h3 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                  What would you like to
                  <span className="italic"> know?</span>
                </h3>

                <ol className="mt-10 divide-y divide-rule border-y border-rule">
                  {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        disabled={isTyping || selectedDoc.status !== "COMPLETED"}
                        onClick={() => handleSendMessage(suggestion)}
                        className="group flex w-full cursor-pointer items-baseline gap-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="font-mono text-[11px] text-muted group-enabled:group-hover:text-accent">
                          0{idx + 1}
                        </span>
                        <span className="flex-1 text-sm group-enabled:group-hover:text-accent">
                          {suggestion}
                        </span>
                        <span className="text-muted opacity-0 transition group-enabled:group-hover:opacity-100">
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

            ) : (

              <div className="space-y-12">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    onCopy={handleCopy}
                    copiedMessageId={copiedMessageId}
                  />
                ))}
              </div>

            )}

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT */}
        <div className="shrink-0 border-t border-rule">
          <div className="mx-auto flex w-full max-w-2xl items-end gap-3 px-5 py-4 sm:px-8">
            <span className="pb-2.5 font-mono text-sm text-accent">Q.</span>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !selectedDoc
                  ? "Open a document to start…"
                  : selectedDoc.status !== "COMPLETED"
                  ? "Still indexing this document…"
                  : "Ask a question…"
              }
              rows={1}
              disabled={chatDisabled}
              className="max-h-36 min-h-[44px] w-full resize-none bg-transparent py-2.5 font-serif text-xl outline-none placeholder:text-muted/70 disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || chatDisabled}
              className="mb-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:bg-rule disabled:text-muted"
              aria-label="Send question"
            >
              {isTyping ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowUp size={16} />
              )}
            </button>
          </div>
        </div>
      </main>

      {/* =====================================================
          UPLOAD MODAL
      ===================================================== */}

      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="animate-rise w-full max-w-lg border border-rule bg-paper p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-baseline justify-between">
              <h3 className="font-serif text-3xl italic">Add to library</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="cursor-pointer text-muted transition hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <FileUpload
              onUploadSuccess={(newDocId) => {
                setShowUploadModal(false);

                /*
                 * Fetch updated documents.
                 * The new document is automatically selected.
                 */
                fetchUserDocuments(newDocId);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * MESSAGE ITEM
 * =========================================================
 */

interface MessageItemProps {
  message: Message;
  onCopy: (text: string, messageId: string | number) => void;
  copiedMessageId: string | number | null;
}

function MessageItem({ message, onCopy, copiedMessageId }: MessageItemProps) {
  if (message.role === "user") {
    return (
      <div className="animate-rise flex gap-4">
        <span className="pt-2 font-mono text-sm text-accent">Q.</span>
        <p className="whitespace-pre-wrap font-serif text-2xl leading-snug sm:text-3xl">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-rise flex gap-4">
      <span className="pt-0.5 font-mono text-sm text-muted">A.</span>

      <div className="min-w-0 flex-1">
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
          {message.content}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {message.sources && message.sources.length > 0 && (
            <SourcePages sources={message.sources} />
          )}

          <button
            type="button"
            onClick={() => onCopy(message.content, message.id)}
            className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-muted transition hover:text-ink"
          >
            {copiedMessageId === message.id ? (
              <>
                <Check size={12} />
                copied
              </>
            ) : (
              <>
                <Copy size={12} />
                copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * SOURCE PAGES
 * =========================================================
 */

function SourcePages({ sources }: { sources: SourceDocument[] }) {
  const pages = Array.from(
    new Set(
      sources
        .map((source) => source.metadata?.loc?.pageNumber)
        .filter((page): page is number => typeof page === "number")
    )
  ).sort((a, b) => a - b);

  if (pages.length === 0) {
    return null;
  }

  return (
    <span className="font-mono text-[11px] text-accent">
      ↳ {pages.length === 1 ? "p." : "pp."} {pages.join(", ")}
    </span>
  );
}

/*
 * =========================================================
 * TYPING INDICATOR
 * =========================================================
 */

function TypingIndicator() {
  return (
    <div className="mt-12 flex gap-4">
      <span className="pt-0.5 font-mono text-sm text-muted">A.</span>
      <p className="font-mono text-[12px] text-muted">
        reading the pages<span className="animate-caret">_</span>
      </p>
    </div>
  );
}
