import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const TaskCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  const [form, setForm] = useState({
    email: "",
    mataKuliah: "",
    judul: "",
    description: "",
    deadline: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { email, judul, description, deadline } = form;
    if (!email || !judul || !description || !deadline) {
      return setError("Harap isi semua field wajib.");
    }

    try {
      await axios.post(
        `/tasks/`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Tugas berhasil dibuat!");
      navigate("/dashboard/dosen/task-individu");
    } catch (err) {
      console.error("Gagal membuat tugas:", err);
      alert("Terjadi kesalahan saat membuat tugas.");
    }
  };

  return (
    <div className="container py-2">
      <div className="row justify-content-center">
        <div className="col-md-3 col-lg-10">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center">
              <h4 className="mb-0">Buat Tugas untuk Mahasiswa</h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label className="form-label">Email Mahasiswa</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    required
                  />
                </div>

                {/* Mata Kuliah */}
                <div className="mb-3">
                  <label className="form-label">Mata Kuliah (Opsional)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="mataKuliah"
                    value={form.mataKuliah}
                    onChange={handleChange}
                    placeholder="Jaringan Komputer"
                  />
                </div>

                {/* Judul */}
                <div className="mb-3">
                  <label className="form-label">Judul Tugas</label>
                  <input
                    type="text"
                    name="judul"
                    className="form-control"
                    value={form.judul}
                    onChange={handleChange}
                    placeholder="Masukkan judul tugas"
                    required
                  />
                </div>

                {/* Deskripsi */}
                <div className="mb-3">
                  <label className="form-label">Deskripsi</label>
                  <textarea
                    name="description"
                    className="form-control"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    required
                    placeholder="Masukkan deskripsi tugas"
                  />
                </div>

                {/* Deadline */}
                <div className="mb-3">
                  <label className="form-label">Deadline</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    required
                  />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCreate;

