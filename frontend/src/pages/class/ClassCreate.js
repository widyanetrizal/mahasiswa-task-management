import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateClass = () => {
  const [form, setForm] = useState({
    name: "",
    mataKuliah: "",
    anggotaEmails: [],
  });
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleAddEmail = () => {
    if (newEmail.trim()) {
      setForm((prevForm) => ({
        ...prevForm,
        anggotaEmails: [...prevForm.anggotaEmails, newEmail.trim()],
      }));
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (index) => {
    setForm((prevForm) => {
      const updated = [...prevForm.anggotaEmails];
      updated.splice(index, 1);
      return { ...prevForm, anggotaEmails: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // 1. Buat kelas
      const createRes = await axios.post(
        `${process.env.APP_URL}/class/`,
        {
          name: form.name,
          mataKuliah: form.mataKuliah,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const newClass = createRes.data.class;

      // 2. Tambah mahasiswa jika ada
      if (form.anggotaEmails.length > 0) {
        await axios.post(
          `${process.env.APP_URL}/class/${newClass.id}/students`,
          { emails: form.anggotaEmails },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      setMessage("✅ Kelas berhasil dibuat!");
      setTimeout(() => navigate("/dashboard/dosen/class"), 1500);
    } catch (error) {
      setMessage(
        error.response?.data?.error || "❌ Gagal membuat kelas. Coba lagi."
      );
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <h3 className="mb-4 text-center">Buat Kelas Baru</h3>
      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nama Kelas</label>
          <input
            type="text"
            className="form-control"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Masukkan nama kelas"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Mata Kuliah</label>
          <input
            type="text"
            className="form-control"
            value={form.mataKuliah}
            onChange={(e) => setForm({ ...form, mataKuliah: e.target.value })}
            placeholder="Masukkan nama Mata Kuliah"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Tambah Mahasiswa (Email)</label>
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

          {form.anggotaEmails.length > 0 && (
            <ul className="list-group">
              {form.anggotaEmails.map((email, i) => (
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

        <div className="d-flex justify-content-between mt-4">
          <button type="submit" className="btn btn-success">
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

export default CreateClass;
