import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateGroup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    memberEmails: [],
  });

  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");
  const [memberResults, setMemberResults] = useState([]);

  const handleAddEmail = () => {
    const trimmed = newEmail.trim();
    if (trimmed && !form.memberEmails.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        memberEmails: [...prev.memberEmails, trimmed],
      }));
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (index) => {
    const updated = [...form.memberEmails];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, memberEmails: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMemberResults([]);

    try {
      // 1. Buat grup
      const createRes = await axios.post(
        `http://localhost:80/groups/`,
        {
          name: form.name,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const newGroup = createRes.data.group;
      const results = [];

      // 2. Tambahkan anggota
      for (const email of form.memberEmails) {
        try {
          await axios.post(
            `http://localhost:80/groups/${newGroup.id}/addMember`,
            { email },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          results.push({ email, success: true });
        } catch (err) {
          results.push({
            email,
            success: false,
            error: err.response?.data?.error || "Gagal menambahkan",
          });
        }
      }

      setMemberResults(results);
      setMessage("✅ Grup berhasil dibuat!");

      if (results.every((r) => r.success)) {
        setTimeout(() => {
          navigate("/dashboard/dosen/task-kelompok");
        }, 3500);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.error || "❌ Gagal membuat grup. Coba lagi."
      );
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <h3 className="mb-4 text-center">Buat Grup Baru</h3>
      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={handleSubmit}>
        {/* Nama Grup */}
        <div className="mb-3">
          <label className="form-label">Nama Grup</label>
          <input
            type="text"
            className="form-control"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Masukkan nama group"
          />
        </div>

        {/* Tambah Email Anggota */}
        <div className="mb-3">
          <label className="form-label">Tambah Anggota (Email Mahasiswa)</label>
          <div className="d-flex mb-2">
            <input
              type="email"
              className="form-control me-2"
              placeholder="email mahasiswa"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleAddEmail}
            >
              Tambah
            </button>
          </div>

          {form.memberEmails.length > 0 && (
            <ul className="list-group">
              {form.memberEmails.map((email, i) => (
                <li
                  key={i}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {email}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveEmail(i)}
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hasil Tambah Anggota */}
        {memberResults.length > 0 && (
          <div className="mt-3">
            <h6>Hasil Tambah Anggota:</h6>
            <ul className="list-group">
              {memberResults.map((r, idx) => (
                <li
                  key={idx}
                  className={`list-group-item d-flex justify-content-between ${
                    r.success
                      ? "list-group-item-success"
                      : "list-group-item-danger"
                  }`}
                >
                  <span>{r.email}</span>
                  <span>{r.success ? "✅ Berhasil" : `❌ ${r.error}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="d-flex justify-content-between mt-4">
          <button type="submit" className="btn btn-primary">
            Simpan
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroup;

