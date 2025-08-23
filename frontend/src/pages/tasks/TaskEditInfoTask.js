import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const TaskEditInfoTask = () => {
  const { id } = useParams(); // ambil id task dari URL
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    judul: "",
    description: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(true);

  // Ambil data tugas untuk isi form awal
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await axios.get(`/tasks/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const task = res.data;

        setFormData({
          judul: task.judul || "",
          description: task.description || "",
          deadline: task.deadline ? task.deadline.slice(0, 16) : "",
        });
        setLoading(false);
      } catch (err) {
        console.error("❌ Gagal memuat data tugas:", err);
        setLoading(false);
      }
    };

    if (user?.token) fetchTask();
  }, [id, user?.token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Kirim update ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/tasks/${id}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      alert("✅ Tugas berhasil diperbarui");
      navigate("/dashboard/dosen/task-individu");
    } catch (err) {
      alert(
        "❌ Gagal memperbarui tugas: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  if (loading) return <p>Memuat data...</p>;

  return (
    <div className="container py-4">
      <h2>Edit Tugas</h2>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Judul</label>
          <input
            type="text"
            className="form-control"
            name="judul"
            value={formData.judul}
            onChange={handleChange}
            placeholder="Masukkan judul tugas"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Deskripsi</label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Masukkan deskripsi tugas"
          ></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Deadline</label>
          <input
            type="datetime-local"
            className="form-control"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
          />
        </div>

        <div className="d-flex justify-content-between mt-4">
          <button type="submit" className="btn btn-primary">
            Simpan Perubahan
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

export default TaskEditInfoTask;
