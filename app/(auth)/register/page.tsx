"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle,
} from "lucide-react";
import { registerUser } from "@/app/actions/auth";
import { useActionState } from "react";

interface FormData {
    name: string;
    email: string;
    password: string;
    role: "STUDENT" | "INSTRUCTOR";
}

interface FieldErrors {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string[];
}

export default function RegisterPage() {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showError, setShowError] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [state, formAction, isPending] = useActionState(registerUser, null);

    useEffect(() => {
        if (state?.error) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowError(true);
            const timer = setTimeout(() => {
                setShowError(false);
            }, 10000);

            return () => clearTimeout(timer);
        } else {
            setShowError(false);
        }
    }, [state]);

    useEffect(() => {
        if (state?.errors) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFieldErrors(state.errors);
        } else {
            setFieldErrors({});
        }
    }, [state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (fieldErrors[name as keyof FieldErrors]) {
            setFieldErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }

        if (name === "email" && showError) {
            setShowError(false);
        }
    };

    return (
        <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 py-10 font-sans select-none">
            <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] p-8 sm:p-10 transition-all">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                        Create Account
                    </h1>
                    <p className="text-base text-zinc-500 mt-1.5 font-normal">
                        Join the platform to continue.
                    </p>
                </div>

                {showError && state?.error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3.5 py-2.5 rounded-lg animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{state.error}</span>
                    </div>
                )}

                <form action={formAction} noValidate className="space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="name"
                            className="block text-xs font-semibold text-zinc-700"
                        >
                            Full Name
                        </label>
                        <div className="relative group">
                            <div
                                className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${fieldErrors.name
                                        ? "text-red-400"
                                        : "text-zinc-400 group-focus-within:text-zinc-800"
                                    }`}
                            >
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Jane Doe"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full pl-10 pr-3.5 py-2.5 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-sm text-zinc-900 placeholder:text-zinc-400 rounded-lg border outline-none transition-all duration-200 ${fieldErrors.name
                                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                        : "border-zinc-200/90 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5"
                                    }`}
                            />
                        </div>
                        {fieldErrors.name && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {fieldErrors.name[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="block text-xs font-semibold text-zinc-700"
                        >
                            Email Address
                        </label>
                        <div className="relative group">
                            <div
                                className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${fieldErrors.email
                                        ? "text-red-400"
                                        : "text-zinc-400 group-focus-within:text-zinc-800"
                                    }`}
                            >
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="jane@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full pl-10 pr-3.5 py-2.5 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-sm text-zinc-900 placeholder:text-zinc-400 rounded-lg border outline-none transition-all duration-200 ${fieldErrors.email
                                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                        : "border-zinc-200/90 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5"
                                    }`}
                            />
                        </div>
                        {fieldErrors.email && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {fieldErrors.email[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="block text-xs font-semibold text-zinc-700"
                        >
                            Password
                        </label>
                        <div className="relative group">
                            <div
                                className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${fieldErrors.password
                                        ? "text-red-400"
                                        : "text-zinc-400 group-focus-within:text-zinc-800"
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full pl-10 pr-10 py-2.5 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-sm text-zinc-900 placeholder:text-zinc-400 rounded-lg border outline-none transition-all duration-200 ${fieldErrors.password
                                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                        : "border-zinc-200/90 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 focus:outline-none transition-colors cursor-pointer"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {fieldErrors.password[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 pt-1">
                        <label className="block text-xs font-semibold text-zinc-700">
                            Role
                        </label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="role"
                                    value="STUDENT"
                                    checked={formData.role === "STUDENT"}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-4 h-4 rounded-full border border-zinc-300 bg-zinc-100/90 peer-checked:bg-black peer-checked:border-black transition-all duration-150 group-hover:border-zinc-500 shadow-2xs" />
                                <span className="text-sm font-medium text-zinc-800 group-hover:text-black">
                                    Student
                                </span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="role"
                                    value="INSTRUCTOR"
                                    checked={formData.role === "INSTRUCTOR"}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-4 h-4 rounded-full border border-zinc-300 bg-zinc-100/90 peer-checked:bg-black peer-checked:border-black transition-all duration-150 group-hover:border-zinc-500 shadow-2xs" />
                                <span className="text-sm font-medium text-zinc-800 group-hover:text-black">
                                    Instructor
                                </span>
                            </label>
                        </div>
                        {fieldErrors.role && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {fieldErrors.role[0]}
                            </p>
                        )}
                    </div>

                    <div className="pt-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-[#1e2329] hover:bg-[#111418] active:scale-[0.99] text-white font-medium text-sm py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span>{isPending ? "Creating account..." : "Create Account"}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs sm:text-sm text-zinc-500">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-zinc-900 hover:underline"
                        >
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
