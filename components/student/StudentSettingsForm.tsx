"use client";

import React, { useState, useTransition, useActionState } from "react";
import {
    updateStudentProfile,
    changeStudentPassword,
    deleteStudentAccount,
} from "@/app/actions/settings";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface StudentSettingsFormProps {
    initialUser: {
        id: string;
        name: string;
        email: string;
    };
}

export default function StudentSettingsForm({ initialUser }: StudentSettingsFormProps) {
    // Profile State
    const [name, setName] = useState(initialUser.name);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [isProfilePending, startProfileTransition] = useTransition();

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
        changeStudentPassword,
        null,
    );

    // Delete Account State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProfileSuccess(null);
        setProfileError(null);

        const formData = new FormData();
        formData.append("name", name);

        startProfileTransition(async () => {
            const res = await updateStudentProfile(null, formData);
            if (res.success) {
                setProfileSuccess(res.message || "Profile updated successfully.");
                setTimeout(() => setProfileSuccess(null), 5000);
            } else if (res.errors?.name) {
                setProfileError(res.errors.name[0]);
            } else if (res.error) {
                setProfileError(res.error);
            }
        });
    };

    const handleDeleteAccount = () => {
        setDeleteError(null);
        startDeleteTransition(async () => {
            try {
                await deleteStudentAccount();
            } catch (err) {
                setDeleteError(
                    err instanceof Error ? err.message : "Failed to delete account.",
                );
                setShowDeleteModal(false);
            }
        });
    };

    return (
        <div className="p-8 sm:p-10 max-w-4xl space-y-8 font-sans">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                    Settings
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Manage your student account settings and preferences.
                </p>
            </div>

            {/* Profile Information Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900">
                    Profile Information
                </h2>

                {profileSuccess && (
                    <div className="max-w-md flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3.5 py-2.5 rounded-md animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{profileSuccess}</span>
                    </div>
                )}

                {profileError && (
                    <div className="max-w-md flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3.5 py-2.5 rounded-md animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{profileError}</span>
                    </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="profile-name"
                            className="block text-sm font-medium text-zinc-800"
                        >
                            Name
                        </label>
                        <input
                            id="profile-name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (profileError) setProfileError(null);
                            }}
                            className="w-full px-3.5 py-2 bg-white text-sm text-zinc-900 rounded-md border border-zinc-300 shadow-2xs outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="profile-email"
                            className="block text-sm font-medium text-zinc-800"
                        >
                            Email
                        </label>
                        <input
                            id="profile-email"
                            type="email"
                            value={initialUser.email}
                            disabled
                            className="w-full px-3.5 py-2 bg-[#f3f4f6] text-sm text-zinc-500 rounded-md border border-zinc-200 cursor-not-allowed select-none"
                        />
                        <p className="text-xs text-zinc-400 mt-1">
                            Email cannot be changed
                        </p>
                    </div>

                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={isProfilePending || name.trim() === initialUser.name}
                            className="bg-[#27272a] hover:bg-[#18181b] active:scale-[0.99] text-white font-medium text-sm py-2 px-4 rounded-md shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isProfilePending && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <span>{isProfilePending ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </section>

            {/* Change Password Section */}
            <section className="space-y-4 pt-2">
                <h2 className="text-lg font-bold text-zinc-900">
                    Change Password
                </h2>

                {passwordState?.message && (
                    <div className="max-w-md flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3.5 py-2.5 rounded-md animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{passwordState.message}</span>
                    </div>
                )}

                {passwordState?.error && (
                    <div className="max-w-md flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3.5 py-2.5 rounded-md animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordState.error}</span>
                    </div>
                )}

                <form action={passwordFormAction} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-zinc-800"
                        >
                            Current Password
                        </label>
                        <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 rounded-md border border-zinc-300 shadow-2xs outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors"
                        />
                        {passwordState?.errors?.currentPassword && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {passwordState.errors.currentPassword[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-zinc-800"
                        >
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 rounded-md border border-zinc-300 shadow-2xs outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors"
                        />
                        {passwordState?.errors?.newPassword && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {passwordState.errors.newPassword[0]}
                            </p>
                        )}
                    </div>

                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={isPasswordPending || !currentPassword || !newPassword}
                            className="bg-[#27272a] hover:bg-[#18181b] active:scale-[0.99] text-white font-medium text-sm py-2 px-4 rounded-md shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isPasswordPending && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <span>{isPasswordPending ? "Updating..." : "Update Password"}</span>
                        </button>
                    </div>
                </form>
            </section>

            {/* Delete Account Section */}
            <section className="space-y-3 pt-2">
                <h2 className="text-lg font-bold text-red-600">
                    Delete Account
                </h2>
                <p className="text-sm text-zinc-600">
                    This action is permanent and cannot be undone. All your quiz attempts, course enrollments, and progress will be lost.
                </p>

                {deleteError && (
                    <div className="max-w-md flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3.5 py-2.5 rounded-md">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{deleteError}</span>
                    </div>
                )}

                <div className="pt-1">
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        disabled={isDeletePending}
                        className="bg-[#dc2626] hover:bg-red-700 active:scale-[0.99] text-white font-medium text-sm py-2 px-4 rounded-md shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeletePending && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span>{isDeletePending ? "Deleting..." : "Delete Account"}</span>
                    </button>
                </div>
            </section>

            {/* Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900">
                                Delete Account?
                            </h3>
                        </div>

                        <p className="text-sm text-zinc-600">
                            Are you sure you want to permanently delete your student account? All your quiz attempts, course enrollments, and progress will be lost. This action cannot be undone.
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeletePending}
                                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={isDeletePending}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                                {isDeletePending && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                <span>{isDeletePending ? "Deleting..." : "Confirm Delete"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
