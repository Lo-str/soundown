import jwt from "jsonwebtoken";

// Grabing JWT_SECRET from .env
const SECRET = process.env.JWT_SECRET as string;

// Data shape
interface TokenPayload {
  userId: string;
  role: "artist" | "listener" | "both";
}

// SIGN - Create and returns a token
export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload, // data that will seal inside
    SECRET, // secret key used to seal it
    { expiresIn: "7d" }, // token expires after 7 days. After that user must login again
  );
};

// VERIFY - checks a token and returns what's inside
// jwt.verify() throws automatically if the token is invalid or expired. Error handler takes over if ever.
export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, SECRET) as TokenPayload;
