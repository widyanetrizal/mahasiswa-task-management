import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserTag,
  FaEye, 
  FaEyeSlash
} from "react-icons/fa";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Kunci scroll di body
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/users/register`, form);
      alert("Registrasi berhasil! Silakan login.");
      navigate("/login");
    } catch (err) {
      alert(
        "Registrasi gagal: " + (err.response?.data?.message || err.message)
      );
      navigate("/");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(to right, #e3f2fd, #fce4ec)",
        padding: "20px",
      }}
    >
      <div
        className="card shadow p-4"
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-primary fw-bold">Register</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nama */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label fw-medium">
              Nama Lengkap
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-light"
                style={{
                  fontSize: "14px",
                }}
              >
                <FaUser />
              </span>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                placeholder="Masukkan nama lengkap"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-medium">
              Alamat Email
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-light"
                style={{
                  fontSize: "14px",
                }}
              >
                <FaEnvelope />
              </span>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                placeholder="Masukkan email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-medium">
              Kata Sandi
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-light"
                style={{
                  fontSize: "14px",
                }}
              >
                <FaLock />
              </span>
              <input
                // type="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                id="password"
                name="password"
                placeholder="Masukkan password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span
          className="input-group-text bg-light"
          style={{ cursor: "pointer", fontSize: "14px" }}
          onClick={togglePassword}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
            </div>
          </div>

          {/* Role */}
          <div className="mb-4">
            <label htmlFor="role" className="form-label fw-medium">
              Peran
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-light"
                style={{
                  fontSize: "14px",
                }}
              >
                <FaUserTag />
              </span>
              <select
                className="form-select"
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Pilih Peran
                </option>
                <option value="Mahasiswa">Mahasiswa</option>
                <option value="Dosen">Dosen</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Tombol Daftar */}
          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            style={{ transition: "0.3s" }}
          >
            Daftar
          </button>

          {/* Link dan Kembali */}
          <div className="text-center mt-3">
            <p className="mb-2">
              Sudah punya akun?{" "}
              <Link to="/login" className="fw-semibold text-decoration-none">
                Login
              </Link>
            </p>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate("/")}
            >
              <FaArrowLeft className="me-2" />
              Kembali ke Beranda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
