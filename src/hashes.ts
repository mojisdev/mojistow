import type { HonoEnv } from "./types";
import { arktypeValidator } from "@hono/arktype-validator";
import { type } from "arktype";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "./middlewares/auth";

export const HASHES_ROUTER = new Hono<HonoEnv>().basePath("/hashes");

function getKVPrefix(env: string): string {
  return env === "production" ? "prod" : env === "preview" ? "preview" : "dev";
}

HASHES_ROUTER.get("/", async (c) => {
  const result = await c.env.MOJIS_HASHES.list({
    prefix: getKVPrefix(c.env.ENVIRONMENT),
  });

  const keys = result.keys.map((h) => h.name);

  // fetch all hashes
  const hashes = await Promise.all(keys.map(async (key) => {
    const hash = await c.env.MOJIS_HASHES.get(key);
    return {
      version: key.split(":")[1],
      hash,
    };
  }));

  return c.json(hashes);
});

HASHES_ROUTER.get("/:version", async (c) => {
  const version = c.req.param("version");

  const hash = await c.env.MOJIS_HASHES.get(`${getKVPrefix(c.env.ENVIRONMENT)}:${version}`);

  if (hash == null) {
    throw new HTTPException(404, {
      message: "Hash not found",
    });
  }

  return c.json({
    hash,
  });
});

HASHES_ROUTER.post(
  "/:version",
  authMiddleware,
  arktypeValidator("json", type({
    hash: type("string"),
  })),
  async (c) => {
    const version = c.req.param("version");
    const { hash } = c.req.valid("json");

    await c.env.MOJIS_HASHES.put(`${getKVPrefix(c.env.ENVIRONMENT)}:${version}`, hash);

    return c.json({
      hash,
    });
  },
);
