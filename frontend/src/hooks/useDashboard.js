import { useEffect, useState } from "react";
import { dashboardApi } from "../services/DashboardApi";
import { apiError } from "../services/api";

export function useDashboard(role) {
    const [period, setPeriod] = useState("30d");
    const [revision, setRevision] = useState(0);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        setData(null);

        dashboardApi.overview(role, period, controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) setData(result);
            })
            .catch((err) => {
                if (!controller.signal.aborted) {
                    setError(err?.response ? apiError(err) : err?.message || "Erreur de chargement.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [role, period, revision]);

    return { period, setPeriod, loading, error, data, refresh: () => setRevision((value) => value + 1),};
}