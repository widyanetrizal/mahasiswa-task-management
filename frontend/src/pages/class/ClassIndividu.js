import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";

const TaskCreateClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  const [form, setForm] = useState({
    judul: "",
    description: "",
    deadline: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.judul) newErrors.judul = "Judul wajib diisi.";
    if (!form.description) newErrors.description = "Deskripsi wajib diisi.";
    if (!form.deadline) newErrors.deadline = "Deadline wajib dipilih.";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.post(
        `${process.env.APP_URL}/tasks/${classId}`,
        {
          ...form,
          deadline: new Date(form.deadline).toISOString(), // konversi ke format ISO
          classId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Tugas berhasil dibuat!");
      navigate(`/dashboard/dosen/class/${classId}`);
    } catch (err) {
      console.error("❌ Gagal membuat tugas:", err);
      alert("Terjadi kesalahan saat membuat tugas.");
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center">
              <h5 className="mb-0">📝 Buat Tugas Baru untuk Kelas</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Judul */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Judul Tugas</label>
                  <input
                    type="text"
                    className={`form-control ${errors.judul && "is-invalid"}`}
                    name="judul"
                    value={form.judul}
                    onChange={handleChange}
                    placeholder="Contoh: Laporan Praktikum Keamanan Jaringan"
                  />
                  {errors.judul && (
                    <div className="invalid-feedback">{errors.judul}</div>
                  )}
                </div>

                {/* Deskripsi */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Deskripsi Tugas</label>
                  <textarea
                    className={`form-control ${errors.description && "is-invalid"}`}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Contoh: Buatlah laporan konfigurasi dan pengujian firewall menggunakan iptables."
                  />
                  {errors.description && (
                    <div className="invalid-feedback">{errors.description}</div>
                  )}
                </div>

                {/* Deadline */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Deadline</label>
                  <input
                    type="datetime-local"
                    className={`form-control ${errors.deadline && "is-invalid"}`}
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                  />
                  {errors.deadline && (
                    <div className="invalid-feedback">{errors.deadline}</div>
                  )}
                </div>

                {/* Aksi */}
                <div className="d-flex justify-content-between mt-4">
                  <button type="submit" className="btn btn-success w-50 me-2">
                    Simpan
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary w-50"
                    onClick={() =>
                      navigate(`/dashboard/dosen/class/${classId}`)
                    }
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

export default TaskCreateClass;
