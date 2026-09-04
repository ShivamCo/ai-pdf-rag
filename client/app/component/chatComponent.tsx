"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import {
  Bot,
  Check,
  Copy,
  FileText,
  Send,
  User,
  FileSearch,
  Trash2,
  Plus,
  Loader2,
  Search,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";

import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
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
  const { user } = useUser();

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
    "http://localhost:5300";

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
    } catch (error) {
      console.error("Chat error:", error);

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

  /*
   * ---------------------------------------------------------
   * STORAGE PERCENTAGE
   * ---------------------------------------------------------
   */

  const storagePercentage = Math.min(
    100,
    Math.round(
      (docCount / docLimit) * 100
    )
  );

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-100">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="w-80 sm:w-88 shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-xs">

        <div className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden">

          {/* HEADER */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">

            <div className="flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>

              <div>
                <h2 className="font-bold text-sm text-slate-900">
                  Your Documents
                </h2>

                <p className="text-[11px] text-slate-400">
                  PDF Knowledge Bases
                </p>
              </div>

            </div>

            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
              {docCount} / {docLimit}
            </span>

          </div>

          {/* STORAGE */}
          <div className="mt-3 space-y-1">

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">

              <span>
                Cloud Storage Limit
              </span>

              <span>
                {storagePercentage}%
              </span>

            </div>

            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">

              <div
                className={`h-full transition-all duration-300 ${
                  docCount >= docLimit
                    ? "bg-rose-500"
                    : docCount >= 3
                    ? "bg-amber-500"
                    : "bg-blue-600"
                }`}
                style={{
                  width: `${storagePercentage}%`,
                }}
              />

            </div>

          </div>

          {/* UPLOAD BUTTON */}
          <button
            type="button"
            onClick={() =>
              setShowUploadModal(true)
            }
            disabled={
              docCount >= docLimit
            }
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition shadow-xs ${
              docCount >= docLimit
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-md cursor-pointer active:scale-[0.99]"
            }`}
          >
            <Plus size={16} />

            <span>
              {docCount >= docLimit
                ? "Storage Limit Reached (5/5)"
                : "Upload New PDF"}
            </span>
          </button>

          {/* SEARCH */}
          {documents.length > 0 && (
            <div className="relative mt-3">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                placeholder="Search documents..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />

            </div>
          )}

          {/* DOCUMENT LIST */}
          <div className="mt-3 flex-1 min-h-0 overflow-y-auto">

            {/* INITIAL LOADING */}
            {loadingDocuments ? (

              <div className="h-full min-h-[220px] flex flex-col items-center justify-center">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Loader2
                    className="h-5 w-5 animate-spin text-blue-600"
                  />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-600">
                  Loading documents...
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Please wait a moment
                </p>

              </div>

            ) : documentsError ? (

              /* DOCUMENT ERROR */
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <X size={20} />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-700">
                  Failed to load documents
                </p>

                <p className="mt-1 text-[11px] text-slate-400 max-w-[200px]">
                  Something went wrong while loading your PDFs.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    fetchUserDocuments()
                  }
                  className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Try again
                </button>

              </div>

            ) : documents.length === 0 ? (

              /* EMPTY */
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <FileText className="h-6 w-6" />
                </div>

                <p className="text-xs font-semibold text-slate-700">
                  No PDFs uploaded yet
                </p>

                <p className="text-[11px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">
                  Click the upload button above to add your first document.
                </p>

              </div>

            ) : filteredDocuments.length === 0 ? (

              /* SEARCH EMPTY */
              <div className="py-8 text-center">

                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Search size={17} />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-600">
                  No documents found
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  No documents match "{searchQuery}".
                </p>

              </div>

            ) : (

              /* DOCUMENTS */
              <div className="space-y-2">

                {filteredDocuments.map(
                  (doc) => {

                    const isSelected =
                      selectedDoc?.id ===
                      doc.id;

                    const isProcessing =
                      doc.status ===
                      "PROCESSING";

                    const isFailed =
                      doc.status ===
                      "FAILED";

                    const isDeleting =
                      deletingDocId ===
                      doc.id;

                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          if (
                            !isDeleting &&
                            !loadingHistory
                          ) {
                            setSelectedDoc(
                              doc
                            );
                          }
                        }}
                        className={`group relative flex items-center justify-between rounded-xl p-3 text-xs border transition-all duration-200 ${
                          isDeleting
                            ? "opacity-60"
                            : "cursor-pointer"
                        } ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/20 text-slate-900"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm text-slate-700"
                        }`}
                      >

                        {/* DOCUMENT INFO */}
                        <div className="flex items-center gap-3 min-w-0 pr-2">

                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            }`}
                          >
                            <FileText
                              size={17}
                            />
                          </div>

                          <div className="min-w-0">

                            <p
                              className={`truncate text-xs leading-tight ${
                                isSelected
                                  ? "font-semibold text-slate-900"
                                  : "font-medium text-slate-700"
                              }`}
                              title={
                                doc.originalName
                              }
                            >
                              {
                                doc.originalName
                              }
                            </p>

                            <div className="mt-1.5 flex items-center gap-2 text-[10px]">

                              {isProcessing ? (

                                <span className="flex items-center gap-1 text-amber-600 font-medium">
                                  <Loader2
                                    size={10}
                                    className="animate-spin"
                                  />
                                  Processing
                                </span>

                              ) : isFailed ? (

                                <span className="flex items-center gap-1 text-rose-600 font-medium">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                  Failed
                                </span>

                              ) : (

                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Ready
                                </span>

                              )}

                              <span className="text-slate-300">
                                •
                              </span>

                              <span className="text-slate-400">
                                {new Date(
                                  doc.createdAt
                                ).toLocaleDateString()}
                              </span>

                            </div>

                          </div>

                        </div>

                        {/* DELETE */}
                        <button
                          type="button"
                          disabled={
                            isDeleting
                          }
                          onClick={(e) =>
                            handleDeleteDocument(
                              doc.id,
                              e
                            )
                          }
                          className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50 disabled:cursor-not-allowed"
                          title="Delete document"
                        >

                          {isDeleting ? (
                            <Loader2
                              size={14}
                              className="animate-spin text-rose-600"
                            />
                          ) : (
                            <Trash2
                              size={14}
                            />
                          )}

                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>
        </div>

        {/* USER CARD */}
        {user && (
          <div className="border-t border-slate-200 p-3.5 bg-slate-50/80 flex items-center gap-3">

            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.firstName
                ? user.firstName[0].toUpperCase()
                : "U"}
            </div>

            <div className="truncate text-xs min-w-0">

              <p className="font-semibold text-slate-800 truncate">
                {user.fullName ||
                  "User"}
              </p>

              <p className="text-[11px] text-slate-400 truncate">
                {
                  user
                    .primaryEmailAddress
                    ?.emailAddress
                }
              </p>

            </div>

          </div>
        )}

      </aside>

      {/* =====================================================
          MAIN CHAT
      ===================================================== */}

      <main className="flex flex-1 flex-col bg-white overflow-hidden">

        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 px-6 bg-white">

          <div className="flex items-center gap-3 min-w-0">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Bot size={20} />
            </div>

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <h1 className="text-sm font-bold text-slate-900 truncate">
                  {selectedDoc
                    ? selectedDoc.originalName
                    : "AI Document Copilot"}
                </h1>

                {selectedDoc && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      selectedDoc.status ===
                      "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : selectedDoc.status ===
                          "PROCESSING"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {selectedDoc.status ===
                    "COMPLETED"
                      ? "Ready"
                      : selectedDoc.status}
                  </span>
                )}

              </div>

              <p className="text-[11px] text-slate-400 truncate">
                {selectedDoc
                  ? `Knowledge base active • ${
                      selectedDoc.pageCount ||
                      0
                    } page(s)`
                  : "Select a document from the left sidebar to start chatting"}
              </p>

            </div>

          </div>

        </header>

        {/* =====================================================
            MESSAGES
        ===================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-slate-50/40">

          {/* HISTORY LOADING */}
          {loadingHistory ? (

            <div className="flex h-full items-center justify-center">

              <div className="flex flex-col items-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <Loader2
                    className="h-6 w-6 animate-spin text-blue-600"
                  />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-600">
                  Loading conversation...
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Fetching your chat history
                </p>

              </div>

            </div>

          ) : historyError ? (

            /* HISTORY ERROR */
            <div className="flex h-full items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <X size={20} />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-700">
                  Failed to load conversation
                </p>

                <button
                  type="button"
                  onClick={() =>
                    selectedDoc &&
                    fetchChatHistory(
                      selectedDoc.id
                    )
                  }
                  className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Try again
                </button>

              </div>

            </div>

          ) : !selectedDoc ? (

            /* NO DOCUMENT */
            <div className="flex h-full flex-col items-center justify-center text-center p-6 max-w-md mx-auto">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 mb-4 shadow-sm">
                <FileText size={32} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Select or Upload a PDF
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Choose a document from the left sidebar or upload a new PDF to query its content with exact citations.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowUploadModal(
                    true
                  )
                }
                className="mt-6 cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Plus size={16} />
                Upload PDF Document
              </button>

            </div>

          ) : messages.length === 0 ? (

            /* EMPTY CHAT */
            <div className="flex h-full flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mb-4 shadow-md shadow-blue-500/20">
                <Sparkles size={26} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {selectedDoc.originalName} is Loaded!
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md">
                Ask any question about the contents of this document.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">

                {PROMPT_SUGGESTIONS.map(
                  (suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={
                        isTyping ||
                        selectedDoc.status !==
                          "COMPLETED"
                      }
                      onClick={() =>
                        handleSendMessage(
                          suggestion
                        )
                      }
                      className="cursor-pointer text-left p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-900 transition shadow-xs flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>
                        {suggestion}
                      </span>

                      <ChevronRight
                        size={14}
                        className="text-slate-400 group-hover:text-blue-600 shrink-0 ml-2"
                      />
                    </button>
                  )
                )}

              </div>

            </div>

          ) : (

            /* MESSAGES */
            messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onCopy={handleCopy}
                copiedMessageId={
                  copiedMessageId
                }
              />
            ))

          )}

          {/* AI TYPING */}
          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />

        </div>

        {/* =====================================================
            INPUT
        ===================================================== */}

        <div className="border-t border-slate-200/80 bg-white px-4 sm:px-8 py-4">

          <div className="relative flex items-end rounded-2xl border border-slate-300 bg-white shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDoc
                  ? `Ask a question about ${selectedDoc.originalName}... (Press Enter to send)`
                  : "Select a document to enable chat..."
              }
              rows={1}
              disabled={
                isTyping ||
                loadingHistory ||
                !selectedDoc ||
                selectedDoc.status !==
                  "COMPLETED"
              }
              className="max-h-36 min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() =>
                handleSendMessage()
              }
              disabled={
                !input.trim() ||
                isTyping ||
                loadingHistory ||
                !selectedDoc ||
                selectedDoc.status !==
                  "COMPLETED"
              }
              className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer shadow-xs"
              aria-label="Send query"
            >

              {isTyping ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Send size={15} />
              )}

            </button>

          </div>

          <p className="mt-2 text-[10px] text-center text-slate-400">
            Answers are generated strictly from the provided PDF context and verified with Qdrant vector retrieval.
          </p>

        </div>

      </main>

      {/* =====================================================
          UPLOAD MODAL
      ===================================================== */}

      {showUploadModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">

          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileText size={18} />
                </div>

                <div>

                  <h3 className="font-bold text-sm text-slate-900">
                    Upload PDF Document
                  </h3>

                  <p className="text-[11px] text-slate-500">
                    Max limit: 5 documents per account
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowUploadModal(
                    false
                  )
                }
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>

            </div>

            {/* UPLOAD */}
            <div className="mt-6">

              <FileUpload
                onUploadSuccess={(
                  newDocId
                ) => {
                  setShowUploadModal(
                    false
                  );

                  /*
                   * Fetch updated documents.
                   * The new document is automatically selected.
                   */
                  fetchUserDocuments(
                    newDocId
                  );
                }}
              />

            </div>

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

  onCopy: (
    text: string,
    messageId: string | number
  ) => void;

  copiedMessageId:
    | string
    | number
    | null;
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
      className={`flex w-full gap-3 sm:gap-4 ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}
    >

      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs mt-1">
          <Bot size={17} />
        </div>
      )}

      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
          isUser
            ? "items-end"
            : "items-start"
        }`}
      >

        <div className="mb-1 text-[11px] font-semibold text-slate-400 px-1">
          {isUser
            ? "You"
            : "DocuMind Copilot"}
        </div>

        <div
          className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
            isUser
              ? "rounded-tr-xs bg-blue-600 text-white"
              : "rounded-tl-xs border border-slate-200/90 bg-white text-slate-800"
          }`}
        >

          <div className="whitespace-pre-wrap">
            {message.content}
          </div>

          {!isUser &&
            message.sources &&
            message.sources.length >
              0 && (
              <SourcePages
                sources={
                  message.sources
                }
              />
            )}

        </div>

        {!isUser && (
          <button
            type="button"
            onClick={() =>
              onCopy(
                message.content,
                message.id
              )
            }
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >

            {copiedMessageId ===
            message.id ? (
              <>
                <Check
                  size={13}
                  className="text-emerald-600"
                />

                <span className="text-emerald-600 font-medium">
                  Copied to clipboard
                </span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}

          </button>
        )}

      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 text-xs font-bold mt-1 shadow-xs">
          <User size={16} />
        </div>
      )}

    </div>
  );
}

/*
 * =========================================================
 * SOURCE PAGES
 * =========================================================
 */

function SourcePages({
  sources,
}: {
  sources: SourceDocument[];
}) {
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
            typeof page ===
            "number"
        )
    )
  ).sort((a, b) => a - b);

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">

      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
        <FileSearch size={13} />
        <span>Cited Pages:</span>
      </div>

      {pages.map((page) => (
        <span
          key={page}
          className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700"
        >
          Page {page}
        </span>
      ))}

    </div>
  );
}

/*
 * =========================================================
 * TYPING INDICATOR
 * =========================================================
 */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs mt-1">
        <Bot size={17} />
      </div>

      <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-xs">

        <Loader2
          className="animate-spin text-blue-600"
          size={15}
        />

        <span>
          Analyzing document context and formulating response...
        </span>

      </div>

    </div>
  );
}