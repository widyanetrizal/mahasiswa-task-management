import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";
import { FaPlus, FaArrowLeft, FaRegFile } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const TaskInfo = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [progressList, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTaskAndProgress = async () => {
      try {
        const taskRes = await axios.get(`/tasks/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTask(taskRes.data);

        const progressRes = await axios.get(
          `/progress/task/individual/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const sortedProgress = progressRes.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProgress(sortedProgress || []);
      } catch (error) {
        console.error("❌ Gagal mengambil data tugas:", error);
        alert("Gagal memuat data tugas.");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndProgress();
  }, [id, user.token]);

  if (loading) {
    return <div className="text-center mt-5">🔄 Memuat data tugas...</div>;
  }

  if (!task) {
    return (
      <div className="text-center text-danger mt-5">Tugas tidak ditemukan.</div>
    );
  }

  return (
    <div className="container my-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white text-center">
          <h4 className="mb-0">📘 Detail Tugas Individu</h4>
        </div>

        <div className="card-body">
          <table className="table table-bordered">
            <tbody>
              <tr>
                <th>Mata Kuliah</th>
                <td>{task.mataKuliah}</td>
              </tr>
              <tr>
                <th style={{ width: "30%" }}>Judul</th>
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
                  <span
                    className={`badge bg-${
                      task.status === "Done"
                        ? "success"
                        : task.status === "In-Progress"
                        ? "warning"
                        : "secondary"
                    }`}
                  >
                    {task.status || "-"}
                  </span>
                </td>
              </tr>
              <tr>
                <th>🧭 Deadline Status</th>
                <td>
                  <span
                    className={`badge ${
                      task.deadlineStatus?.includes("Terlambat")
                        ? "bg-danger"
                        : task.deadlineStatus === "Hari ini"
                        ? "bg-warning text-dark"
                        : task.deadlineStatus === "Selesai"
                        ? "bg-success"
                        : "bg-primary"
                    }`}
                  >
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
                  ? `/dashboard/mahasiswa/task-individu/${task.id}/edit`
                  : `/dashboard/mahasiswa/task-individu/${task.id}/edit`
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
  //             onClick={() => {
  //   if (user.role === "Dosen") {
  //     navigate("/dashboard/dosen/task-individu");
  //   } else {
  //     navigate("/dashboard/mahasiswa/task-individu");
    
  // }}}
            >
              <FaArrowLeft className="me-2" />
              Kembali
            </button>
          </div>

          <h5 className="mb-3">📈 Riwayat Progres Mahasiswa</h5>

          {progressList.length === 0 ? (
            <p className="text-muted">Belum ada progress yang ditambahkan.</p>
          ) : (
            <ul className="list-group">
              {progressList.map((p, index) => (
                <li key={p.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div>
                      <strong>#{index + 1}</strong>{" "}
                      <span className="badge bg-info me-2">
                        {p.status || "-"}
                      </span>
                      <strong>
                        {p.progress !== null ? `${p.progress}%` : "-"}
                      </strong>
                    </div>
                    <small className="text-muted">
                      {dayjs(p.createdAt).format(
                        "dddd, DD MMMM YYYY [pukul] HH:mm"
                      )}{" "}
                      WIB
                    </small>
                  </div>

                  {p.document?.trim() && (
                    <p className="mb-1">
                      <strong>🔗 Dokumen:</strong>{" "}
                      <a
                        href={p.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka dokumen"
                        style={{ fontSize: "1.2rem", color: "red" }}
                      >
                        {/* {p.document} */}
                        <FaRegFile />
                      </a>
                    </p>
                  )}

                  {p.description?.trim() && (
                    <p className="mb-1">
                      <strong>📝 Deskripsi:</strong> {p.description}
                    </p>
                  )}

                  {p.dosenComment?.trim() && (
                    <p className="mb-1">
                      💬 <strong>Komentar Dosen:</strong> {p.dosenComment}
                    </p>
                  )}

                  {p.grade !== null && p.grade !== "" && (
                    <p className="mb-0">
                      🏆 <strong>Nilai:</strong> {p.grade}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskInfo;
