
import { useEffect, useState } from "react";

function App() {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL;

        fetch(`${apiUrl}/status`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("API request failed");
                }
                return response.json();
            })
            .then((data) => setStatus(data))
            .catch(() => setError("Connection failed"));
    }, []);

    return (
        <main style={{ padding: "40px", fontFamily: "Arial" }}>
            <h1>Academic Project</h1>

            <h2>React + Laravel + MySQL + Docker</h2>

            <p>Frontend: React Running </p>

            {status && (
                <>
                    <p>Backend: {status.backend} </p>
                    <p>Database: {status.database} </p>
                </>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
        </main>
    );
}

export default App;
