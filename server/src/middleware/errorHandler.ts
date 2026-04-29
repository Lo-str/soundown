import { AppError } from "../lib/AppError";
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  err instanceof AppError
    ? res.status(err.statusCode).json({ message: err.message })
    : res.status(500).json({ message: "Internal server error" });
};
