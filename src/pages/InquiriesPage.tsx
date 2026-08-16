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
import { ContactInquiry, InquiryStatus } from '../types';
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
  
  // Selected Inquiry for Modal View
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

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
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.replyMessage || '');
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

    setIsSendingReply(true);
    try {
      await markInquiryStatus(selectedInquiry.id, 'replied', replyText.trim());
      showToast('success', 'Reply Recorded', `Response saved for ${selectedInquiry.name}.`);
      setSelectedInquiry((prev) => (prev ? { ...prev, status: 'replied', replyMessage: replyText.trim(), repliedAt: new Date().toISOString() } : null));
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
    if (selectedInquiry?.id === deleteTargetId) {
      setSelectedInquiry(null);
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Inbox className="w-3.5 h-3.5 text-teal-400" />
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
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
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
            badgeType="neutral"
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
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
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
                      ? 'bg-teal-50/40 border-teal-200 ring-1 ring-teal-200/50'
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
                            ? 'bg-teal-600 text-white'
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
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                        {inquiry.subject || 'General Inquiry'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {inquiry.message}
                    </p>
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
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 transition-colors"
                        title="Send Email via Mail App"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                        Email Client
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDetail(inquiry)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
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

        {/* ================= INQUIRY DETAIL MODAL ================= */}
        {selectedInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {getInitials(selectedInquiry.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {selectedInquiry.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedInquiry.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase text-slate-400">
                      Subject
                    </span>
                    <span className="font-bold text-slate-800">{selectedInquiry.subject}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase text-slate-400">
                      Date Received
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatTimestamp(selectedInquiry.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase text-slate-400">
                      Status
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-0.5 ${
                        selectedInquiry.status === 'replied'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedInquiry.status === 'unread'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedInquiry.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Inquiry Message Text */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Message Content
                  </label>
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-800 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                    {selectedInquiry.message}
                  </div>
                </div>

                {/* Response / Notes Section */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Clinic Response &amp; Follow-up Notes
                    </label>
                    {selectedInquiry.repliedAt && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        Replied on: {formatTimestamp(selectedInquiry.repliedAt)}
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Write clinical reply notes, follow-up schedule, or staff resolution details..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-slate-300 focus:border-teal-500 focus:outline-none text-xs"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleLaunchEmailClient(selectedInquiry)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                      Open in Email App
                    </button>

                    <button
                      type="button"
                      disabled={isSendingReply}
                      onClick={handleSendReply}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className={`w-4 h-4 ${isSendingReply ? 'animate-spin' : ''}`} />
                      {isSendingReply ? 'Saving...' : 'Save & Mark as Replied'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setDeleteTargetId(selectedInquiry.id);
                  }}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-100/70 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Inquiry
                </button>

                <div className="flex items-center gap-2">
                  {selectedInquiry.status !== 'archived' && (
                    <button
                      onClick={() => {
                        markInquiryStatus(selectedInquiry.id, 'archived');
                        setSelectedInquiry(null);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Archive className="w-4 h-4 text-slate-500" />
                      Archive
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
