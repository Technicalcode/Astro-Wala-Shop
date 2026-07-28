import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { backendUrl, fetchWithAuth, readApiResponse } from "../../config/api";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const formatDate = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    unread: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});

  const statusLabel = useMemo(
    () => statusOptions.find((item) => item.value === status)?.label || "All statuses",
    [status],
  );

  const loadMessages = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (status !== "all") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetchWithAuth(
        `${backendUrl}/api/v1/contact/admin/all?${params.toString()}`,
      );
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load contact messages.");
      }

      setMessages(data.messages || []);
      setPagination({
        total: Number(data.total) || 0,
        unread: Number(data.unread) || 0,
        totalPages: Number(data.totalPages) || 1,
      });
    } catch (err) {
      setError(err.message || "Failed to load contact messages.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    loadMessages();
  };

  const updateStatus = async (message, nextStatus) => {
    setActionId(message.id);
    try {
      const response = await fetchWithAuth(
        `${backendUrl}/api/v1/contact/admin/${message.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Could not update message.");

      setMessages((current) =>
        current.map((item) => (item.id === message.id ? data.data : item)),
      );
      setPagination((current) => ({
        ...current,
        unread:
          message.status === "unread" && nextStatus === "read"
            ? Math.max(0, current.unread - 1)
            : message.status === "read" && nextStatus === "unread"
              ? current.unread + 1
              : current.unread,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId("");
    }
  };

  const deleteMessage = async (message) => {
    if (!confirm(`Delete message from ${message.name}?`)) return;
    setActionId(message.id);

    try {
      const response = await fetchWithAuth(
        `${backendUrl}/api/v1/contact/admin/${message.id}`,
        { method: "DELETE" },
      );
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Could not delete message.");

      setMessages((current) => current.filter((item) => item.id !== message.id));
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        unread:
          message.status === "unread"
            ? Math.max(0, current.unread - 1)
            : current.unread,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId("");
    }
  };

  const sendReply = async (message) => {
    const reply = String(replyDrafts[message.id] || "").trim();
    if (reply.length < 3) {
      alert("Please enter a reply message.");
      return;
    }

    setActionId(message.id);
    try {
      const response = await fetchWithAuth(
        `${backendUrl}/api/v1/contact/admin/${message.id}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: reply }),
        },
      );
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Could not send reply.");

      setMessages((current) =>
        current.map((item) => (item.id === message.id ? data.data : item)),
      );
      setReplyDrafts((current) => ({ ...current, [message.id]: "" }));
      setPagination((current) => ({
        ...current,
        unread:
          message.status === "unread" ? Math.max(0, current.unread - 1) : current.unread,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId("");
    }
  };

  return (
    <div>
      <div className="relative mb-8 mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              Contact Messages
            </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-indigo-100 md:text-lg">
              View customer enquiries from the Contact Us page and track read
              messages from one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-white">
            <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-3">
              <p className="text-xs text-white/70">Total</p>
              <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-3">
              <p className="text-xs text-white/70">Unread</p>
              <p className="mt-1 text-2xl font-bold">{pagination.unread}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 mb-8 grid gap-4 rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-xl backdrop-blur-xl lg:grid-cols-[1fr_220px]">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, subject, or message"
            className="block w-full rounded-xl border border-gray-200 bg-white p-3 pl-12 text-sm font-medium text-gray-900 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </form>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="block w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white/80 py-20 text-center font-medium text-gray-500 shadow-xl">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          Loading contact messages...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 py-12 text-center font-medium text-red-700">
          {error}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white/80 py-24 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300 shadow-inner">
            <MessageSquare size={36} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            No Contact Messages
          </h3>
          <p className="text-gray-500">
            {statusLabel} messages will appear here after customers submit the form.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className="rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-xl transition-shadow hover:shadow-2xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        message.status === "unread"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {message.status === "unread" ? "Unread" : "Read"}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {message.subject}
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                    {message.message}
                  </p>
                  {message.replies?.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Admin Replies
                      </p>
                      {message.replies.map((reply, index) => (
                        <div
                          key={reply.id || `${message.id}-reply-${index}`}
                          className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"
                        >
                          <p className="whitespace-pre-wrap">{reply.message}</p>
                          <p className="mt-2 text-xs text-blue-700">
                            {reply.adminEmail ? `${reply.adminEmail} - ` : ""}
                            {formatDate(reply.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 lg:w-80">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Customer Details
                  </p>
                  <p className="text-base font-bold text-gray-900">{message.name}</p>
                  <a
                    href={`mailto:${message.email}`}
                    className="mt-3 flex items-center gap-2 text-sm text-brand hover:underline"
                  >
                    <Mail size={15} /> {message.email}
                  </a>
                  {message.phone ? (
                    <a
                      href={`tel:${message.phone}`}
                      className="mt-2 flex items-center gap-2 text-sm text-gray-700 hover:text-brand"
                    >
                      <Phone size={15} /> {message.phone}
                    </a>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                      <Phone size={15} /> No phone number
                    </p>
                  )}
                  {message.userEmail && (
                    <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
                      Logged in as:{" "}
                      <span className="font-semibold text-gray-700">
                        {message.userEmail}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Reply to user
                  </label>
                  <textarea
                    rows={3}
                    value={replyDrafts[message.id] || ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [message.id]: event.target.value,
                      }))
                    }
                    placeholder="Write a reply that will be visible to this user on the Contact page."
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={actionId === message.id}
                      onClick={() => sendReply(message)}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                    >
                      <Send size={16} />
                      Send Reply
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={actionId === message.id}
                  onClick={() =>
                    updateStatus(
                      message,
                      message.status === "unread" ? "read" : "unread",
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  Mark {message.status === "unread" ? "read" : "unread"}
                </button>
                <button
                  type="button"
                  disabled={actionId === message.id}
                  onClick={() => deleteMessage(message)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && pagination.total > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 text-sm text-gray-500 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page <strong className="text-gray-900">{page}</strong> of{" "}
            <strong className="text-gray-900">{pagination.totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((current) => Math.min(pagination.totalPages, current + 1))
              }
              className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
