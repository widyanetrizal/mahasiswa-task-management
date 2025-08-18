import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Spinner, Alert, Tabs, Tab, Card, Badge, Button, Table, Form } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FaInfoCircle, FaTrash, FaEdit, FaUsers, FaEye } from "react-icons/fa";
import ClassMembers from "./ClassMembers";

import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const ClassInfo = () => {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [role, setRole] = useState("");
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateName, setUpdateName] = useState("");
  const [updateMataKuliah, setUpdateMataKuliah] = useState("");

  const toggleMemberModal = () => setShowMemberModal(!showMemberModal);
  const toggleUpdateModal = () => {
    if (!showUpdateModal) {
      setUpdateName(classInfo?.name || "");
      setUpdateMataKuliah(classInfo?.mataKuliah || "");
    }
    setShowUpdateModal(!showUpdateModal);
  };

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const token = localStorage.getItem("token");
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);

        const [classRes, taskRes, groupRes] = await Promise.all([
          axios.get(`http://localhost:80/class/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:80/tasks/class/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:80/groups/class/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setClassInfo(classRes.data.class);
        setTasks(taskRes.data.tasksWithStatus || []);
        setGroups(groupRes.data.groups || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data kelas.");
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:80/class/${classId}`,
        { name: updateName, mataKuliah: updateMataKuliah },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClassInfo(res.data.data); // update data di UI
      setShowUpdateModal(false);
      alert("Kelas berhasil diperbarui.");
    } catch (err) {
      console.error("Gagal update kelas:", err.message);
      alert("Terjadi kesalahan saat memperbarui kelas.");
    }
  };

  const handleDeleteClass = async () => {
    if (!window.confirm("Yakin ingin menghapus kelas ini?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:80/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Kelas berhasil dihapus.");
      navigate("/dashboard/dosen/class");
    } catch (err) {
      console.error("Gagal menghapus kelas:", err.message);
      alert("Terjadi kesalahan saat menghapus kelas.");
    }
  };

  const handleDeleteTask = async (taskId, judul) => {
    if (!window.confirm(`Yakin ingin menghapus tugas "${judul}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:80/tasks/master/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      alert("Gagal menghapus tugas.");
    }
  };

  if (loading)
    return <Spinner animation="border" variant="primary" className="mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container mt-4">
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title className="mb-1">{classInfo.name}</Card.Title>
          <Card.Subtitle className="text-muted">
            Mata Kuliah: {classInfo.mataKuliah}
          </Card.Subtitle>

          <div className="d-flex justify-content-between align-items-center mt-3 gap-2">
            <Button variant="outline-success" onClick={toggleMemberModal}>
              👥 Lihat Anggota Kelas
            </Button>
            {role === "Dosen" && (
              <>
                <Button variant="outline-primary" onClick={toggleUpdateModal}>
                  <FaEdit className="me-1" /> Edit Kelas
                </Button>
              <Button variant="outline-danger" onClick={handleDeleteClass}>
                <FaTrash className="me-1" /> Hapus Kelas
              </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Modal Update Kelas */}
      <Modal show={showUpdateModal} onHide={toggleUpdateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Informasi Kelas</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateClass}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama Kelas</Form.Label>
              <Form.Control
                type="text"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Mata Kuliah</Form.Label>
              <Form.Control
                type="text"
                value={updateMataKuliah}
                onChange={(e) => setUpdateMataKuliah(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={toggleUpdateModal}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Perubahan
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Anggota Kelas (Embed langsung ClassMembers) */}
      <Modal
        show={showMemberModal}
        onHide={toggleMemberModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Anggota Kelas</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <ClassMembers embedded classId={classId} role={role} />
        </Modal.Body>
      </Modal>

      {/* Tab Navigasi */}
      <Tabs defaultActiveKey="tugas" id="class-tabs" className="mb-3">
        {/* Tugas Individu */}
        <Tab eventKey="tugas" title="Tugas Individu">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Daftar Tugas</h5>
            {role === "Dosen" && (
              <Link
                to={`/dashboard/dosen/class/${classId}/tasks`}
                className="btn btn-primary"
              >
                + Tambah Tugas Individu
              </Link>
            )}
          </div>

          {tasks.length === 0 ? (
            <p className="text-muted">Belum ada tugas individu.</p>
          ) : (
            <div className="table-responsive-sm">
              <Table striped bordered hover>
                <thead className="table-light text-center table align-middle">
                  <tr>
                    <th>No</th>
                    <th>Judul Tugas</th>
                    <th>Deskripsi Tugas</th>
                    <th>Deadline</th>
                    {role === "Mahasiswa" && (
                      <>
                        <th>Status</th>
                        <th>Deadline Status</th>
                      </>
                    )}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => (
                    <React.Fragment key={task.id}>
                      <tr key={task.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td>{task.judul}</td>
                        <td>{task.description}</td>
                        <td className="text-center">
                          {dayjs(task.deadline).format(
                            "dddd, DD MMMM YYYY [pukul] HH:mm"
                          )}{" "}
                          WIB
                        </td>
                        {role === "Mahasiswa" && (
                          <>
                            <td className="text-center">
                              <Badge
                                bg={
                                  task.status === "Done"
                                    ? "success"
                                    : task.status === "Terlambat"
                                    ? "danger"
                                    : "warning"
                                }
                              >
                                {task.status}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge
                                bg={
                                  task.deadlineStatus === "Selesai"
                                    ? "success"
                                    : task.deadlineStatus === "Hari ini"
                                    ? "warning"
                                    : "secondary"
                                }
                              >
                                {task.deadlineStatus}
                              </Badge>
                            </td>
                          </>
                        )}
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            {role === "Mahasiswa" && (
                              <Link
                                to={`/dashboard/mahasiswa/task-individu/${task.id}/info`}
                                className="btn btn-outline-info"
                              >
                                <FaEye title="Lihat Tugas"/>
                              </Link>
                            )}
                            {/* :taskId/info  */}
                            {role === "Dosen" && (
                              <Button
                                variant="outline-info"
                                onClick={() =>
                                  setExpandedTaskId(
                                    expandedTaskId === task.id ? null : task.id
                                  )
                                }
                              >
                                <FaEye title="Lihat Tugas"/>
                              </Button>
                            )}
                            {role === "Dosen" && (
                              <Link
                                to={`/dashboard/dosen/class/master/${task.id}`}
                                className="btn btn-outline-warning"
                              >
                                
                                <FaEdit title="Edit Tugas"/>
                              </Link>
                            )}
                            {role === "Dosen" && (
                              <Button
                                variant="outline-danger"
                                onClick={() =>
                                  handleDeleteTask(task.id, task.judul)
                                }
                              >
                                <FaTrash title="Hapus Tugas"/>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {role === "Dosen" && expandedTaskId === task.id && (
                        <tr>
                          <td colSpan={role === "Mahasiswa" ? 7 : 5}>
                            <div className="p-3 bg-light rounded">
                              <AssignedTasksByMasterWrapper
                                masterTaskId={task.id}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Tab>

        {/* Grup Kelas */}
        <Tab eventKey="group" title="Grup Kelas">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Daftar Grup</h5>
            {role === "Dosen" && (
              <Link
                to={`/dashboard/dosen/class/${classId}/groups`}
                className="btn btn-success"
              >
                + Tambah Grup
              </Link>
            )}
          </div>
          <div className="row">
            {groups.length === 0 ? (
              <p className="text-muted">Belum ada grup.</p>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="col-md-4 mb-3">
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <Card.Title>{group.name}</Card.Title>
                      <Link
                        to={
                          role === "Dosen"
                            ? `/dashboard/dosen/task-kelompok/groups/${group.id}/info`
                            : `/dashboard/mahasiswa/task-kelompok/groups/${group.id}/info`
                        }
                        className="btn btn-outline-primary btn-sm"
                      >
                        <FaUsers className="me-1" /> Lihat Detail
                      </Link>
                    </Card.Body>
                  </Card>
                </div>
              ))
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Footer Kembali */}
      <div className="mt-4 text-end">
        <Button variant="secondary" 
        // onClick={() => navigate(-1)}
                      onClick={() => {
    if (role === "Dosen") {
      navigate("/dashboard/dosen/class");
    } else {
      navigate("/dashboard/mahasiswa/class");
    
  }}}
        >
          Kembali
        </Button>
      </div>
    </div>
  );
};

const AssignedTasksByMasterWrapper = ({ masterTaskId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:8081/tasks/master/${masterTaskId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTasks(res.data.tasksWithStatus);
      } catch (err) {
        setErrorMsg(
          err.response?.data?.message ||
            "Gagal mengambil tugas berdasarkan masterTaskId"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [masterTaskId]);

  if (loading)
    return (
      <div className="text-center">
        <Spinner animation="border" />
      </div>
    );
  if (errorMsg)
    return (
      <Alert variant="danger" className="mb-0">
        {errorMsg}
      </Alert>
    );
  if (tasks.length === 0)
    return (
      <Alert variant="info" className="mb-0">
        Belum ada tugas yang ditugaskan.
      </Alert>
    );

  return (
    <div>
      <h6 className="mb-2 fw-bold">Mahasiswa yang Ditugaskan</h6>
      <Table striped bordered hover size="sm">
        <thead className="text-center">
          <tr>
            <th>No</th>
            <th>Mahasiswa</th>
            <th>Status</th>
            <th>Deadline Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <tr key={t.id}>
              <td className="text-center">{i + 1}</td>
              <td>{t.mahasiswaName}</td>
              <td className="text-center">
                <span
                  className={`badge bg-${
                    t.status === "Done"
                      ? "success"
                      : t.status === "In-Progress"
                      ? "warning"
                      : t.status === "Terlambat"
                      ? "danger"
                      : "secondary"
                  }`}
                >
                  {t.status}
                </span>
              </td>
              <td className="text-center">
                <span
                  className={`badge ${
                    t.deadlineStatus?.includes("Terlambat")
                      ? "bg-danger"
                      : t.deadlineStatus === "Hari ini"
                      ? "bg-warning text-dark"
                      : t.deadlineStatus === "Selesai"
                      ? "bg-success"
                      : "bg-primary"
                  }`}
                >
                  {t.deadlineStatus}
                </span>
              </td>
              <td className="text-center">
                <div className="btn-group btn-group-sm">
                  <Link
                    to={`/dashboard/dosen/task-individu/${t.id}/info`}
                    className="btn btn-outline-info"
                  >
                    <FaInfoCircle />
                  </Link>
                  {/* <Link
                    to={`/dashboard/dosen/task-individu/${t.id}/edit`}
                    className="btn btn-outline-warning"
                  >
                    <FaEdit />
                  </Link> */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ClassInfo;
