import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function GroupMemberAdd() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  //   const [role, setRole] = useState("Anggota");
  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:80/groups/${groupId}/addMember`,
        { email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Anggota berhasil ditambahkan");
      navigate(`/dashboard/mahasiswa/task-kelompok/groups/${groupId}/info`);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal menambahkan anggota";
      alert(`Gagal: ${errorMessage}`);
      console.error("Gagal tambah anggota:", err.response?.data || err.message);
      //   alert("Gagal menambahkan anggota", err.response?.data || err.message);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Tambah Anggota Grup</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email Anggota</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan email mahasiswa"
            required
          />
        </div>

        <button type="submit" className="btn btn-success">
          Tambah
        </button>
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={() =>
            navigate(-1)
          }
        >
          Kembali
        </button>
      </form>
    </div>
  );
}
