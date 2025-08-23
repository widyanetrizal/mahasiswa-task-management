import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditGroupTask() {
  const { groupId, taskId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    judul: "",
    description: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(true);

  // Ambil data awal
  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await axios.get(
          `/groups/${groupId}/tasks/${taskId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const t = res.data.data;
        setFormData({
          judul: t.judul || "",
          description: t.description || "",
          deadline: t.deadline
            ? t.deadline.slice(0, 16) // format untuk datetime-local
            : "",
        });
        setLoading(false);
      } catch (err) {
        console.error("❌ Gagal mengambil data task:", err);
        setLoading(false);
        alert("Gagal memuat data tugas");
      }
    }
    if (token) fetchTask();
  }, [groupId, taskId, token]);

  // Handle perubahan input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit update
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await axios.put(
        `/groups/${groupId}/tasks/${taskId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("✅ Tugas berhasil diperbarui");
      navigate(`/dashboard/dosen/task-kelompok/groups/${groupId}/info`);
    } catch (err) {
      console.error(err);
      alert(
        "❌ Gagal memperbarui tugas: " +
          (err.response?.data?.error || err.message)
      );
    }
  }

  if (loading) return <p>Memuat data...</p>;

  return (
    <div className="container py-4">
      <h2>Edit Tugas Grup</h2>
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
          <label className="form-label">Deskripsi Tugas</label>
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
}
