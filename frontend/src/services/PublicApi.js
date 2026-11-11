import api from "./api";

export const publicApi = {
    siteSettings: () => api.get("/api/site-settings").then((res) => res.data),
};