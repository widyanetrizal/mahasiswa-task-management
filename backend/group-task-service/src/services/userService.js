const axios = require("axios");

const getUserById = async (userId, token) => {
  try {
    const response = await axios.get(
      `${process.env.USER_SERVICE_URL}/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("User tidak valid.");
  }
};

const getUserByEmail = async(email, expectedRole, token) => {
  try {
    const response = await axios.get(
      `${process.env.USER_SERVICE_URL}/users/email/${email}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const user = response.data;

    if (expectedRole && user.role !== expectedRole) {
      throw new Error(`Email bukan milik ${expectedRole}`);
    }

    return user;
  } catch (error) {
    if (error.response) {
      throw new Error(`User-service error: ${error.response.data?.error || error.message}`);
    } else if (error.request) {
      throw new Error("User-service tidak merespons");
    } else {
      throw new Error("Gagal mengambil data user");
    }
  }
}

module.exports = { getUserById, getUserByEmail };
