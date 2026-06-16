import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const secret = "middleware-test-secret";

test("middleware redirects an invalid session token", async () => {
  process.env.NEXTAUTH_SECRET = secret;
  const request = new NextRequest("http://localhost/dashboard", {
    headers: { cookie: "ai_material_box_session=invalid" }
  });

  const response = await middleware(request);

  assert.equal(response.headers.get("location"), "http://localhost/login");
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
});
