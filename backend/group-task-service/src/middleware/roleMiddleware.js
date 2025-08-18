// function onlyMahasiswa(req, res, next) {
//   if (req.user.role !== "Mahasiswa")
//     return res.status(403).json({ message: "Akses hanya untuk Mahasiswa" });
//   next();
// }

// function onlyDosen(req, res, next) {
//   if (req.user.role !== "Dosen")
//     return res.status(403).json({ message: "Akses hanya untuk Dosen" });
//   next();
// }

// function onlyAdmin(req, res, next) {
//   if (req.user.role !== "Admin")
//     return res.status(403).json({ message: "Akses hanya untuk Admin" });
//   next();
// }

// function allowDosenAndMahasiswa(req, res, next) {
//   if (["Dosen", "Mahasiswa"].includes(req.user.role)) return next();
//   res.status(403).json({ message: "Akses hanya untuk Dosen/Mahasiswa" });
// }

// module.exports = {
//   onlyMahasiswa,
//   onlyDosen,
//   onlyAdmin,
//   allowDosenAndMahasiswa,
// };
