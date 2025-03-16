import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization");
  if (token == null) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  if (c.env.MOJIS_TOKEN.trim() == null || c.env.MOJIS_TOKEN.trim() === "") {
    throw new HTTPException(500, {
      message: "Internal server error",
    });
  }

  if (token !== c.env.MOJIS_TOKEN) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  await next();
});
