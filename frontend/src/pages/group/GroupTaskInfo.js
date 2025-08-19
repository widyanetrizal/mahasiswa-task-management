import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";
import { FaPlus, FaArrowLeft, FaRegFile } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const GroupTaskInfo = () => {
  const { taskId, groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskAndProgress = async () => {
      try {
        // Ambil detail tugas dari group-task-service
        const taskRes = await axios.get(
          `
          ${process.env.REACT_APP_API_URL}/groups/${groupId}/tasks/${taskId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // Ambil semua progress dari progress-service
        const progressRes = await axios.get(
          `
          ${process.env.REACT_APP_API_URL}/progress/task/group/${taskId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        // const progressData = progressRes.data.data || [];

        // Urutkan berdasarkan tanggal terbaru
        const sortedProgress = progressRes.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setTask(taskRes.data.data);
        setProgressList(sortedProgress || []);
        setLoading(false);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        alert("Gagal memuat detail tugas.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndProgress();
  }, [taskId, groupId, user.token, navigate]);

  if (loading) return <div className="text-center mt-5">Memuat...</div>;

  if (!task) {
    return (
      <div className="text-center text-danger mt-5">Tugas tidak ditemukan.</div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white text-center">
          <h3>📘 Detail Tugas Kelompok</h3>
        </div>
        <div className="card-body">
          <table className="table table-bordered">
            <tbody>
              {/* <tr>
                <th>Mata Kuliah</th>
                <td>{task.mataKuliah}</td>
              </tr> */}
              <tr>
                <th style={{ width: "30%" }}>Judul Tugas</th>
                <td>{task.judul}</td>
              </tr>
              <tr>
                <th>Deskripsi</th>
                <td>{task.description || "-"}</td>
              </tr>
              <tr>
                <th>⏰ Deadline</th>
                <td>
                  {dayjs(task.deadline).format(
                    "dddd, DD MMMM YYYY [pukul] HH:mm"
                  )}{" "}
                  WIB
                </td>
              </tr>
              <tr>
                <th>📌 Status</th>
                <td>
                  <span className={`badge bg-${
                      task.status === "Done"
                        ? "success"
                        : task.status === "In-Progress"
                        ? "warning"
                        : task.status === "Terlambat"
                        ? "danger"
                        : "secondary"
                    }`}>
                    {task.status || "-"}
                  </span>
                </td>
              </tr>
              <tr>
                <th>🧭 Deadline Status</th>
                <td>
                  <span className={`badge ${
                      task.deadlineStatus?.includes("Terlambat")
                        ? "bg-danger"
                        : task.deadlineStatus === "Hari ini"
                        ? "bg-warning text-dark"
                        : task.deadlineStatus === "Selesai"
                        ? "bg-success"
                        : "bg-primary"
                    }`}>
                    {task.deadlineStatus || "-"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <hr />

          <div className="d-flex justify-content-between mb-4">
            <Link
              to={
                user.role === "Dosen"
                ? `/dashboard/dosen/task-kelompok/groups/${groupId}/tasks/${taskId}/edit/status`
                : `/dashboard/mahasiswa/task-kelompok/groups/${groupId}/tasks/${taskId}/edit/status`
              }
              className="btn btn-outline-primary"
            >
              <FaPlus className="me-2" />
              {user.role === "Dosen"
              ? "Tambah Komentar atau Nilai"
              : "Tambah Progres"}
            </Link>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-2" />
              Kembali
            </button>
          </div>

          <h4 className="mb-3">📈 Riwayat Progress Anggota Group</h4>
          {progressList.length === 0 ? (
            <p className="text-muted">Belum ada progress yang ditambahkan.</p>
          ) : (
            <ul className="list-group mb-3">
              {progressList.map((p, index) => (
                <li key={p.id} className="list-group-item">
                  <strong>#{index + 1}</strong> —{" "}
                  <span className="badge bg-info me-2">{p.status || "-"}</span>
                  <strong>
                    {p.progress !== null ? `${p.progress}%` : "-"}
                  </strong>
                  <br />
                  {p.userName?.trim() && (
                    <p className="mb-1">
                      <strong>Nama Mahasiswa: </strong> {p.userName}
                    </p>
                  )}
                  {p.dosenName?.trim() && (
                    <p className="mb-1">
                      <strong>Nama Dosen: </strong> {p.dosenName}
                    </p>
                  )}
                  {p.document?.trim() && (
                    <p className="mb-1 text-muted">
                      <strong>🔗 Dokumen: </strong>{" "}
                      <a
                        href={p.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka dokumen"
                        style={{ fontSize: "1.2rem", color: "red" }}
                      >
                        <FaRegFile />
                      </a>
                    </p>
                  )}
                  {p.description?.trim() && (
                    <p className="mb-1 text-muted">
                      <strong>📝 Deskripsi: </strong> {p.description}
                    </p>
                  )}
                  {p.dosenComment?.trim() && (
                    <div className="mb-1 text-muted">
                      💬 <strong>Komentar:</strong> {p.dosenComment}
                    </div>
                  )}
                  {p.grade !== null && p.grade !== "" && (
                    <div className="mb-1 text-muted">
                      🏆 <strong>Nilai:</strong> {p.grade}
                    </div>
                  )}
                  <div className="text-end text-secondary small">
                    {dayjs(p.createdAt).format(
                      "dddd, DD MMMM YYYY [pukul] HH:mm"
                    )}{" "}
                    WIB
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupTaskInfo;
