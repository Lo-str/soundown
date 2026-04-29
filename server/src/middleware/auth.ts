import { AppError } from "../lib/AppError";
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

const auth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header) {
    throw new AppError("Unauthorized", 401);
  }
  const token = header.replace("Bearer ", "");
  const payload = verifyToken(token);
  req.user = payload;
};
