import express from "express";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3000;
app.use(express.json());

// Routes

app.use(errorHandler);
app.listen(PORT, () => console.log(`Server listens on port ${PORT}`));
