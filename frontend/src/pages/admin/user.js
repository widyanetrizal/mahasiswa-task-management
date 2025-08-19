import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../../css/UserList.css";
import { FaTrash } from "react-icons/fa";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState([]);
  const [showCheckbox, setShowCheckbox] = useState(false); // mode pilih
  const token = localStorage.getItem("token");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || "Gagal memuat data");
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Pilih semua
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(users.map((u) => u.id));
    } else {
      setSelected([]);
    }
  };

  // Pilih satu-satu
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Hapus banyak sekaligus
  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      alert("Pilih user yang ingin dihapus.");
      return;
    }

    if (!window.confirm(`Hapus ${selected.length} user?`)) return;

    try {
      await Promise.all(
        selected.map((id) =>
          axios.delete(`${process.env.REACT_APP_API_URL}/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setUsers((prev) => prev.filter((u) => !selected.includes(u.id)));
      setSelected([]);
    } catch (error) {
      alert("Gagal menghapus user.");
    }
  };

  // Toggle mode pilih
  const toggleCheckboxMode = () => {
    if (showCheckbox) {
      setSelected([]); // reset pilihan saat batal pilih
    }
    setShowCheckbox((prev) => !prev);
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-2">Daftar Pengguna</h2>
        <div>
          {showCheckbox && selected.length > 0 && (
            <button
              className="btn btn-danger btn-sm me-2"
              onClick={handleDeleteSelected}
            >
              <FaTrash /> Hapus Terpilih ({selected.length})
            </button>
          )}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={toggleCheckboxMode}
          >
            {showCheckbox ? "Batal Pilih" : "Pilih"}
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="table-responsive">
        <table
          className="table table-striped table-bordered align-middle mb-0 w-100"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <thead className="table-light text-center">
            <tr>
              {showCheckbox && (
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.length === users.length && users.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              <th style={{ width: "40px" }}>No</th>
              <th>Nama</th>
              <th>Email</th>
              <th style={{ minWidth: "60px" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={showCheckbox ? "5" : "6"} className="text-center">
                  Tidak ada pengguna
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id}>
                  {showCheckbox && (
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selected.includes(user.id)}
                        onChange={() => handleSelect(user.id)}
                      />
                    </td>
                  )}
                  <td className="text-center">{index + 1}</td>
                  <td style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                    {user.name}
                  </td>
                  <td style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                    {user.email}
                  </td>
                  <td className="text-center" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                    {user.role}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
