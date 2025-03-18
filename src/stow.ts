import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { parseTarGzip } from "nanotar";
import { authMiddleware } from "./middlewares/auth";

export const STOW_ROUTER = new Hono().basePath("/stow");

STOW_ROUTER.post(
  "/:version",
  authMiddleware,
  async (c) => {
    const { version } = c.req.param();
    const body = await c.req.parseBody();

    const file = Array.isArray(body.file) ? body.file[0] : body.file;

    if (file == null) {
      throw new HTTPException(400, {
        message: "No file uploaded",
      });
    }

    if (typeof file === "string") {
      throw new HTTPException(400, {
        message: "invalid file uploaded",
      });
    }

    const tar = await parseTarGzip(await file.arrayBuffer(), {
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
      if (entry.type !== "file") continue;
      const normalizedEntryName = entry.name.replace("./", "");
      const res = await c.env.EMOJI_DATA.put(`${version}/${normalizedEntryName}`, entry.text);
      // eslint-disable-next-line no-console
      console.info({ key: res?.key, version: res?.version, uploaded: res?.uploaded, size: res?.size });
    }

    return c.json({
      message: "Uploaded",
    });
  },
);
