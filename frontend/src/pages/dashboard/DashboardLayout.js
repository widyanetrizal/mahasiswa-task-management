import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import axios from "axios";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaListUl,
  FaClipboardCheck,
  FaUserGraduate,
  FaHome,
  FaBars,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../App.css";
import NotificationPopup from "../../components/NotificationPopup";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 992); // default buka di desktop

  const [openMenu, setOpenMenu] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/users/profile`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("❌ Gagal ambil data profil:", err);
      }
    };
    fetchProfile();

    // Responsif: kalau resize di bawah 992px, sidebar sembunyi
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 992);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="text-center mt-5">🔄 Mengalihkan ke halaman login...</div>
    );
  }

  const role = user.role?.toLowerCase();

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = (menuKey) => {
    setOpenMenu((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const navItems = {
    mahasiswa: [
      {
        path: "/dashboard/mahasiswa/class",
        icon: <FaChalkboardTeacher />,
        label: "Kelas Mata Kuliah",
      },
      {
        label: "Tugas Non-Kelas",
        icon: <FaListUl />,
        children: [
          {
            path: "/dashboard/mahasiswa/task-individu",
            icon: <FaClipboardCheck />,
            label: "Tugas Individu",
          },
          {
            path: "/dashboard/mahasiswa/task-kelompok",
            icon: <FaUsers />,
            label: "Tugas Kelompok",
          },
        ],
      },
      {
        path: "/dashboard/mahasiswa/notifikasi",
        icon: <FaBell />,
        label: "Notifikasi",
      },
    ],
    dosen: [
      {
        path: "/dashboard/dosen/class",
        icon: <FaChalkboardTeacher />,
        label: "Kelas Mata Kuliah",
      },
      {
        label: "Tugas Non-Kelas",
        icon: <FaListUl />,
        children: [
          {
            path: "/dashboard/dosen/task-individu",
            icon: <FaClipboardCheck />,
            label: "Tugas Individu",
          },
          {
            path: "/dashboard/dosen/task-kelompok",
            icon: <FaUsers />,
            label: "Tugas Kelompok",
          },
        ],
      },
      {
        path: "/dashboard/dosen/notifikasi",
        icon: <FaBell />,
        label: "Notifikasi",
      },
    ],
    admin: [
      {
        path: "/dashboard/admin/user",
        icon: <FaUserGraduate />,
        label: "Manajemen User",
      },
      // {
      //   path: "/dashboard/admin/log",
      //   icon: <FaListUl />,
      //   label: "Monitoring Log",
      // },
    ],
  };

  return (
    <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <div
        // className="sidebar text-white p-3"
        className="d-flex flex-column text-white p-3"
        style={{
          width: "250px",
          position: "fixed",
          // position: "sticky",
          top: 0,
          left: sidebarOpen ? 0 : "-250px",
          height: "100vh",
          backgroundColor: "#3366cc",
          color: "#fff",
          transition: "left 0.3s ease",
          zIndex: 1000,
        }}
      >
        <div className="text-center mb-3">
          <Link
            to={`/dashboard/${role}`}
            className="text-white text-decoration-none fw-bold fs-5"
          >
            <FaHome className="me-2" /> MicroTasker
          </Link>
          <hr style={{ borderColor: "#ccd3dc" }} />
        </div>

        <ul className="nav flex-column mb-4">
          {navItems[role]?.map((item, idx) => (
            <li key={idx} className="nav-item mb-2">
              {item.children ? (
                <>
                  <div
                    className="nav-link text-white d-flex align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleMenu(item.label)}
                  >
                    {item.icon} <span className="ms-2">{item.label}</span>
                  </div>
                  {openMenu[item.label] && (
                    <ul className="nav flex-column ms-4">
                      {item.children.map((child, cIdx) => (
                        <li key={cIdx} className="nav-item mb-1">
                          <Link
                            to={child.path}
                            className="nav-link text-white"
                            onClick={() =>
                              window.innerWidth < 992 && setSidebarOpen(false)
                            }
                          >
                            {child.icon}{" "}
                            <span className="ms-2">{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className="nav-link text-white d-flex align-items-center"
                  onClick={() =>
                    window.innerWidth < 992 && setSidebarOpen(false)
                  }
                >
                  {item.icon} <span className="ms-2">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <hr className="border-light" />
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link
                to={`/dashboard/${role}/profile`}
                className="nav-link text-white"
              >
                <FaUserCircle className="me-2" /> Info Profil
              </Link>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="btn btn-light text-dark w-100 mt-3"
                style={{ backgroundColor: "#e4e6eb", border: "none" }}
              >
                <FaSignOutAlt className="me-2" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-grow-1 overflow-auto"
        style={{
          maxHeight: "100vh",
          backgroundColor: "#f5f7fa",
          padding: "30px",
          marginLeft: sidebarOpen ? "250px" : "0",
          transition: "margin-left 0.3s ease",
          width: "100%",
        }}
      >
        {/* Header Role Info */}
        <div
          className="d-flex justify-content-between align-items-center mb-3 pb-3"
          style={{
            borderBottom: "2px solid #dee2e6",
          }}
        >
          <button
            className="btn btn-outline-primary d-lg-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars />
          </button>
          <div>
            <h4 className="mb-1">
              <i>Selamat Datang, {profile?.name || "Pengguna"}</i>
            </h4>
            <span
              className={`badge bg-${
                role === "mahasiswa"
                  ? "primary"
                  : role === "dosen"
                  ? "success"
                  : "warning"
              } text-uppercase`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* PASANG DISINI agar Toast muncul di semua halaman */}
        <NotificationPopup userId={user?.userId} token={user?.token} />

        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
