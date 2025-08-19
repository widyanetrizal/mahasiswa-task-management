import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Tabs, Tab, Table, Button, Form } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

const LoggingPage = () => {
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const token = localStorage.getItem("token");

  const fetchLogs = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/logs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || "Gagal memuat data");
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const deleteLog = async (ids) => {
    const confirmDelete = window.confirm(
      `Apakah yakin ingin menghapus ${Array.isArray(ids) ? ids.length : 1} log?`
    );
    if (!confirmDelete) return;

    try {
      if (Array.isArray(ids)) {
        // === HAPUS BANYAK SECARA SEQUENTIAL AGAR AMAN ===
        for (const id of ids) {
          await axios.delete(`${process.env.REACT_APP_API_URL}/logs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        // Hapus dari state setelah semua selesai
        setLogs((prev) => prev.filter((log) => !ids.includes(log.id)));
        setSelectedLogs([]);
      } else {
        // Hapus satuan
        await axios.delete(`${process.env.REACT_APP_API_URL}/logs/${ids}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs((prev) => prev.filter((log) => log.id !== ids));
      }
    } catch (error) {
      alert("Gagal menghapus log: " + (error.response?.data?.message || ""));
    }
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedLogs([]); // reset pilihan saat keluar mode
  };

  const handleSelectOne = (id) => {
    setSelectedLogs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (data) => {
    if (selectedLogs.length === data.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(data.map((log) => log.id));
    }
  };

  const restApiLogs = logs.filter(
    (log) => log.channel?.toUpperCase() === "REST API"
  );
  const rabbitMqLogs = logs.filter(
    (log) => log.channel?.toUpperCase() === "RABBITMQ"
  );

  const safeRender = (value) => {
  if (value == null) return "-";
  if (typeof value === "string" || typeof value === "number") return value;
  try {
    return <pre>{JSON.stringify(value, null, 2)}</pre>;
  } catch {
    return String(value);
  }
};

  const renderMetadata = (metadata, channel) => {
  if (!metadata || typeof metadata !== "object") {
    return metadata; // fallback string/null
  }

  if (channel?.toUpperCase() === "REST API") {
    return (
      <div>
        <div><b>Method:</b> {metadata.method}</div>
        <div><b>URL:</b> {metadata.url}</div>
        <div><b>Status:</b> {metadata.statusCode}</div>
        <div><b>Duration:</b> {metadata.duration} ms</div>
        <div><b>Time:</b> {metadata.timestamp}</div>
      </div>
    );
  }

  if (channel?.toUpperCase() === "RABBITMQ") {
    return (
      <div>
        <div><b>Exchange:</b> {metadata.exchange}</div>
        <div><b>Queue:</b> {metadata.queue}</div>
        <div><b>Routing Key:</b> {metadata.routingKey}</div>
        <div><b>Payload:</b> {JSON.stringify(metadata.payload)}</div>
        <div><b>Duration:</b> {metadata.duration} ms</div>
        <div><b>Time:</b> {metadata.timestamp}</div>
      </div>
    );
  }

  // fallback kalau channel lain
  return <pre>{JSON.stringify(metadata, null, 2)}</pre>;
};


  const renderTable = (data, showEventType = false) => (
    <>
      {/* Toolbar */}
      <div className="mb-2 d-flex gap-2">
        <Button
          variant={selectMode ? "secondary" : "primary"}
          size="sm"
          onClick={toggleSelectMode}
        >
          {selectMode ? "Batal Pilih" : "Pilih"}
        </Button>
        {selectMode && selectedLogs.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteLog(selectedLogs)}
          >
            <FaTrash /> Hapus yang Dipilih ({selectedLogs.length})
          </Button>
        )}
      </div>

      <Table
        striped
        bordered
        hover
        size="sm"
        className="align-middle"
        style={{
          fontSize: "0.85rem",
          tableLayout: "fixed",
          width: "100%",
        }}
      >
        <thead className="table-light text-center">
          <tr>
            {selectMode && (
              <th style={{ width: "4%" }}>
                <Form.Check
                  type="checkbox"
                  checked={
                    selectedLogs.length === data.length && data.length > 0
                  }
                  onChange={() => handleSelectAll(data)}
                />
              </th>
            )}
            <th style={{ width: "5%" }}>No</th>
            <th style={{ width: "10%" }}>Service</th>
            <th style={{ width: "8%" }}>Level</th>
            {showEventType && <th style={{ width: "12%" }}>Event Type</th>}
            <th style={{ width: "25%" }}>Message</th>
            <th style={{ width: "25%" }}>Metadata</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
              colSpan={
                (selectMode ? 1 : 0) + (showEventType ? 6 : 5)
              }
              className="text-center"
            >
                Tidak ada log ditemukan
              </td>
            </tr>
          ) : (
            data.map((log, index) => (
              <tr key={log.id}>
                {selectMode && (
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={() => handleSelectOne(log.id)}
                    />
                  </td>
                )}
                <td className="text-center">{index + 1}</td>
                <td className="text-center">{log.service}</td>
                <td className="text-center">{log.level}</td>
                {showEventType && (
                <td className="text-center">{log.eventType}</td>
              )}
                <td
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {/* {log.message} */}

                  {safeRender(log.message)}
                  
                </td>
                <td
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {renderMetadata(log.metadata, log.channel)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Daftar Logging Service</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <Tabs defaultActiveKey="rest" id="log-tabs" className="mb-3">
        <Tab eventKey="rest" title="REST API">
          {renderTable(restApiLogs, false)}
        </Tab>
        <Tab eventKey="rabbit" title="RabbitMQ">
          {renderTable(rabbitMqLogs, true)}
        </Tab>
      </Tabs>
    </div>
  );
};

export default LoggingPage;
