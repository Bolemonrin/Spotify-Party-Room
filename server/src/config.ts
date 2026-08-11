import "dotenv/config";

export const isProduction = process.env.NODE_ENV === "production";

/**
 * Where the browser app is served from. Used for the CORS allow-list and for
 * the post-OAuth redirect — in production the callback lands on the API host,
 * so redirecting to "/" would leave the user on the API rather than the app.
 */
export const frontendUrl = process.env.FRONTEND_URL ?? "http://127.0.0.1:3000";

export const port = Number(process.env.PORT ?? 3000);
