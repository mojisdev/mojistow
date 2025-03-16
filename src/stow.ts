import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { parseTarGzip } from "nanotar";
import { authMiddleware } from "./middlewares/auth";

export const STOW_ROUTER = new Hono().basePath("/stow");

STOW_ROUTER.post("/upload", authMiddleware, async (c) => {
  const body = await c.req.parseBody({ all: true });

  const file = Array.isArray(body["file[]"]) ? body["file[]"] : [body["file[]"]];

  if (file.length === 0) {
    throw new HTTPException(400, {
      message: "No file uploaded",
    });
  }

  for (const f of file) {
    if (typeof f === "string") {
      continue;
    }

    const tar = await parseTarGzip(await f.arrayBuffer(), {
      filter(file) {
        // if file is pax header, return false
        if (Number.isNaN(file.type)) return false;
        if (file.name.includes("PaxHeader")) return false;
        // some files is prefixed with ._, ignore them
        if (file.name.includes("._")) return false;
        return true;
      },
    });

    for (const entry of tar) {
      // eslint-disable-next-line no-console
      console.info(entry.type, entry.name);
    }
  }

  return c.json({
    message: "Uploaded",
  });
});
