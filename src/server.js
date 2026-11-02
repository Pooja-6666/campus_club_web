const dotenv = require("dotenv");
const path = require("path");

const envPath = path.resolve(__dirname, "..", ".env");

dotenv.config({ path: envPath, override: true });

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});