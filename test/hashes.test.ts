import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import worker from "../src";

interface StoredHash {
  key: string;
  value: string;
}

async function storeHashes(hashes: StoredHash[]) {
  await Promise.all(hashes.map((hash) => env.MOJIS_HASHES.put(hash.key, hash.value)));
}

beforeAll(async () => {
  await env.EMOJI_DATA.put("v15.1/groups.json", JSON.stringify([
    {
      name: "Smileys & Emotion",
      slug: "smileys-emotion",
      subgroups: [
        "face-smiling",
        "face-affection",
        "face-tongue",
        "face-hand",
        "face-neutral-skeptical",
        "face-sleepy",
        "face-unwell",
        "face-hat",
        "face-glasses",
        "face-concerned",
        "face-negative",
        "face-costume",
        "cat-face",
        "monkey-face",
        "heart",
        "emotion",
      ],
    },
  ]));
});

describe("hashes Router", () => {
  it("should return empty array when no hashes exist", async () => {
    const request = new Request("https://mojistow.mojis.dev/hashes/v1");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("should return hashes for a specific version", async () => {
    await storeHashes([
      { key: "prod:v1:item1", value: "hash1" },
      { key: "prod:v1:item2", value: "hash2" },
    ]);

    const request = new Request("https://mojistow.mojis.dev/hashes/v1");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { version: "v1", hash: "hash1", item: "item1" },
      { version: "v1", hash: "hash2", item: "item2" },
    ]);
  });

  it("should store a hash with an item", async () => {
    const ctx = createExecutionContext();

    const getRequest = new Request("https://mojistow.mojis.dev/hashes/v1");
    const getResponse = await worker.fetch(getRequest, env, ctx);

    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual([]);

    const postRequest = new Request("https://mojistow.mojis.dev/hashes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "test-token",
      },
      body: JSON.stringify({
        version: "v1",
        item: "test-item",
        hash: "test-hash",
      }),
    });

    const postResponse = await worker.fetch(postRequest, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(postResponse.status).toBe(200);
    expect(await postResponse.json()).toEqual({ hash: "test-hash" });
  });

  it("should store a hash without an item", async () => {
    const ctx = createExecutionContext();

    const getRequest = new Request("https://mojistow.mojis.dev/hashes/v1");
    const getResponse = await worker.fetch(getRequest, env, ctx);

    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual([]);

    const postRequest = new Request("https://mojistow.mojis.dev/hashes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "test-token",
      },
      body: JSON.stringify({
        version: "v1",
        hash: "test-hash",
      }),
    });

    const postResponse = await worker.fetch(postRequest, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(postResponse.status).toBe(200);
    expect(await postResponse.json()).toEqual({ hash: "test-hash" });
  });

  it("should return 401 when not authenticated", async () => {
    const request = new Request("https://mojistow.mojis.dev/hashes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "v1",
        hash: "test-hash",
      }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(401);
  });

  it("should return 400 when request body is invalid", async () => {
    const request = new Request("https://mojistow.mojis.dev/hashes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "test-token",
      },
      body: JSON.stringify({
        hash: "test-hash", // missing required version
      }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
  });
});
