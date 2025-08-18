import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function GroupListPage() {
  const [groups, setGroups] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:80/groups/no-class", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Urutkan dari yang terbaru berdasarkan createdAt
      const sortedGroups = res.data.groups.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setGroups(sortedGroups);
    } catch (err) {
      console.error("Gagal memuat grup:", err.message);
    }
  };

  // ✅ Fungsi untuk menampilkan status user terhadap grup
  const getUserStatusInGroup = (group) => {
    if (!user) return "";
    if (group.createdBy?.id === user.id);
    if (
      user.role === "Dosen" &&
      group.dosenName?.toLowerCase() === user.name?.toLowerCase()
    );
    //   return "Anda sebagai Dosen Pembimbing";
    // return "Anda sebagai Anggota";
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Daftar Grup</h3>

        {/* TOMBOL KHUSUS DOSEN */}
        {user?.role === "Dosen" && (
          <Link
            to="/dashboard/dosen/task-kelompok/groups/create"
            className="btn btn-primary"
          >
            + Buat Grup
          </Link>
        )}
      </div>

      <div className="row">
        {groups.length === 0 ? (
          <p className="text-muted">Belum ada grup tersedia.</p>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="col-md-4 mb-4">
              <div className="card shadow h-100">
                <div className="card-body ">
                  <h4 className="card-title">{group.name}</h4>
                  <p className="card-text mb-1">
                    <em>Nama Dosen:</em> {group.creatorName || "-"}
                  </p>
                  <p className="card-text text-muted">
                    <i>{getUserStatusInGroup(group)}</i>
                  </p>
                  <Link
                    to={
                      user.role === "Dosen"
                        ? `/dashboard/dosen/task-kelompok/groups/${group.id}/info`
                        : `/dashboard/mahasiswa/task-kelompok/groups/${group.id}/info`
                    }
                    className="btn btn-outline-primary btn-sm"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
