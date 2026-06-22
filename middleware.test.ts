import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { middleware } from "./src/middleware";

const secret = "middleware-test-secret";

test("middleware lives beside the src app so Next.js includes it in production", () => {
  assert.equal(existsSync("src/middleware.ts"), true);
  assert.equal(existsSync("middleware.ts"), false);
});

test("middleware redirects an invalid session token", async () => {
  process.env.NEXTAUTH_SECRET = secret;
  const request = new NextRequest("http://localhost/dashboard", {
    headers: { cookie: "ai_material_box_session=invalid" }
  });

  const response = await middleware(request);

  assert.equal(response.headers.get("location"), "http://localhost/login");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("middleware allows a verified session token", async () => {
  process.env.NEXTAUTH_SECRET = secret;
  const token = await new SignJWT({ sub: "user-1" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
  const request = new NextRequest("http://localhost/dashboard", {
    headers: { cookie: `ai_material_box_session=${token}` }
  });

  const response = await middleware(request);

  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("middleware forwards a public locale without blocking indexing", async () => {
  const response = await middleware(new NextRequest("http://localhost/en"));

  assert.equal(response.headers.get("x-robots-tag"), null);
  assert.equal(response.headers.get("x-middleware-request-x-atlora-locale"), "en");
});

test("middleware marks utility routes as noindex", async () => {
  const response = await middleware(new NextRequest("http://localhost/login"));

  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(response.headers.get("x-middleware-request-x-atlora-locale"), "zh");
});

test("middleware forwards a stored application language", async () => {
  const request = new NextRequest("http://localhost/login", {
    headers: { cookie: "atlora-ui-language=en" }
  });

  const response = await middleware(request);

  assert.equal(response.headers.get("x-middleware-request-x-atlora-locale"), "en");
});
