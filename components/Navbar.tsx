"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 bg-[#18181b] text-white px-6 sm:px-8 z-50 shadow-md border-b border-zinc-800 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
      >
        <span className="font-bold text-lg tracking-tight text-white">
          Unacademy EWS
        </span>
      </Link>
    </header>
  );
}
