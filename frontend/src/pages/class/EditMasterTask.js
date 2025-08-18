import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function EditMasterTask() {
  const { masterTaskId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    judul: "",
    description: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);

  // Ambil data awal (dari salah satu task dalam masterTaskId)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token"); // ambil token
        const res = await axios.get(
          `${process.env.APP_URL}/tasks/master/${masterTaskId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data && res.data.tasksWithStatus?.length > 0) {
          const firstTask = res.data.tasksWithStatus[0];
          setFormData({
            judul: firstTask.judul || "",
            description: firstTask.description || "",
            deadline: firstTask.deadline
              ? firstTask.deadline.split("T")[0]
              : "",
          });
        }
      } catch (err) {
        console.error("Gagal mengambil data master task:", err);
      }
    };
    fetchData();
  }, [masterTaskId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env.APP_URL}/tasks/master/${masterTaskId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Tugas berhasil diperbarui untuk semua sub-tugas!");
      navigate(-1); // kembali ke halaman sebelumnya
    } catch (err) {
      console.error("Gagal update master task:", err);
      alert(
        err.response?.data?.error || "Terjadi kesalahan saat memperbarui tugas"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Edit Tugas terkait Kelas</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Judul</label>
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
          <label>Deskripsi Tugas</label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Masukkan deskripsi tugas"
          ></textarea>
        </div>
        <div className="mb-3">
          <label>Deadline</label>
          <input
            type="date"
            className="form-control"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
          />
        </div>

        <div className="d-flex justify-content-between mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
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
