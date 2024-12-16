import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client"; // Import Prisma Client

/* ROUTE IMPORTS */
import dashboardRoutes from "./routes/dashboardRoutes";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import expenseRoutes from "./routes/expenseRoutes";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* DATABASE CONNECTION */
const prisma = new PrismaClient();

// Function to connect to the database
async function connectToDatabase() {
  try {
    console.log("Attempting to connect to the database...");
    await prisma.$connect();
    console.log("✅ Connected to the database successfully.");
  } catch (error) {
    console.error("❌ Error connecting to the database:", error);
    process.exit(1); // Exit the server if the connection fails
  }
}

/* ROUTES */
app.use("/dashboard", dashboardRoutes); // http://localhost:8000/dashboard
app.use("/products", productRoutes); // http://localhost:8000/products
app.use("/users", userRoutes); // http://localhost:8000/users
app.use("/expenses", expenseRoutes); // http://localhost:8000/expenses

/* SERVER */
async function startServer() {
  await connectToDatabase(); // Ensure the database is connected before starting the server

  const port = Number(process.env.PORT) || 8000;
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  /* Graceful Shutdown Handlers */
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received. Closing server...");
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await prisma.$disconnect();
        console.log("Disconnected from the database.");
      } catch (error) {
        console.error("Error disconnecting from the database:", error);
      }
    });
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT signal received. Closing server...");
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await prisma.$disconnect();
        console.log("Disconnected from the database.");
      } catch (error) {
        console.error("Error disconnecting from the database:", error);
      }
    });
  });
}

startServer()
  .then(async () => {
    await prisma.$disconnect(); // Ensure disconnection if the main function completes successfully
  })
  .catch(async (e) => {
    console.error("Error occurred:", e);
    await prisma.$disconnect();
    process.exit(1); // Exit the server if there's an unhandled error
  });

