import type { HonoEnv } from "./types";
import { arktypeValidator } from "@hono/arktype-validator";
import { type } from "arktype";
import { Hono } from "hono";
import { authMiddleware } from "./middlewares/auth";

export const HASHES_ROUTER = new Hono<HonoEnv>().basePath("/hashes");

function getKVPrefix(env: string): string {
  return env === "production" ? "prod" : env === "preview" ? "preview" : "dev";
}

HASHES_ROUTER.get("/:version", async (c) => {
  const result = await c.env.MOJIS_HASHES.list({
    prefix: `${getKVPrefix(c.env.ENVIRONMENT)}:${c.req.param("version")}`,
  });

  const keys = result.keys.map((h) => h.name);

  // fetch all hashes
  const hashes = await Promise.all(keys.map(async (key) => {
    const hash = await c.env.MOJIS_HASHES.get(key);

    if (hash == null) return null;

    const [_env, version, item] = key.split(":");
    return {
      version,
      hash,
      item,
    };
  }));

  return c.json(hashes.filter((h) => h != null));
});

HASHES_ROUTER.post(
  "/",
  authMiddleware,
  arktypeValidator("json", type({
    version: "string",
    item: "string?",
    hash: "string",
  })),
  async (c) => {
    const { version, item, hash } = c.req.valid("json");

    if (item != null) {
      await c.env.MOJIS_HASHES.put(`${getKVPrefix(c.env.ENVIRONMENT)}:${version}:${item}`, hash);
    } else {
      await c.env.MOJIS_HASHES.put(`${getKVPrefix(c.env.ENVIRONMENT)}:${version}`, hash);
    }

    return c.json({
      hash,
    });
  },
);
