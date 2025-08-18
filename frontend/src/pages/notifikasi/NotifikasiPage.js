import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";
import { FaTrash } from "react-icons/fa";

const NotifikasiPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [showCheckbox, setShowCheckbox] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `${process.env.APP_URL}/notifications/${user.userId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        // Urutkan terbaru di atas
        const sorted = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sorted);
      } catch (error) {
        console.error("Gagal mengambil notifikasi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchNotifications();
    }
  }, [user]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(notifications.map((n) => n.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      alert("Pilih notifikasi yang ingin dihapus.");
      return;
    }

    if (!window.confirm(`Hapus ${selected.length} notifikasi?`)) return;

    try {
      await Promise.all(
        selected.map((id) =>
          axios.delete(
            `${process.env.APP_URL}/notifications/${id}/${user.userId}`,
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          )
        )
      );
      setNotifications((prev) => prev.filter((n) => !selected.includes(n.id)));
      setSelected([]);
    } catch (error) {
      alert("Gagal menghapus notifikasi.");
      console.error("❌ Delete error:", error);
    }
  };

  const toggleCheckboxMode = () => {
    if (showCheckbox) {
      setSelected([]);
    }
    setShowCheckbox((prev) => !prev);
  };

  // 🔹 Fungsi untuk mengelompokkan notifikasi berdasarkan tanggal
  const groupNotificationsByDate = (data = []) => {
    return data.reduce((groups, notif) => {
      const date = new Date(notif.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notif);
      return groups;
    }, {});
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📩 Notifikasi</h2>
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

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-muted">Belum ada notifikasi.</p>
      ) : (
        <div>
          {showCheckbox && (
            <div className="mb-2">
              <input
                type="checkbox"
                className="form-check-input me-2"
                checked={selected.length === notifications.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              Pilih Semua
            </div>
          )}

          {Object.keys(groupedNotifications).map((date) => (
            <div key={date} className="mb-4">
              <h5 className="bg-light p-2 rounded">{date}</h5>
              <ul className="list-group shadow-sm">
                {groupedNotifications[date].map((notif) => (
                  <li
                    key={notif.id}
                    className="list-group-item d-flex align-items-start"
                  >
                    {showCheckbox && (
                      <input
                        type="checkbox"
                        className="form-check-input me-3 mt-1"
                        checked={selected.includes(notif.id)}
                        onChange={() => handleSelect(notif.id)}
                      />
                    )}
                    <div className="flex-grow-1">
                      <div>{notif.message}</div>
                      <small className="text-muted">
                        {new Date(notif.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotifikasiPage;
