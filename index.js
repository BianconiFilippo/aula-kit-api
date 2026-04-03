require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRouter = require("./src/routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Main Router API
app.use("/api", apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});