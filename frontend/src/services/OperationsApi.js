import api, { getCsrfCookie } from "./api";
const data = (response) => response.data;
const get = (url, params) => api.get(url, { params }).then(data);
const write = async (method, url, payload = {}) => {
    await getCsrfCookie();
    return api({ method, url, data: payload }).then(data);
};

export const operationsApi = {
    dashboard: (role) => get(`/api/${role}/dashboard`),
    admin: {
        payments: (params) => get("/api/admin/payments", params),
        messages: (params) => get("/api/admin/messages", params),
        markMessage: (id, status) => write("patch", `/api/admin/messages/${id}`, { status }),
        requests: () => get("/api/admin/personal-requests"),
        respond: (id, status) => write("patch", `/api/admin/personal-requests/${id}`, { status }),
        privateSessions: () => get("/api/admin/private-sessions"),
        createPrivate: (payload) => write("post", "/api/admin/private-sessions", payload),
        changePrivate: (id, status) => write("patch", `/api/admin/private-sessions/${id}`, { status }),
    },
    coach: {
        members: () => get("/api/coach/members"),
        requests: () => get("/api/coach/personal-requests"),
        respond: (id, status) => write("patch", `/api/coach/personal-requests/${id}`, { status }),
        privateSessions: () => get("/api/coach/private-sessions"),
    },
    member: {
        payments: () => get("/api/member/payments"),
        attendance: () => get("/api/member/attendance"),
        coaches: () => get("/api/member/available-coaches"),
        requests: () => get("/api/member/personal-requests"),
        propose: (payload) => write("post", "/api/member/personal-requests", payload),
        cancel: (id) => write("patch", `/api/member/personal-requests/${id}/cancel`),
        privateSessions: () => get("/api/member/private-sessions"),
    },
};
