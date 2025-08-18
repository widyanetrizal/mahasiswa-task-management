import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";

const ProgressPage = () => {
  const { user } = useAuth();
//   const { taskId, groupId } = useParams();
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProgress = useCallback(async () => {
    try {
      if (!user || !user.userId) {
        console.warn("User belum tersedia");
        return;
      }

      const response = await axios.get(
        `http://localhost:8081/progress/user/${user.userId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log("✅ Data progress diterima:", response.data);
      setProgressList(response.data);
      console.log("✅ Data progress diterima:", response.data);
    } catch (error) {
      console.error("❌ Gagal mengambil data progress:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log("🔍 user", user);
    fetchProgress();
  }, [fetchProgress, user]); // Tambahkan [user] agar dipanggil setelah user tersedia

  const handleInfoClick = (item) => {
    if (item.taskType === "Group") {
      navigate(`/dashboard/mahasiswa/task-kelompok/groups/${item.groupId}/tasks/${item.taskId}/edit`);
    } else if (item.taskType === "Individual") {
      navigate(`/dashboard/mahasiswa/task-individu/${item.taskId}/info`);
      
    }
  };

  return (
    <div className="container mt-4">
      <h2>Progress Tugas</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered mt-3">
            <thead className="table-dark">
              <tr>
                <th>No</th>
                <th>Jenis Tugas</th>
                <th>ID Tugas</th>
                <th>Progress</th>
                <th>Status</th>
                {/* <th>Pesan</th>
                <th>Komentar</th> */}
                <th>Waktu</th>
                <th>Info</th>
              </tr>
            </thead>
            <tbody>
              {progressList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">
                    Belum ada data progress.
                  </td>
                </tr>
              ) : (
                progressList.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.taskType}</td>
                    <td>{item.taskId}</td>
                    <td>{item.progress}%</td>
                    <td>{item.status}</td>
                    {/* <td>{item.message || "-"}</td>
                    <td>{item.comment || "-"}</td> */}
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="text-center">
                      {/* ✅ Tombol Info */}
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleInfoClick(item)}
                      >
                        Info
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
