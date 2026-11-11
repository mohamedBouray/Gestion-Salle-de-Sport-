import { createContext, useContext, useEffect, useState } from "react";
import { landingDefaults } from "../data/landingDefaults";
import { publicApi } from "../services/PublicApi";

const Context = createContext(landingDefaults);

export function LandingSettingsProvider({ children }) {
    const [settings, setSettings] = useState(landingDefaults);

    useEffect(() => {
        let active = true;
        publicApi.siteSettings()
            .then((res) => {
                if (active) setSettings({ ...landingDefaults, ...res.settings });
            })
            .catch((err) => console.error("Landing settings:", err));
        return () => { active = false; };
    }, []);

    return <Context.Provider value={settings}>{children}</Context.Provider>;
}

export const useLandingSettings = () => useContext(Context);