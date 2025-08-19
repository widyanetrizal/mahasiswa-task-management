import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
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
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/users/login`, form);
      login({
        token: res.data.token,
        role: res.data.user.role,
        userId: res.data.user.id,
      });

      const role = res.data.user.role.toLowerCase();
      navigate(`/dashboard/${role}`);
    } catch (err) {
      alert("Login gagal: " + (err.response?.data?.message || err.message));
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
          <h2 className="text-primary fw-bold">Login</h2>
        </div>

        <form onSubmit={handleSubmit}>
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
                name="email"
                id="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Masukkan email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
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
                name="password"
                id="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Masukkan password"
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

          {/* Tombol Login */}
          <button type="submit" className="btn btn-primary w-100 fw-semibold">
            Login
          </button>

          {/* Link ke Register dan Beranda */}
          <div className="text-center mt-3">
            <p className="mb-2">
              Belum punya akun?{" "}
              <Link to="/register" className="fw-semibold text-decoration-none">
                Daftar
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

export default LoginPage;
