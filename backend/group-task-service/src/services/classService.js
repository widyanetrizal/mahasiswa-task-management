// utils/classService.js
const axios = require("axios");

async function getMahasiswaInClass(classId, token) {
  try {
    const res = await axios.get(`http://class-service:4006/class/${classId}/members`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // res.data.members = semua anggota kelas
    // filter hanya mahasiswa (role: "Mahasiswa")
    const mahasiswa = (res.data.members || []).filter(
      (member) => member.role === "Mahasiswa"
    );

    return mahasiswa; // array objek mahasiswa lengkap
  } catch (err) {
    console.error("Error getMahasiswaInClass:", err.message);
    return [];
  }
}

module.exports = { getMahasiswaInClass };
