const app = require("./app");

const PORT = 4005;

app.listen(PORT, () => {
  console.log("Logging Service listening on port", PORT);
});
