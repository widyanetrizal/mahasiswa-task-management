import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Modal,
  Button,
  Form,
  Spinner,
  ListGroup,
  Badge,
} from "react-bootstrap";
import { FaTrash, FaPlus, FaUserPlus } from "react-icons/fa";

const ClassMembers = ({ embedded = false, classId: propClassId, role: propRole }) => {
  const { classId: routeClassId } = useParams();
  const classId = propClassId || routeClassId;
  const token = localStorage.getItem("token");
  const role = propRole || localStorage.getItem("role");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addStatus, setAddStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get(
          `http://localhost:80/class/${classId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMembers(res.data.members || []);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Gagal memuat anggota kelas.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [classId, token]);

  const handleDelete = async (studentId) => {
    if (!window.confirm("Yakin ingin menghapus mahasiswa ini dari kelas?")) return;

    try {
      await axios.delete(
        `http://localhost:80/class/${classId}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers((prev) => prev.filter((m) => m.id !== studentId));
    } catch (error) {
      console.error("Gagal menghapus mahasiswa:", error);
      alert("Gagal menghapus mahasiswa.");
    }
  };

  const handleAddStudent = async () => {
    if (!newEmail.trim()) return;
    setSubmitting(true);

    try {
      const res = await axios.post(
        `http://localhost:80/class/${classId}/students`,
        { emails: [newEmail] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = res.data.result?.[0];
      setAddStatus(result);

      if (result.status === "berhasil ditambahkan") {
        const updated = await axios.get(
          `http://localhost:80/class/${classId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMembers(updated.data.members);
        setNewEmail("");
      }
    } catch (err) {
      console.error("Gagal menambahkan mahasiswa:", err);
      setAddStatus({ email: newEmail, status: "gagal", reason: "Server error" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    setAddStatus(null);
    setNewEmail("");
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <p className="text-danger text-center">{error}</p>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>
          Anggota Kelas{" "}
          <Badge pill bg="secondary">
            {members.length} Mahasiswa
          </Badge>
        </h4>
        {role === "Dosen" && (
          <Button variant="success" onClick={toggleModal}>
            <FaUserPlus className="me-1" /> Tambah Mahasiswa
          </Button>
        )}
      </div>

      <ListGroup>
        {members.map((member) => (
          <ListGroup.Item
            key={member.id}
            className="d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{member.name}</strong> — {member.email}
            </div>
            {role === "Dosen" && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDelete(member.id)}
              >
                <FaTrash />
              </Button>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>

      {/* Modal Tambah Mahasiswa */}
      <Modal show={showModal} onHide={toggleModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Mahasiswa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="email">
              <Form.Label>Email Mahasiswa</Form.Label>
              <Form.Control
                type="email"
                placeholder="Masukkan email mahasiswa"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={submitting}
              />
            </Form.Group>
            {addStatus && (
              <div className={`mt-2 text-${addStatus.status === "berhasil ditambahkan" ? "success" : "danger"}`}>
                {addStatus.email} - {addStatus.status}
                {addStatus.reason ? `: ${addStatus.reason}` : ""}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={toggleModal}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleAddStudent}
            disabled={submitting}
          >
            {submitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FaPlus className="me-1" /> Tambah
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClassMembers;
