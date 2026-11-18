import api, { getCsrfCookie } from "./api";

export const publicApi = {

    // Site Settings
    siteSettings: () =>
        api.get("/api/site-settings").then((res) => res.data),

    // Contact Form
    sendContact: async (form) => {
        await getCsrfCookie();

        const response = await api.post("/api/contact", {
            name: form.name,
            email: form.email,
            subject: form.subject,
            message: form.message,
            website: form.website || "",
        });

        return response.data;
    },

};
