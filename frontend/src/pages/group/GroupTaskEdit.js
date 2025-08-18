import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

const GroupTaskEdit = () => {
  const { user } = useAuth();
  const { taskId, groupId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    progress: 0,
    description: "",
    file: null,
    dosenComment: "",
    grade: "",
    action: "",
    taskId: null,
  });

  const [progressId, setProgressId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await axios.get(
          `http://localhost:80/progress/task/group/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        const data = res.data;

        // Ambil progress milik mahasiswa (biasanya hanya 1)
        const progress = Array.isArray(data) ? data[0] : data;

        if (!progress) {
          alert("Progress tidak ditemukan.");
          return navigate(-1);
        }

        setProgressId(progress.id);

        setForm((prev) => ({
          ...prev,
          progress: progress.progress || 0,
          description: progress.description || "",
          taskId: progress.taskId,
        }));
      } catch (error) {
        alert("Gagal mengambil data progress.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [taskId, user.token, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm((prev) => ({ ...prev, file: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!progressId) {
      return alert("ID progress tidak ditemukan.");
    }
    try {
      const formData = new FormData();

      if (user.role === "Mahasiswa") {
        formData.append("progress", form.progress);
        formData.append("description", form.description);
        if (form.file) formData.append("file", form.file);

        console.log(
          "Mengirim request PUT update progress...",
          progressId,
          formData
        );

        const response = await axios.put(
          `http://localhost:80/progress/${progressId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        console.log("Response update progress:", response.data);
        alert("Progress berhasil diperbarui.");
        navigate(
          `/dashboard/mahasiswa/task-kelompok/groups/${groupId}/tasks/${taskId}/edit`
        );
      }

      if (user.role === "Dosen") {
        if (!form.action) {
          return alert("Pilih aksi terlebih dahulu.");
        }
        if (form.action === "Revisi" && !form.dosenComment) {
          return alert("Komentar wajib diisi untuk revisi.");
        }

        formData.append("action", form.action);
        if (form.dosenComment)
          formData.append("dosenComment", form.dosenComment);
        if (form.grade) formData.append("grade", form.grade);
        if (form.file) formData.append("file", form.file);

        console.log(
          "Mengirim request PUT comment dosen...",
          progressId,
          formData
        );

        const response = await axios.put(
          `http://localhost:80/progress/${progressId}/comment`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              // "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Response comment dosen:", response.data);
        alert("Komentar berhasil dikirim.");
        navigate(
          `/dashboard/dosen/task-kelompok/groups/${groupId}/tasks/${taskId}/edit`
        );
      }
    } catch (err) {
      console.error("Error saat submit:", err);
      alert("Gagal menyimpan: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading)
    return <div className="text-center mt-5">Memuat data progress...</div>;

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white text-center">
          <h4 className="text-center">
            {user.role === "Dosen"
              ? "Tambah Komentar Progres Tugas Kelompok"
              : "Tambah Progres Tugas Kelompok"}
          </h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {user.role === "Mahasiswa" && (
              <>
                <div className="mb-3">
                  <label>Progress (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="progress"
                    value={form.progress}
                    onChange={handleChange}
                    min="0"
                    max="99"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Upload Dokumen (opsional)</label>
                  <input
                    type="file"
                    className="form-control"
                    name="file"
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label>Deskripsi Progress</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Contoh: Menyelesaikan bab 2 laporan"
                  ></textarea>
                </div>
              </>
            )}

            {user.role === "Dosen" && (
              <>
                <div className="mb-3">
                  <label>Aksi</label>
                  <select
                    className="form-select"
                    name="action"
                    value={form.action || ""}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Pilih Aksi --</option>
                    <option value="Revisi">Revisi</option>
                    <option value="Done">Selesai (Done)</option>
                  </select>
                </div>

                {form.action === "Revisi" && (
                  <>
                    <div className="mb-3">
                      <label>Komentar atau Saran Dosen</label>
                      <textarea
                        className="form-control"
                        name="dosenComment"
                        value={form.dosenComment}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Contoh: Harap perbaiki struktur laporan pada Bab III agar lebih jelas"
                        required
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label>Upload Dokumen Referensi(opsional)</label>
                      <input
                        type="file"
                        className="form-control"
                        name="file"
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {form.action === "Done" && (
                  <div className="mb-3">
                    <label>Nilai (0 - 100)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="grade"
                      value={form.grade}
                      onChange={handleChange}
                      min="0"
                      max="100"
                    />
                  </div>
                )}
              </>
            )}

            {/* Tombol */}
            <div className="d-flex justify-content-between">
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
  );
};

export default GroupTaskEdit;
