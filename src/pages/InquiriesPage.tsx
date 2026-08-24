/**
 * HydroNourish — Client Inquiries & Contact Messages
 * Heritage Animal Clinic Capstone Project
 *
 * Dedicated admin page for viewing, managing, and responding to inquiries
 * submitted from the public landing page contact form.
 */

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppContext } from '../hooks/useAppContext';
import { ContactInquiry, InquiryStatus, ChatMessageItem } from '../types';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Mail,
  MailOpen,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Reply,
  ExternalLink,
  Filter,
  CheckCheck,
  Archive,
  Eye,
  Send,
  User,
  Calendar,
  AlertCircle,
  Inbox
} from 'lucide-react';

export const InquiriesPage: React.FC = () => {
  const { inquiries, markInquiryStatus, deleteInquiry, showToast } = useAppContext();

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  
  // Selected Inquiry for Modal View (dynamic by ID so thread updates instantly)
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Active selected inquiry derived dynamically from inquiries state
  const selectedInquiry = useMemo(() => {
    if (!selectedInquiryId) return null;
    return (inquiries || []).find((i) => i.id === selectedInquiryId) || null;
  }, [inquiries, selectedInquiryId]);

  // Delete Dialog state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered inquiries list
  const filteredInquiries = useMemo(() => {
    return (inquiries || []).filter((inq) => {
      if (!inq) return false;
      const matchesStatus = statusFilter === 'all' ? inq.status !== 'archived' : inq.status === statusFilter;
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        inq.name.toLowerCase().includes(query) ||
        inq.email.toLowerCase().includes(query) ||
        inq.subject.toLowerCase().includes(query) ||
        inq.message.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [inquiries, statusFilter, searchTerm]);

  // Statistics calculation
  const totalCount = (inquiries || []).length;
  const unreadCount = (inquiries || []).filter((i) => i && i.status === 'unread').length;
  const repliedCount = (inquiries || []).filter((i) => i && i.status === 'replied').length;
  const readCount = (inquiries || []).filter((i) => i && i.status === 'read').length;

  const todayCount = (inquiries || []).filter((i) => {
    if (!i || !i.createdAt) return false;
    const itemDate = new Date(i.createdAt).toDateString();
    const today = new Date().toDateString();
    return itemDate === today;
  }).length;

  // Handler: Open Inquiry Modal & mark as read if unread
  const handleOpenDetail = (inquiry: ContactInquiry) => {
    setSelectedInquiryId(inquiry.id);
    setReplyText(''); // Always start with a clean input box to type a NEW reply
    if (inquiry.status === 'unread') {
      markInquiryStatus(inquiry.id, 'read');
    }
  };

  // Handler: Mark All Unread as Read
  const handleMarkAllRead = async () => {
    const unreadItems = (inquiries || []).filter((i) => i && i.status === 'unread');
    if (unreadItems.length === 0) {
      showToast('info', 'All Caught Up', 'No unread inquiries to mark.');
      return;
    }

    for (const item of unreadItems) {
      await markInquiryStatus(item.id, 'read');
    }
    showToast('success', 'Marked as Read', `All ${unreadItems.length} unread inquiries marked as read.`);
  };

  // Handler: Send / Record Reply
  const handleSendReply = async () => {
    if (!selectedInquiry) return;
    if (!replyText.trim()) {
      showToast('warning', 'Empty Reply', 'Please enter a reply message before submitting.');
      return;
    }

    const textToSend = replyText.trim();
    setReplyText(''); // Instantly clear input field
    setIsSendingReply(true);
    try {
      await markInquiryStatus(selectedInquiry.id, 'replied', textToSend);
      showToast('success', 'Reply Sent', `Message transmitted live to ${selectedInquiry.name}.`);
    } catch {
      showToast('error', 'Reply Failed', 'Could not transmit reply.');
      setReplyText(textToSend);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Handler: Launch Native Email Client
  const handleLaunchEmailClient = (inquiry: ContactInquiry) => {
    const subject = encodeURIComponent(`Re: ${inquiry.subject} — Heritage Animal Clinic`);
    const body = encodeURIComponent(`Hi ${inquiry.name},\n\nThank you for reaching out to Heritage Animal Clinic regarding:\n"${inquiry.message}"\n\n\n\nKind regards,\nHeritage Animal Clinic Team`);
    window.open(`mailto:${inquiry.email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Handler: Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteInquiry(deleteTargetId);
    if (selectedInquiryId === deleteTargetId) {
      setSelectedInquiryId(null);
    }
    setDeleteTargetId(null);
  };

  // Helper: Format Date
  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Helper: Get Initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <DashboardLayout pageTitle="Client Inquiries & Contact Messages" breadcrumbs={[{ label: 'Inquiries' }]}>
      <div className="space-y-6">
        {/* ================= HEADER BANNER ================= */}
        <div className="clinic-card p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <Inbox className="w-3.5 h-3.5 text-rose-400" />
              Public Contact Inquiries Ingestion Hub
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Heritage Animal Clinic Messages
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Direct inquiries, consultation requests, and patient setup questions submitted through the public website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Realtime Ingestion
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All as Read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        {/* ================= STAT CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Inquiries"
            value={totalCount}
            subtitle="All received messages"
            icon={Inbox}
            iconBgColor="bg-slate-100"
            iconTextColor="text-slate-700"
            badgeText="All Time"
            badgeType="info"
          />
          <StatCard
            title="Unread Messages"
            value={unreadCount}
            subtitle="Pending staff review"
            icon={Mail}
            iconBgColor="bg-rose-50"
            iconTextColor="text-rose-600"
            badgeText={unreadCount > 0 ? 'Needs Attention' : 'All Clear'}
            badgeType={unreadCount > 0 ? 'alert' : 'success'}
          />
          <StatCard
            title="Replied Inquiries"
            value={repliedCount}
            subtitle="Addressed by clinic team"
            icon={Reply}
            iconBgColor="bg-emerald-50"
            iconTextColor="text-emerald-600"
            badgeText="Handled"
            badgeType="success"
          />
          <StatCard
            title="Received Today"
            value={todayCount}
            subtitle="New in last 24 hours"
            icon={Clock}
            iconBgColor="bg-sky-50"
            iconTextColor="text-sky-600"
            badgeText="Today"
            badgeType="info"
          />
        </div>

        {/* ================= FILTER & SEARCH BAR ================= */}
        <div className="clinic-card p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Messages ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('unread')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'unread'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusFilter === 'unread' ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStatusFilter('read')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'read'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Read ({readCount})
              </button>
              <button
                onClick={() => setStatusFilter('replied')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'replied'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Replied ({repliedCount})
              </button>
              <button
                onClick={() => setStatusFilter('archived')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'archived'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Archived
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, subject, or message text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= INQUIRIES LIST / CARDS ================= */}
        {filteredInquiries.length === 0 ? (
          <div className="clinic-card p-12 text-center space-y-4 max-w-xl mx-auto my-6 border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">No Inquiries Found</h3>
              <p className="text-xs text-slate-500">
                {searchTerm
                  ? `No inquiries match "${searchTerm}". Try adjusting your search query.`
                  : statusFilter === 'unread'
                  ? 'Great job! There are no unread inquiries waiting for review.'
                  : 'No contact inquiries in this category.'}
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.map((inquiry) => {
              const isUnread = inquiry.status === 'unread';
              const isReplied = inquiry.status === 'replied';

              return (
                <div
                  key={inquiry.id}
                  className={`clinic-card p-4 sm:p-5 transition-all hover:shadow-md cursor-pointer border ${
                    isUnread
                      ? 'bg-rose-50/40 border-rose-200 ring-1 ring-teal-200/50'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                  onClick={() => handleOpenDetail(inquiry)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isUnread
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getInitials(inquiry.name)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{inquiry.name}</h4>
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                              NEW
                            </span>
                          )}
                          {isReplied && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Replied
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{inquiry.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTimestamp(inquiry.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject & Snippet */}
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
                        {inquiry.subject || 'General Inquiry'}
                      </span>
                      {inquiry.subject?.includes('[') && inquiry.subject?.includes(']') && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                          🐾 Registered Pet Owner Message
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {inquiry.message}
                    </p>

                    {/* Sent Reply Preview if Replied */}
                    {inquiry.replyMessage && (
                      <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center justify-between font-extrabold text-[11px] text-emerald-800">
                          <span className="flex items-center gap-1.5">
                            <Reply className="w-3.5 h-3.5 text-emerald-600" />
                            Clinic Staff Reply Sent via Website:
                          </span>
                          {inquiry.repliedAt && (
                            <span className="text-[10px] text-emerald-600 font-normal">
                              {formatTimestamp(inquiry.repliedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-emerald-800 leading-relaxed font-sans line-clamp-2 italic">
                          "{inquiry.replyMessage}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div
                    className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      {isUnread ? (
                        <button
                          onClick={() => markInquiryStatus(inquiry.id, 'read')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                          title="Mark as Read"
                        >
                          <MailOpen className="w-3.5 h-3.5 text-slate-500" />
                          Mark as Read
                        </button>
                      ) : (
                        <button
                          onClick={() => markInquiryStatus(inquiry.id, 'unread')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                          title="Mark as Unread"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          Mark as Unread
                        </button>
                      )}

                      <button
                        onClick={() => handleLaunchEmailClient(inquiry)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
                        title="Send Email via Mail App"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                        Email Client
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDetail(inquiry)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-600" />
                        View Details
                      </button>

                      <button
                        onClick={() => setDeleteTargetId(inquiry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= INQUIRY DETAIL CHATBOX MODAL ================= */}
        {selectedInquiry && (() => {
          let threadMessages: ChatMessageItem[] = [];
          if (selectedInquiry.messagesThread && selectedInquiry.messagesThread.length > 0) {
            threadMessages = selectedInquiry.messagesThread;
          } else if (
            selectedInquiry.replyMessage &&
            selectedInquiry.replyMessage.trim().startsWith('[') &&
            selectedInquiry.replyMessage.trim().endsWith(']')
          ) {
            try {
              const parsed = JSON.parse(selectedInquiry.replyMessage.trim());
              if (Array.isArray(parsed) && parsed.length > 0) {
                threadMessages = parsed;
              }
            } catch {}
          }

          if (threadMessages.length === 0) {
            if (selectedInquiry.message) {
              threadMessages.push({
                id: `msg-1-${selectedInquiry.id}`,
                sender: 'owner' as const,
                senderName: selectedInquiry.name || 'Client',
                message: selectedInquiry.message,
                timestamp: selectedInquiry.createdAt,
              });
            }
            if (selectedInquiry.replyMessage && !selectedInquiry.replyMessage.trim().startsWith('[')) {
              threadMessages.push({
                id: `msg-2-${selectedInquiry.id}`,
                sender: 'admin' as const,
                senderName: 'Heritage Animal Clinic Staff',
                message: selectedInquiry.replyMessage,
                timestamp: selectedInquiry.repliedAt || selectedInquiry.createdAt,
              });
            }
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
              <div
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Chat Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/80 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        {getInitials(selectedInquiry.name)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {selectedInquiry.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            selectedInquiry.status === 'replied'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : selectedInquiry.status === 'unread'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {selectedInquiry.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono mt-0.5">
                        <span>{selectedInquiry.email}</span>
                        {selectedInquiry.phone && <span>• {selectedInquiry.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedInquiryId(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* 2. Details Summary Ribbon (Always Included!) */}
                <div className="bg-slate-100/90 border-b border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Topic:</span>
                    <span className="font-extrabold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      {selectedInquiry.subject || 'General Inquiry'}
                    </span>
                    {selectedInquiry.subject?.includes('[') && selectedInquiry.subject?.includes(']') && (
                      <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 text-[10px]">
                        🐾 Patient Linked
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 font-medium text-[10px]">
                    <span>Received: <strong>{formatTimestamp(selectedInquiry.createdAt)}</strong></span>
                    <span className="font-mono">Ref: {selectedInquiry.id}</span>
                  </div>
                </div>

                {/* 3. Real Chatbox Conversation Timeline */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 max-h-[46vh]">
                  <div className="text-center my-1">
                    <span className="px-3 py-1 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-bold">
                      Conversation Started • {formatTimestamp(selectedInquiry.createdAt)}
                    </span>
                  </div>

                  {threadMessages.map((msg, idx) => {
                    const isClient = msg.sender === 'owner';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isClient ? 'items-start' : 'items-end'} space-y-1`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                          <span className="font-bold text-slate-600">{msg.senderName || (isClient ? selectedInquiry.name : 'Heritage Animal Clinic Staff')}</span>
                          <span>• {formatTimestamp(msg.timestamp)}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                            isClient
                              ? 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-xs'
                              : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs rounded-tr-xs font-medium'
                          }`}
                        >
                          {msg.message}
                        </div>

                        {!isClient && (
                          <div className="text-[10px] text-emerald-600 font-bold px-1 flex items-center gap-1">
                            <span>✓ Delivered to Portal</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 4. Quick Reply Suggestion Chips */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Quick Templates:</span>
                  {[
                    { label: 'Telemetry Normal', text: 'Hello! We have reviewed your inquiry. Your pet’s diet and telemetry look stable. Please continue regular feeding routine.' },
                    { label: 'Prescription Ready', text: 'Hi! The requested medication / supplement prescription has been prepared and is ready for pickup at our front desk.' },
                    { label: 'Schedule Checkup', text: 'Hello! Based on the symptoms described, we recommend bringing your pet in for an in-person physical checkup.' },
                    { label: 'Hydration Guidance', text: 'Thank you for reaching out! Please ensure your pet meets the daily hydration target and observe for 24 hours.' },
                  ].map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setReplyText(t.text)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-800 text-slate-600 text-[11px] font-semibold transition-colors border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
                    >
                      + {t.label}
                    </button>
                  ))}
                </div>

                {/* 5. Chat Input Bar */}
                <div className="p-3.5 bg-white border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <textarea
                      rows={2}
                      placeholder={`Type your reply to ${selectedInquiry.name}... (Press Enter to send, Shift+Enter for newline)`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="flex-1 p-3 rounded-2xl border border-slate-300 focus:border-rose-500 focus:outline-none text-xs leading-relaxed resize-none bg-slate-50/50"
                    />

                    <button
                      type="button"
                      disabled={isSendingReply || !replyText.trim()}
                      onClick={handleSendReply}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      <Send className={`w-4 h-4 ${isSendingReply ? 'animate-spin' : ''}`} />
                      <span>{isSendingReply ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>

                  {/* Footer Action Links */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchEmailClient(selectedInquiry)}
                        className="text-slate-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Mail App
                      </button>

                      <span className="text-slate-300">•</span>

                      <button
                        type="button"
                        onClick={() => {
                          markInquiryStatus(selectedInquiry.id, 'archived');
                          setSelectedInquiryId(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archive
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(selectedInquiry.id)}
                      className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ================= DELETE CONFIRMATION DIALOG ================= */}
        <ConfirmDialog
          isOpen={deleteTargetId !== null}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Inquiry"
          message="Are you sure you want to permanently delete this client inquiry? This action cannot be undone."
          confirmText="Delete Message"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
};
