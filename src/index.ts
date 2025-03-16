import type { ApiError, HonoEnv } from "./types";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { HTTPException } from "hono/http-exception";
import { HASHES_ROUTER } from "./hashes";
import { STOW_ROUTER } from "./stow";

const app = new Hono<HonoEnv>();

app.get(
  "*",
  cache({
    cacheName: "mojistow",
    cacheControl: "max-age=3600",
  }),
);

app.route("/", HASHES_ROUTER);
app.route("/", STOW_ROUTER);

app.onError(async (err, c) => {
  console.error(err);
  const url = new URL(c.req.url);
  if (err instanceof HTTPException) {
    return c.json({
      path: url.pathname,
      status: err.status,
      message: err.message,
      timestamp: new Date().toISOString(),
    } satisfies ApiError, err.status);
  }

  return c.json({
    path: url.pathname,
    status: 500,
    message: "Internal server error",
    timestamp: new Date().toISOString(),
  } satisfies ApiError, 500);
});

app.notFound(async (c) => {
  const url = new URL(c.req.url);
  return c.json({
    path: url.pathname,
    status: 404,
    message: "Not found",
    timestamp: new Date().toISOString(),
  } satisfies ApiError, 404);
});

export default app;
