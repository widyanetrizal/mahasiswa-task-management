const getDeadlineStatus = (deadline, status) => {
  const now  = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === "Done") return "Selesai";

  if (diffDays > 0) {
    return `H-${diffDays}`;
  } else if (diffDays === 0) {
    return "Hari ini";
  } else {
    return `Terlambat ${Math.abs(diffDays)} hari`;
  }
};

module.exports = { getDeadlineStatus };
