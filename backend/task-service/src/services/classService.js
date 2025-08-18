const axios = require("axios");

const getMahasiswaInClass = async (classId, token) => {
  try {
    const response = await axios.get(`http://class-service:4006/class/${classId}`, {
    // const response = await axios.get(`http://class-service:4006/class/${classId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.class?.members || [];
  } catch (error) {
    console.error("Gagal mengambil mahasiswa dari class-service:", error.message);
    return [];
  }
};

module.exports = { getMahasiswaInClass };
