// // src/pages/HomePage.js
// import React from "react";
// import { Link } from "react-router-dom";

// const HomePage = () => {
//   return (
//     <div
//       className="container d-flex flex-column justify-content-center align-items-center"
//       style={{ height: "100vh" }}
//     >
//       <div className="text-center">
//         <h1 className="mb-4 fw-bold">
//           Selamat Datang di Sistem Manajemen Tugas
//         </h1>
//         <div className="d-flex justify-content-center gap-3">
//           <Link
//             to="/login"
//             className="btn btn-primary px-4"
//           >
//             Login
//           </Link>
//           <Link
//             to="/register"
//             className="btn btn-success px-4"
//           >
//             Register
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HomePage;

// // src/pages/HomePage.js
// import React from "react";
// import { Link } from "react-router-dom";
// import "bootstrap/dist/css/bootstrap.min.css";
// import homepageIllustration from "../assets/illustration_home.svg"; // pastikan kamu punya gambar ini

// const HomePage = () => {
//   return (
//     <div
//       className="container-fluid bg-light d-flex align-items-center justify-content-center"
//       style={{ minHeight: "100vh" }}
//     >
//       <div className="row w-100">
//         <div className="col-md-6 d-flex flex-column justify-content-center align-items-start p-5">
//           <h1 className="fw-bold mb-3 text-primary">
//             <strong> Selamat Datang di
//             Sistem Manajemen Tugas </strong>
//           </h1>
//           <p className="mb-4 text-secondary">
//             Kelola tugas Individu, Kolaborasi, dan Pantauan Progres Tugas dengan mudah bersama platform manajemen tugas
//           </p>
//           <div className="d-flex gap-3">
//             <Link to="/login" className="btn btn-primary px-4">
//               <i className="bi bi-box-arrow-in-right me-2"></i> Login
//             </Link>
//             <Link to="/register" className="btn btn-success px-4">
//               <i className="bi bi-person-plus-fill me-2"></i> Register
//             </Link>
//           </div>
//         </div>
//         <div className="col-md-6 d-none d-md-flex justify-content-center align-items-center">
//           <img
//             src={homepageIllustration}
//             alt="Homepage Illustration"
//             className="img-fluid"
//             style={{ maxHeight: "400px" }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HomePage;

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import homepageIllustration from "../assets/illustration_home.svg";
import AOS from "aos";
import "aos/dist/aos.css";

const HomePage = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <i className="bi bi-check2-square fs-3 text-primary"></i>{" "}
            {/* Bootstrap Icons */}
            <span className="fw-bold fs-4 text-primary">MicroTasker</span>
          </Link>
          <div className="d-flex gap-2">
            <Link to="/login" className="btn btn-primary shadow">
              <i className="bi bi-box-arrow-in-right me-2"></i> Login
            </Link>
            <Link to="/register" className="btn btn-success shadow">
              <i className="bi bi-person-plus-fill me-2"></i> Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container flex-grow-1 d-flex align-items-center">
        <div className="row w-100 align-items-center py-5">
          <div className="col-md-6 mb-4 mb-md-0" data-aos="fade-right">
            <h1 className="fw-bold text-primary mb-3">
              Selamat Datang di <br /> Sistem Manajemen Tugas
            </h1>
            <p className="text-muted mb-4">
              Kelola tugas Individu, Kolaborasi, dan Pantauan Progres Tugas
              dengan mudah bersama platform manajemen tugas modern.
            </p>
            <ul className="list-unstyled text-muted">
              <li>
                <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                Kelola tugas Individu
              </li>
              <li>
                <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                Kolaborasi antar pengguna
              </li>
              <li>
                <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                Progress tracking visual
              </li>
            </ul>
          </div>

          <div className="col-md-6 text-center" data-aos="fade-left">
            <img
              src={homepageIllustration}
              alt="Illustration"
              className="img-fluid"
              style={{ maxHeight: "400px" }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white text-center text-muted py-3 border-top">
        <small>
          © {new Date().getFullYear()} Sistem Manajemen Tugas
        </small>
      </footer>
    </div>
  );
};

export default HomePage;
