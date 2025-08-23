// src/components/NotificationPopup.jsx
import React, { useEffect, useState, useRef } from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import { io } from "socket.io-client";
import axios from "axios";

export default function NotificationPopup({ userId, token }) {
  const [toasts, setToasts] = useState([]); // array untuk menampung beberapa notif
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) {
    console.warn("NotificationPopup: userId tidak ada atau kosong");
    return;
  }

  console.log("NotificationPopup: userId =", userId);

    const SOCKET_URL = process.env.REACT_APP_API_URL;

    const socket = io(SOCKET_URL, {
      auth: { token }, // optional: pakai untuk handshake auth
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
      socket.emit("join", userId);
    });

    socket.on("notification", (data) => {
      console.log("Notification received", data);
      if (!data.isRead) {
        setToasts((prev) => [{ ...data, _key: Date.now() + Math.random() }, ...prev]);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, token]);

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error("Gagal mark as read:", err);
    }
  };

  const handleClose = async (toast) => {
    if (toast?.id) await markAsRead(toast.id);
    setToasts((prev) => prev.filter((t) => t._key !== toast._key));
  };

  if (!userId) return null;

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast._key}
          onClose={() => handleClose(toast)}
          autohide
          delay={6000}
        >
          <Toast.Header>
            <strong className="me-auto">Notifikasi Baru</strong>
            <small>{new Date(toast.createdAt).toLocaleTimeString()}</small>
          </Toast.Header>
          <Toast.Body>
            <div>{toast.message}</div>
            <div className="mt-2">
              <small className="text-muted">Dari: {toast.service || "System"}</small>
            </div>
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
