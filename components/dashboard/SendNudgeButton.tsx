"use client";

import React, { useState } from "react";
import SendNudgeModal from "@/components/dashboard/SendNudgeModal";
import { Send, CheckCircle2 } from "lucide-react";

interface SendNudgeButtonProps {
  studentId: string;
  studentName: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  nudgeStatus?: "PENDING" | "SENT" | "NOT_REQUIRED";
  className?: string;
}

export default function SendNudgeButton({
  studentId,
  studentName,
  riskLevel,
  nudgeStatus = "PENDING",
  className = "",
}: SendNudgeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isSent = nudgeStatus === "SENT";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-2 font-medium text-sm px-5 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer ${
          isSent
            ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300"
            : "bg-zinc-900 hover:bg-zinc-800 text-white"
        } ${className}`}
      >
        {isSent ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Resend Nudge
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Nudge
          </>
        )}
      </button>

      <SendNudgeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        studentId={studentId}
        studentName={studentName}
        riskLevel={riskLevel}
      />
    </>
  );
}
