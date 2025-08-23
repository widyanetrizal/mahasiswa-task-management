import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "react-bootstrap";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import "../../css/UserList.css";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const TaskIndividu = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);

  // Fetch hanya tugas yang tidak punya classId
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`/tasks/no-class`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setTasks(res.data);
      // setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("❌ Gagal mengambil tugas:", err);
    }
  }, [user.token]);

  useEffect(() => {
    if (user?.token) fetchTasks();
  }, [user?.token, fetchTasks]);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus tugas ini?")) return;
    try {
      await axios.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchTasks();
    } catch (err) {
      alert(
        "Gagal menghapus tugas: " + (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Daftar Tugas Individu</h2>

        {user.role === "Dosen" && (
          <Link
            to={`/dashboard/dosen/task-individu/create`}
            className="btn btn-primary"
          >
            + Tambah Tugas
          </Link>
        )}
      </div>

      <div className="table-responsive-sm">
        <table
          className="table table-bordered table-striped align-middle"
        >
          <thead className="table-light text-center table align-middle">
            {/* <Table striped bordered hover>
          <thead className="table-light text-center table align-middle"> */}
            <tr>
              <th>No</th>
              {user.role === "Dosen" && <th>Nama Mahasiswa</th>}
              {user.role === "Mahasiswa" && <th>Nama Dosen</th>}
              <th>Mata Kuliah</th>
              <th>Judul Tugas</th>
              <th>Deadline</th>
              <th>Status</th>
              <th> Deadline Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center py-3 text-muted">
                  Belum ada tugas
                </td>
              </tr>
            )}
            {tasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <tr key={task.id}>
                  <td className="text-center">{index + 1}</td>
                  {user.role === "Dosen" && (
                    <td>{task.mahasiswaName || "-"}</td>
                  )}
                  {user.role === "Mahasiswa" && (
                    <td>{task.dosenName || "-"}</td>
                  )}
                  <td>{task.mataKuliah}</td>
                  <td>{task.judul}</td>
                  <td className="text-center">
                    {dayjs(task.deadline).format(
                      "dddd, DD MMMM YYYY [pukul] HH:mm"
                    )}{" "}
                    WIB
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge bg-${
                        task.status === "Done"
                          ? "success"
                          : task.status === "In-Progress"
                          ? "warning"
                          : "secondary"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="text-center">
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
                      {task.deadlineStatus}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm" role="group">
                      <Link
                        to={
                          user.role === "Dosen"
                            ? `/dashboard/dosen/task-individu/${task.id}/info`
                            : `/dashboard/mahasiswa/task-individu/${task.id}/info`
                        }
                        className="btn btn-outline-info"
                      >
                          <FaEye title="Lihat Tugas"/>
                      </Link>
                      {user.role === "Dosen" && (
                        <Link
                          to={`/dashboard/dosen/task-individu/${task.id}/edit/info`}
                          className="btn btn-outline-warning"
                        >
                          <FaEdit title="Edit Tugas"/>
                        </Link>
                      )}
                      {user.role === "Dosen" && (
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDelete(task.id)}
                        >
                          <FaTrash title="Hapus Tugas"/>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskIndividu;
