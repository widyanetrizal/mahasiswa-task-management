import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const CreateGroup = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", description: "" });
  const [classMembers, setClassMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [memberResults, setMemberResults] = useState([]);

  // Ambil anggota kelas saat load
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/class/${classId}/members`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setClassMembers(res.data.members);
      } catch (err) {
        console.error("Gagal mengambil anggota kelas", err.message);
      }
    };

    fetchMembers();
  }, [classId]);

  const toggleMember = (email) => {
    setSelectedMembers((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMemberResults([]);

    try {
      // 1. Buat grup
      const createRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/groups/${classId}`,
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
      for (const email of selectedMembers) {
        try {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/groups/${newGroup.id}/addMember`,
            {
            //   groupId: newGroup.id,
              email
            },
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

      // Jika semua sukses
      if (results.every((r) => r.success)) {
        setTimeout(() => {
          navigate(`/dashboard/dosen/class/${classId}`);
        }, 1500);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || "❌ Gagal membuat grup.");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "650px" }}>
      <h3 className="mb-4 text-center">Buat Grup untuk Kelas</h3>
      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={handleSubmit}>
        {/* Nama dan Deskripsi */}
        <div className="mb-3">
          <label className="form-label">Nama Grup</label>
          <input
            type="text"
            className="form-control"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Masukan nama group "
          />
        </div>

        <hr />

        {/* Pilihan Anggota */}
        <div className="mb-3">
          <label className="form-label">Pilih Anggota Grup berdasarkan Anggota Kelas</label>
          {classMembers.length === 0 ? (
            <p>Tidak ada mahasiswa di kelas ini.</p>
          ) : (
            <ul className="list-group">
              {classMembers.map((member) => (
                <li
                  key={member.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>
                    {member.name}
                  </span>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      selectedMembers.includes(member.email)
                        ? "btn-danger"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => toggleMember(member.email)}
                  >
                    {selectedMembers.includes(member.email)
                      ? "Batalkan"
                      : "Tambahkan"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hasil Tambahan */}
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
                  <span>{r.success ? "✅" : `❌ ${r.error}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tombol */}
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
