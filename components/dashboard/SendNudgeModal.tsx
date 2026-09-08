"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, Send, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { sendNudgeAction } from "@/app/actions/nudge";

interface SendNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
}

const TEMPLATE_DEFINITIONS = [
  {
    id: "missed-quizzes",
    label: "Missed Quizzes Check-in",
    getMessage: (firstName: string) =>
      `Hi ${firstName}, we noticed you have upcoming or missed quiz evaluations. Please reach out if you need assistance catching up!`,
  },
  {
    id: "inactivity-alert",
    label: "Inactivity Alert",
    getMessage: (firstName: string) =>
      `Hi ${firstName}, we noticed a dip in your platform logins recently. Let us know if you need mentor support or guidance to get back on track.`,
  },
  {
    id: "encouragement",
    label: "General Encouragement",
    getMessage: (firstName: string) =>
      `Hi ${firstName}, keep up the great effort in your coursework! Feel free to ask any questions if you run into challenging topics.`,
  },
];

const RISK_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High Risk", className: "bg-red-50 text-red-700 border-red-200" },
  MEDIUM: { label: "Medium Risk", className: "bg-amber-50 text-amber-700 border-amber-200" },
  LOW: { label: "Low Risk", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function SendNudgeModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  riskLevel,
}: SendNudgeModalProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const firstName = studentName.trim().split(" ")[0] || "Student";

  // Reset modal state dynamically whenever modal opens or recipient changes
  useEffect(() => {
    if (isOpen) {
      const defaultText = TEMPLATE_DEFINITIONS[0].getMessage(firstName);
      setMessage(defaultText);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, firstName, studentId]);

  // ESC key dismissal handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const handleTemplateClick = (getMessageFn: (name: string) => string) => {
    setMessage(getMessageFn(firstName));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim().length < 5) {
      setError("Message must be at least 5 characters long.");
      return;
    }
    if (message.length > 1000) {
      setError("Message cannot exceed 1000 characters.");
      return;
    }

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("message", message);

    startTransition(async () => {
      const res = await sendNudgeAction(null, formData);
      if (res.success) {
        setSuccess(res.message || "Nudge sent successfully!");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Failed to send nudge.");
      }
    });
  };

  const badgeStyle = RISK_BADGE_STYLES[riskLevel] || RISK_BADGE_STYLES.LOW;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isPending) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/80">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-zinc-700" />
              Send Targeted Nudge
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600">
              <span>To: <strong className="text-zinc-900">{studentName}</strong></span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeStyle.className}`}>
                {badgeStyle.label}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-200/60 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Select Templates */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
              Intervention Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_DEFINITIONS.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateClick(tmpl.getMessage)}
                  disabled={isPending}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="nudge-message-input" className="text-xs font-semibold text-zinc-700">
                Message Content
              </label>
              <span
                className={`text-xs font-medium ${
                  message.length > 1000
                    ? "text-red-600 font-bold"
                    : message.length < 5
                    ? "text-amber-600"
                    : "text-zinc-500"
                }`}
              >
                {message.length} / 1000
              </span>
            </div>
            <textarea
              id="nudge-message-input"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
              placeholder="Enter your targeted nudge message for the student..."
              className="w-full p-3 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white resize-y"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || message.trim().length < 5 || message.length > 1000}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Nudge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
