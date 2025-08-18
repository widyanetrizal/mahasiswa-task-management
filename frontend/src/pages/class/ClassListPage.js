import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaBook, FaUserTie, FaPlus } from "react-icons/fa";

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get("http://localhost:80/class/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setRole(response.data.role);
          setClasses(response.data.classes || []);
          if (response.data.message) {
            setMessage(response.data.message);
          }
        }
      } catch (error) {
        setMessage("Gagal memuat data kelas.");
        console.error("FETCH ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Memuat data kelas...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Daftar Kelas</h3>

        {role === "Dosen" && (
          <Link to="/dashboard/dosen/class/create" className="btn btn-success">
            <FaPlus className="me-2" />
            Buat Kelas
          </Link>
        )}
      </div>

      {message && <div className="alert alert-info">{message}</div>}
      {classes.length === 0 && !message && (
        <div className="alert alert-warning">Tidak ada kelas ditemukan.</div>
      )}

      <div className="row">
        {classes.map((kelas) => (
          <div className="col-lg-4 col-md-6 mb-4" key={kelas.id}>
            <Link
              to={
                role === "Dosen"
                  ? `/dashboard/dosen/class/${kelas.id}`
                  : `/dashboard/mahasiswa/class/${kelas.id}`
              }
              className="text-decoration-none"
            >
              <div className="card h-100 border-0 shadow-sm rounded-4 hover-shadow">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    Kelas: {kelas.name}
                  </h5>

                  <p className="mb-2 text-dark">
                    <FaBook className="me-2 text-success" />
                    <strong>Mata Kuliah: {kelas.mataKuliah}</strong>
                  </p>

                  {kelas.creatorName && (
                    <p className="mb-2 text-muted">
                      <FaUserTie className="me-2" />
                      Nama Dosen: <strong>{kelas.creatorName}</strong>
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyClasses;
