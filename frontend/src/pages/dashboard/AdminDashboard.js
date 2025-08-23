// src/pages/dashboard/MahasiswaDashboard.js
// import React from 'react';

// const AdminDashboard = () => {
//   return (
//     <div>
//       <h2>Selamat Datang Admin</h2>
//     </div>
//   );
// };

// export default AdminDashboard;


// ===========================================

import React, { useEffect, useState } from "react";
import axios from "axios";

const SERVICES = [
  { name: "User Service", url: `/users/health` },
  { name: "Class Service", url: `/class/health` },
  { name: "Task Service", url: `/tasks/health` },
  { name: "Group Task Service", url: `/groups/health` },
  { name: "Progress Service", url: `/progress/health` },
  { name: "Notification Service", url: `/notifications/health` },
  { name: "Logging Service", url: `/logs/health` },
];

const AdminDashboard = () => {
  const [userCounts, setUserCounts] = useState(null);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    const fetchUserCounts = async () => {
      try {
        const res = await axios.get(`/users/count-by-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setUserCounts(res.data.counts);
        } else {
          setError("Gagal mengambil jumlah user per role.");
        }
      } catch (err) {
        setError("Gagal mengambil jumlah user per role.");
      }
    };

    const fetchHealthStatuses = async () => {
      try {
        const results = await Promise.all(
          SERVICES.map(async (service) => {
            try {
              const res = await axios.get(service.url);
              return { name: service.name, data: res.data, error: null };
            } catch (err) {
              return {
                name: service.name,
                data: null,
                error: err.response?.data?.message || err.message || "Tidak bisa terhubung",
              };
            }
          })
        );
        setHealthStatuses(results);
      } catch (err) {
        setError("Gagal mengambil status kesehatan layanan.");
      }
    };

    fetchUserCounts();
    fetchHealthStatuses();
  }, [token]);

  return (
    <div className="container mt-4">

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* User count per role */}
      <div
        className="card mb-4 shadow-sm border-0 rounded-3"
        style={{ backgroundColor: "#f4f6f8" }}
      >
        <div className="card-body p-3">
          <h5
            className="card-title fw-semibold mb-3"
            style={{ color: "#333", letterSpacing: "0.03em" }}
          >
            Jumlah User per Role
          </h5>
          {userCounts ? (
            <ul className="list-group list-group-flush">
              {Object.entries(userCounts).map(([role, count]) => (
                <li
                  key={role}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.4rem",
                    marginBottom: "0.35rem",
                    padding: "0.5rem 1rem",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: "#444",
                    boxShadow: "0 1px 3px rgb(0 0 0 / 0.05)",
                  }}
                >
                  <span>{role}</span>
                  <span
                    className="badge rounded-pill"
                    style={{
                      backgroundColor: "#6c757d",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      padding: "0.3rem 0.8rem",
                      color: "#f8f9fa",
                    }}
                  >
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-0">Memuat data user...</p>
          )}
        </div>
      </div>

      {/* Health status cards */}
      <h5
        className="mb-3"
        style={{ color: "#2c3e50", fontWeight: "600", letterSpacing: "0.04em" }}
      >
        Status Kesehatan Layanan
      </h5>
      <div className="row g-3">
        {healthStatuses.length === 0 && <p className="text-muted">Memuat status layanan...</p>}

        {healthStatuses.map(({ name, data, error }) => (
          <div className="col-md-4" key={name}>
            <div
              className="card rounded-3 h-100 shadow-sm"
              style={{
                border: "1px solid #d1d9e6",
                backgroundColor: "#ffffff",
                fontSize: "0.9rem",
              }}
            >
              <div
                className="card-header fw-semibold"
                style={{
                  backgroundColor: "#607d8b",
                  color: "#f1f5f8",
                  fontSize: "1.05rem",
                  padding: "0.55rem 1rem",
                  borderRadius: "0.5rem 0.5rem 0 0",
                }}
              >
                {name}
              </div>
              <div
                className="card-body p-3"
                style={{ lineHeight: "1.3", color: "#3a3f51" }}
              >
                {error ? (
                  <p
                    className="text-danger mb-0"
                    style={{ fontWeight: "600", fontSize: "0.9rem" }}
                  >
                    Error: {error}
                  </p>
                ) : (
                  <>
                    <p className="mb-1">
                      <strong>Status:</strong>{" "}
                      <span
                        style={{
                          color: data?.status === "OK" ? "#2e7d32" : "#d32f2f",
                          fontWeight: "600",
                        }}
                      >
                        {data?.status || "Tidak tersedia"}
                      </span>
                    </p>
                    <p className="mb-1">
                      <strong>Database:</strong>{" "}
                      {typeof data?.db === "boolean" ? (
                        data.db ? (
                          <span style={{ color: "#2e7d32", fontWeight: "600" }}>
                            Terhubung
                          </span>
                        ) : (
                          <span style={{ color: "#d32f2f", fontWeight: "600" }}>
                            Terputus
                          </span>
                        )
                      ) : (
                        data?.db || "Tidak tersedia"
                      )}
                    </p>
                    <p className="mb-1">
                      <strong>RabbitMQ:</strong>{" "}
                      {typeof data?.rabbitmq === "boolean" ? (
                        data.rabbitmq ? (
                          <span style={{ color: "#2e7d32", fontWeight: "600" }}>
                            Terhubung
                          </span>
                        ) : (
                          <span style={{ color: "#d32f2f", fontWeight: "600" }}>
                            Terputus
                          </span>
                        )
                      ) : (
                        data?.rabbitmq || "Tidak tersedia"
                      )}
                    </p>
                    <p className="mb-0" style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                      Waktu cek: {data?.time ? new Date(data.time).toLocaleString() : "-"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
