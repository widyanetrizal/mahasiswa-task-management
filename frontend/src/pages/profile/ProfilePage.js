// src/pages/profile/ProfilePage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";
// import { useNavigate } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ password: "" });
//   const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:80/users/profile", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProfile(res.data);
      } catch (error) {
        console.error("❌ Gagal ambil profil:", error);
      }
    };

    fetchProfile();
  }, [user.token]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.password) {
        alert("⚠️ Harap masukkan password baru.");
        return;
      }

      await axios.put(
        "http://localhost:80/users/update",
        { password: form.password },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      alert("✅ Password berhasil diperbarui!");
      setShowEdit(false);
      setForm({ password: "" }); // Reset form
    } catch (error) {
      console.error("❌ Gagal update password:", error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4">
        <h3 className="mb-4">Profil Saya</h3>
        <div className="mb-2"><strong>Nama:</strong> {profile.name}</div>
        <div className="mb-2"><strong>Email:</strong> {profile.email}</div>
        <div className="mb-2"><strong>Role:</strong> {profile.role}</div>
        <div className="mt-4 d-flex gap-2">
          <Button variant="primary" onClick={() => setShowEdit(true)}>Ubah Password</Button>
          {/* {profile.role === "admin" && (
            <Button variant="danger" onClick={() => alert("Hapus akun hanya oleh Admin")}>
              Hapus Akun
            </Button>
          )} */}
        </div>
      </div>

      {/* Modal Ubah Password */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Ubah Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama</Form.Label>
              <Form.Control type="text" value={profile.name} readOnly />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={profile.email} readOnly />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password Baru</Form.Label>
              <Form.Control
                type="password"
                placeholder="Masukkan password baru"
                value={form.password}
                onChange={(e) => setForm({ password: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Batal</Button>
            <Button type="submit" variant="success">Simpan</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
