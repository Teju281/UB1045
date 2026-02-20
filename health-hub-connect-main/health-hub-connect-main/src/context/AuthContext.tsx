import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setTokens, clearTokens, getAccessToken } from "@/lib/api";

export type UserRole = "public" | "patient" | "doctor" | "hospital_staff" | "admin";

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    hospital_id?: number;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // On mount — restore session from stored access token
    useEffect(() => {
        const restoreSession = async () => {
            const token = getAccessToken();
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch("/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser({
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            role: data.user.role as UserRole,
                            hospital_id: data.user.hospital_id,
                        });
                    } else {
                        clearTokens();
                    }
                } else {
                    // Token invalid/expired — try refresh
                    const refreshToken = localStorage.getItem("hh_refresh_token");
                    if (refreshToken) {
                        const refreshRes = await fetch("/api/auth/refresh", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ refreshToken }),
                        });
                        if (refreshRes.ok) {
                            const refreshData = await refreshRes.json();
                            setTokens(refreshData.accessToken, refreshData.refreshToken);
                            // Retry me with new token
                            const retryRes = await fetch("/api/auth/me", {
                                headers: { Authorization: `Bearer ${refreshData.accessToken}` },
                            });
                            if (retryRes.ok) {
                                const retryData = await retryRes.json();
                                if (retryData.user) {
                                    setUser({
                                        id: retryData.user.id,
                                        name: retryData.user.name,
                                        email: retryData.user.email,
                                        role: retryData.user.role as UserRole,
                                        hospital_id: retryData.user.hospital_id,
                                    });
                                }
                            }
                        } else {
                            clearTokens();
                        }
                    } else {
                        clearTokens();
                    }
                }
            } catch (err) {
                console.warn("Session restore failed:", err);
                clearTokens();
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                return { success: false, error: data.error || "Login failed" };
            }

            if (!data.accessToken || !data.user) {
                return { success: false, error: "Invalid response from server" };
            }

            setTokens(data.accessToken, data.refreshToken);
            setUser({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role as UserRole,
                hospital_id: data.user.hospital_id,
            });

            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: "Cannot connect to backend. Make sure the server is running on port 5000.",
            };
        }
    };

    const logout = async () => {
        try {
            const token = getAccessToken();
            const refreshToken = localStorage.getItem("hh_refresh_token");
            if (token) {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ refreshToken }),
                });
            }
        } catch { /* silent */ }
        clearTokens();
        setUser(null);
    };

    const isRole = (...roles: UserRole[]): boolean => {
        if (!user) return roles.includes("public");
        return roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be inside AuthProvider");
    return ctx;
}
