import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import { Button, Modal, Form } from "react-bootstrap";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

export default function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
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
        setTasks(res.data.tasksWithStatus);
        setMembers(res.data.members);
        setNewGroupName(res.data.group.name); // isi default form edit
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

  const handleUpdateGroupName = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(
        `http://localhost:80/groups/${groupId}`,
        { name: newGroupName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGroup(res.data.group); // update data group di state
      setShowEditModal(false);
    } catch (err) {
      console.error("❌ Gagal update nama grup:", err.response?.data || err);
      alert(err.response?.data?.error || "Gagal update nama grup");
    }
  };

  return (
    <div className="container mt-4">
      {/* Card Info Group */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">Nama Group: {group.name}</h5>
            <p className="mb-0">
              <strong>Nama Dosen:</strong> {group.createdBy.name}
            </p>
          </div>
          {user.role === "Dosen" && isCreator && (
            <Button
              variant="outline-warning"
              onClick={() => setShowEditModal(true)}
            >
              <FaEdit className="me-1" /> Edit Group
            </Button>
          )}
        </div>
      </div>

      {/* Modal Edit Group */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Nama Grup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Nama Grup</Form.Label>
              <Form.Control
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleUpdateGroupName}>
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Anggota Group */}
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

      {/* Tugas Group */}
      <hr />
      <h4 className="mt-4">Tugas Grup</h4>
      {tasks.length === 0 ? (
        <p className="text-muted">Belum ada tugas dalam grup ini.</p>
      ) : (
        <div className="table-responsive shadow-sm">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-light text-center table align-middle">
              <tr>
                <th>No</th>
                <th>Judul</th>
                <th>Deskripsi</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Deadline Status</th>
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
                      <div className="btn-group btn-group-sm">
                        <Link
                          to={
                          user.role === "Dosen"
                          ? `/dashboard/dosen/task-kelompok/groups/${groupId}/tasks/${task.id}/edit`
                          : `/dashboard/mahasiswa/task-kelompok/groups/${groupId}/tasks/${task.id}/edit`
                        }
                          className="btn btn-outline-info"
                        >
                          <FaEye title="Lihat Tugas" />
                        </Link>
                        {isCreator && (
                          <>
                          
                        <Link
                          to={`/dashboard/dosen/task-kelompok/groups/${groupId}/tasks/${task.id}`}
                          className="btn btn-outline-warning"
                        >
                          <FaEdit title="Edit Tugas"/>
                        </Link>
                          <Button
                            variant="outline-danger"
                            onClick={() => deleteTask(task.id)}
                          >
                            <FaTrash title="Hapus Tugas"/>
                          </Button>
                        </>
                        )}
                      </div>
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