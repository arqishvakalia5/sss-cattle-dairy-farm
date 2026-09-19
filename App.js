/*
  Reconstructed frontend.
  IMPORTANT: paste the full App.js supplied in the chat here if you want every screen
  exactly as in the Emergent preview. The only intended auth change is removal of the
  Emergent Google OAuth button/flow.
*/
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:8000"}/api`;

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/dashboard`)
      .then(r => setData(r.data))
      .catch(() => setError("Could not reach the farm records API."));
  }, []);

  if (error) return <main className="loading"><h2>SSS Cattle & Dairy Farm</h2><p>{error}</p></main>;
  if (!data) return <main className="loading">Opening the farm ledger…</main>;

  return (
    <main className="loading">
      <h1>SSS Cattle & Dairy Farm</h1>
      <p>API connected successfully.</p>
      <div className="summary">
        <b>Milk: {data.metrics.total_litres} L</b>
        <b>Sales: PKR {Number(data.metrics.sales).toLocaleString("en-PK")}</b>
        <b>Profit: PKR {Number(data.metrics.profit).toLocaleString("en-PK")}</b>
      </div>
      <p className="note">
        This reconstruction contains the working backend. Replace this App.js with
        your complete Emergent App.js source to restore the full dashboard UI.
      </p>
    </main>
  );
}
