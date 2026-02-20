// Central API helper — uses Vite proxy in dev, relative URL works in prod too
export const API_BASE = "/api";

// ── Token storage helpers ────────────────────────────────
export function getAccessToken(): string | null {
    return localStorage.getItem("hh_access_token");
}
export function setTokens(access: string, refresh: string) {
    localStorage.setItem("hh_access_token", access);
    localStorage.setItem("hh_refresh_token", refresh);
}
export function clearTokens() {
    localStorage.removeItem("hh_access_token");
    localStorage.removeItem("hh_refresh_token");
}

// ── Fetch wrapper with auto-refresh ──────────────────────
export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getAccessToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    // If 403, try refresh
    if (res.status === 403) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            headers["Authorization"] = `Bearer ${getAccessToken()}`;
            res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        }
    }
    return res;
}

async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("hh_refresh_token");
    if (!refreshToken) return false;
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
            const data = await res.json();
            setTokens(data.accessToken, data.refreshToken);
            return true;
        }
    } catch { }
    clearTokens();
    return false;
}

// ── Auth API ────────────────────────────────────────────
export const authApi = {
    async login(email: string, password: string) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        return res.json();
    },
    async register(name: string, email: string, password: string, role = "patient") {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
        });
        return res.json();
    },
    async me() {
        const res = await apiFetch("/auth/me");
        return res.json();
    },
    async logout(refreshToken?: string) {
        await apiFetch("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken: refreshToken || localStorage.getItem("hh_refresh_token") }),
        });
        clearTokens();
    },
};

// ── Beds API ────────────────────────────────────────────
export const bedsApi = {
    async getAll() { return (await apiFetch("/beds")).json(); },
    async getStats() { return (await apiFetch("/beds/summary/stats")).json(); },
    async getHospital(id: number) { return (await apiFetch(`/beds/hospital/${id}`)).json(); },
};

// ── Appointments API ─────────────────────────────────────
export const appointmentsApi = {
    async getAll() { return (await apiFetch("/appointments")).json(); },
    async book(data: Record<string, unknown>) {
        return (await apiFetch("/appointments", { method: "POST", body: JSON.stringify(data) })).json();
    },
    async update(id: number, data: Record<string, unknown>) {
        return (await apiFetch(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) })).json();
    },
};

// ── Emergency API ────────────────────────────────────────
export const emergencyApi = {
    async triggerSOS(data: Record<string, unknown>) {
        const res = await fetch(`${API_BASE}/emergency/sos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    async getAlerts(status?: string) {
        return (await apiFetch(`/emergency/alerts${status ? `?status=${status}` : ""}`)).json();
    },
    async getNearby(lat: number, lng: number) {
        return (await apiFetch(`/emergency/nearby?lat=${lat}&lng=${lng}`)).json();
    },
    async updateStatus(id: number, data: Record<string, unknown>) {
        return (await apiFetch(`/emergency/${id}/status`, { method: "PUT", body: JSON.stringify(data) })).json();
    },
};

// ── Health Records API ───────────────────────────────────
export const recordsApi = {
    async getMyProfile() { return (await apiFetch("/records/my/profile")).json(); },
    async getPatient(patientId: number) { return (await apiFetch(`/records/${patientId}`)).json(); },
    async searchPatients(q: string) { return (await apiFetch(`/records/search/patients?q=${encodeURIComponent(q)}`)).json(); },
};

// ── Doctors API ──────────────────────────────────────────
export const doctorsApi = {
    async getAll(params?: { hospital_id?: number; specialization?: string; city?: string; q?: string }) {
        const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
        return (await fetch(`${API_BASE}/doctors${qs}`)).json();
    },
    async getSpecializations() { return (await fetch(`${API_BASE}/doctors/specializations`)).json(); },
    async getById(id: number) { return (await fetch(`${API_BASE}/doctors/${id}`)).json(); },
};

// ── Staff API ────────────────────────────────────────────
export const staffApi = {
    async getPatients() { return (await apiFetch("/staff/patients")).json(); },
    async getTasks() { return (await apiFetch("/staff/tasks")).json(); },
    async updateTask(id: number, data: Record<string, unknown>) {
        return (await apiFetch(`/staff/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) })).json();
    },
    async getOverview() { return (await apiFetch("/staff/overview")).json(); },
};

// ── Admin API ────────────────────────────────────────────
export const adminApi = {
    async getStats() { return (await apiFetch("/admin/stats")).json(); },
    async getUsers() { return (await apiFetch("/admin/users")).json(); },
    async getAuditLogs() { return (await apiFetch("/admin/audit-logs")).json(); },
    async getHospitals() { return (await apiFetch("/admin/hospitals")).json(); },
    async changeUserRole(id: number, role: string) {
        return (await apiFetch(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) })).json();
    },
};
