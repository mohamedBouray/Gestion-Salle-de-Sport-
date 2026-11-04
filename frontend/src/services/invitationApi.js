import api, { getCsrfCookie } from "./api";

export const invitationApi = {
    async accept(payload) {
        await getCsrfCookie();
        const response = await api.post("/api/accept-invitation", payload);
        return response.data;
    },
};
