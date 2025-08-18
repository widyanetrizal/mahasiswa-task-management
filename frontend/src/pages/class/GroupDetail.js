import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

export default function ClassGroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchGroup = async () => {
      try {
        const res = await axios.get(
          `http://localhost:80/groups/${groupId}/details`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setGroup(res.data.group);
        setTasks(res.data.tasks);
        setMembers(res.data.members);
      } catch (err) {
        console.error("❌ Gagal ambil data grup:", err);
      }
    };

    const fetchUser = () => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUser(decoded);
      } catch (err) {
        console.error("❌ Gagal decode JWT:", err);
      }
    };

    fetchUser();
    fetchGroup();
  }, [groupId]);

  
  if (!group) return <div className="text-center mt-5">Loading...</div>;

  const isCreator = user.id === group.createdBy.id;

  const deleteTask = async (taskId) => {
    const token = localStorage.getItem("token");
    if (window.confirm("Yakin hapus tugas ini?")) {
      await axios.delete(`http://localhost:80/groups/${taskId}/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((t) => t.id !== taskId));
    }
  };

  const handleDeleteGroup = async () => {
    const token = localStorage.getItem("token");
    if (window.confirm("Yakin ingin hapus grup ini?")) {
      await axios.delete(`http://localhost:80/groups/${groupId}/group`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/dashboard/mahasiswa/task-kelompok");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Nama Group: {group.name}</h2>
      <p><strong>Pembuat:</strong> {group.createdBy.name}</p>
      {group.isMonitoredByDosen && (
        <p><strong>Nama Dosen:</strong> {group.dosenName || "-"}</p>
      )}

      <hr />

      <h4 className="mb-3">Anggota Grup</h4>
      <div className="row">
        {members.map((m) => (
          <div key={m.id} className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{m.name}</h6>
                  <small className="text-muted">{m.role}</small>
                </div>
                <i className="bi bi-person-circle fs-3 text-primary"></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreator && (
        <div className="my-3">
          <Link
            to={`/dashboard/mahasiswa/task-kelompok/groups/${groupId}/members/add`}
            className="btn btn-outline-primary me-2 btn-sm"
          >
            Tambah Anggota
          </Link>
          <Link
            to={`/dashboard/mahasiswa/task-kelompok/groups/${groupId}/tasks/create`}
            className="btn btn-outline-success btn-sm"
          >
            Tambah Tugas
          </Link>
          <button
            className="btn btn-sm btn-danger float-end"
            onClick={handleDeleteGroup}
          >
            Hapus Grup
          </button>
        </div>
      )}

      <hr />
      <h4 className="mt-4">Tugas Grup</h4>
      {tasks.length === 0 ? (
        <p className="text-muted">Belum ada tugas dalam grup ini.</p>
      ) : (
        <div className="table-responsive shadow-sm">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-light text-center">
              <tr>
                <th>No</th>
                <th>Judul</th>
                <th>Deskripsi</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[...tasks]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((task, index) => (
                  <tr key={task.id}>
                    <td className="text-center">{index + 1}</td>
                    <td>{task.judul}</td>
                    <td>{task.description}</td>
                    <td className="text-center">
                      {dayjs(task.deadline).format("dddd, DD MMMM YYYY [pukul] HH:mm")} WIB
                    </td>
                    <td className="text-center">
                      <span className={`badge bg-${
                        task.status === "Done"
                          ? "success"
                          : task.status === "In-Progress"
                          ? "warning"
                          : "secondary"
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <Link
                        to={`/dashboard/mahasiswa/task-kelompok/groups/${groupId}/tasks/${task.id}/edit`}
                        className="btn btn-info text-white" 
                      >
                        Info
                      </Link>
                      <Link
                        to={`/dashboard/mahasiswa/task-kelompok/groups/${groupId}/tasks/${task.id}/edit/status`}
                        className="btn btn-warning"
                      >
                        Edit
                      </Link>
                      {isCreator && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="btn btn-outline-danger"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 d-flex justify-content-end">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Kembali
        </button>
      </div>
    </div>
  );
}

