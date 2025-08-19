import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { Link } from "react-router-dom";
import axios from "axios";

export default function GroupTaskCreate() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    judul: "",
    description: "",
    deadline: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { judul, description, deadline } = form;
    if (!judul || !description || !deadline) {
      return setError("Harap isi semua field wajib.");
    }

    const token = localStorage.getItem("token");

    // Validasi deadline di masa depan
    const now = new Date();
    const deadlineDate = new Date(form.deadline);
    if (deadlineDate <= now) {
      return setError("Deadline harus di masa depan.");
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/groups/tasks/${groupId}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(res.data.message || "Tugas berhasil dibuat!");
      setForm({
        judul: "",
        description: "",
        deadline: "",
      });
      alert("Tugas berhasil ditambahkan");
      navigate(`/dashboard/mahasiswa/task-kelompok/groups/${groupId}/info`);
    } catch (err) {
      console.error(
        "Gagal menambahkan tugas:",
        err.response?.data || err.message
      );
      setError("Gagal menambahkan tugas.");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center">
              <h4 className="mb-0">Tambah Tugas ke Grup</h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <form onSubmit={handleSubmit}>

                {/* Judul */}
                <div className="mb-3">
                  <label>Judul Tugas</label>
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
                  <label>Deskripsi Tugas</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Masukkan deskripsi tugas"
                    required
                  />
                </div>

                {/* Deadline */}
                <div className="mb-3">
                  <label>Deadline</label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    className="form-control"
                    value={form.deadline}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button type="submit" className="btn btn-success">
                    Simpan
                  </button>
                  {/* ✅ Tambahan tombol kembali */}
                  <button
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
}
