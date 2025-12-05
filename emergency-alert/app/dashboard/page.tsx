"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setAlerts(data || []);
    };

    fetchAlerts();

    const channel = supabase
      .channel("alerts-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          setAlerts((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🚨 Emergency Alerts Dashboard</h1>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>{alert.id}</td>
              <td>{alert.latitude}</td>
              <td>{alert.longitude}</td>
              <td>{alert.status}</td>
              <td>{new Date(alert.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}