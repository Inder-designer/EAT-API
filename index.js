const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const adminRoute = require("./routes/admin/admin");
const attendanceRoute = require("./routes/attendanceRoute");
const taskRoute = require("./routes/task");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

dotenv.config();
const PORT = 8800;

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
  })
  .then(() => console.log("DB is Connected"))
  .catch((err) => console.log(err));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  const currentUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const apiDocsUrl = `${currentUrl}api-docs`;
  console.log(apiDocsUrl, "url");
  const htmlResponse = `<div style="padding:10px 20px;">
                          <h2>Hello, Welcome to EAT-API</h2>
                          <p>Click Here for Swagger Docs</p>
                          <a style="background-color: #0bb7ff;color: white;padding: 7px 15px;border-radius: 5px;text-decoration: none;"  href="${apiDocsUrl}">
                            API Docs
                          </a>
                        <div>`;
  res.send(htmlResponse);
});

// Swagger Options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.1.0",
    info: {
      title: "Your API Title",
      description: "Your API Description",
      version: "1.0.0",
      securityDefinitions: {
        Bearer: {
          type: "http",
          name: "Authorization",
          in: "header",
          description: "JWT Authorization header using the Bearer scheme.",
        },
      },
    },
  },
  apis: ["./routes/*.js", "./routes/**/*.js"], // Path to the API routes
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Your API routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/task", taskRoute);

// Serve HTML file
app.use(express.static("public"));

// Handle /accept path
app.get("/accept", (req, res) => {
  const { token } = req.query;
  res.sendFile(path.join(__dirname, "/public/accept.html"));
});

app.listen(PORT, () => {
  console.log("Backend Server is running!");
  console.log(`http://localhost:${PORT}/api-docs`);
});
