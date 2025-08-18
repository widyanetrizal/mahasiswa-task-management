import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const MahasiswaDashboard = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();

  const [classCount, setClassCount] = useState(null);
  const [taskCountConnected, setTaskCountConnected] = useState(0);
  const [taskCountNotConnected, setTaskCountNotConnected] = useState(0);

  const [groups, setGroups] = useState([]);
  const [loadingClassCount, setLoadingClassCount] = useState(true);
  const [loadingTaskCount, setLoadingTaskCount] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchClassCount = async () => {
      setLoadingClassCount(true);
      setError(null);
      try {
        const res = await axios.get("http://localhost:80/class/count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setClassCount(res.data.count);
        else setError("Gagal mengambil jumlah kelas.");
      } catch {
        setError("Gagal mengambil jumlah kelas.");
      } finally {
        setLoadingClassCount(false);
      }
    };

    const fetchTaskCounts = async () => {
      setLoadingTaskCount(true);
      try {
        const [connectedRes, notConnectedRes] = await Promise.all([
          axios.get("http://localhost:80/tasks/count/connected", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:80/tasks/count/not-connected", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (connectedRes.data.success) {
          setTaskCountConnected(connectedRes.data.count);
        }
        if (notConnectedRes.data.success) {
          setTaskCountNotConnected(notConnectedRes.data.count);
        }
      } catch {
        setError("Gagal mengambil jumlah tugas.");
      } finally {
        setLoadingTaskCount(false);
      }
    };

    const fetchGroups = async () => {
      setLoadingGroups(true);
      setError(null);
      try {
        const res = await axios.get("http://localhost:80/groups/my-groups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setGroups(res.data.groups);
        else setError("Gagal mengambil grup.");
      } catch {
        setError("Gagal mengambil grup.");
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchClassCount();
    fetchTaskCounts();
    fetchGroups();
  }, [token]);

  const goToClasses = () => navigate("/dashboard/mahasiswa/class");

  const goToConnectedTasks = () => {
    navigate("/dashboard/mahasiswa/class/");
  };

  const goToNotConnectedTasks = () => {
    navigate("/dashboard/mahasiswa/task-individu");
  };

  const goToGroupDetail = (groupId) => {
    navigate(`/dashboard/mahasiswa/task-kelompok/groups/${groupId}/info`);
  };

  return (
    <div className="container mt-4">
      <blockquote className="fst-italic text-secondary mb-4">
        “Jangan tunda pekerjaan hari ini, karena deadline tidak pernah
        menunggu.”
      </blockquote>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Card Jumlah Kelas */}
      <div
        className="card mb-4 shadow-sm border-0 rounded-4"
        style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
        onClick={goToClasses}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && goToClasses()}
      >
        <div className="card-body text-center">
          <h5 className="card-title fw-bold mb-2">Jumlah Kelas Mata Kuliah</h5>
          {loadingClassCount ? (
            <p className="text-muted">Memuat jumlah kelas...</p>
          ) : (
            <p className="display-5 fw-bold mb-0">{classCount ?? 0}</p>
          )}
        </div>
      </div>

      {/* Card Tugas Terhubung & Tidak Terhubung */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div
            className="card shadow-sm border-0 rounded-4 text-center"
            style={{ backgroundColor: "#e8f5e9", cursor: "pointer" }}
            onClick={goToConnectedTasks}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && goToConnectedTasks()}
          >
            <div className="card-body">
              <h6 className="card-title fw-bold mb-2">
                Tugas Individu <br />
                Terhubung ke Kelas
              </h6>
              {loadingTaskCount ? (
                <p className="text-muted">Memuat...</p>
              ) : (
                <p className="display-6 fw-bold mb-0">
                  {taskCountConnected ?? 0}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div
            className="card shadow-sm border-0 rounded-4 text-center"
            style={{ backgroundColor: "#fff3e0", cursor: "pointer" }}
            onClick={goToNotConnectedTasks}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && goToNotConnectedTasks()}
          >
            <div className="card-body">
              <h6 className="card-title fw-bold mb-2">
                Tugas Individu <br /> Tidak Terhubung ke Kelas
              </h6>
              {loadingTaskCount ? (
                <p className="text-muted">Memuat...</p>
              ) : (
                <p className="display-6 fw-bold mb-0">
                  {taskCountNotConnected ?? 0}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Grup Saya */}
      <div
        className="card mb-4 shadow-sm border-0 rounded-4"
        style={{ backgroundColor: "#fff" }}
      >
        <div className="card-body">
          <h5 className="card-title fw-bold mb-3">Tugas Kelompok (GROUP)</h5>
          {loadingGroups ? (
            <p className="text-muted">Memuat grup...</p>
          ) : groups.length > 0 ? (
            <ul className="list-group list-group-flush">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "#f9f9f9",
                    borderRadius: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                  onClick={() => goToGroupDetail(group.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && goToGroupDetail(group.id)
                  }
                >
                  <span className="fw-semibold">{group.name}</span>
                  {group.classId && (
                    <span className="badge bg-secondary px-3 py-2 rounded-pill">
                      Terhubung ke kelas
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Anda belum tergabung di grup manapun.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MahasiswaDashboard;
