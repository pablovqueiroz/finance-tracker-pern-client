import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { API_URL, AUTH_STATE_PATH, WEB_URL } from "./support/environment";
import { createTestData } from "./support/testData";

setup("create the isolated authenticated session", async ({
  request,
}, testInfo) => {
  const data = createTestData(testInfo.workerIndex);
  const registration = await request.post(`${API_URL}/auth/register`, {
    data: {
      name: data.user.name,
      email: data.user.email,
      password: data.user.password,
      confirmPassword: data.user.password,
      gender: data.user.gender,
    },
  });
  expect(registration.status()).toBe(201);

  const login = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: data.user.email,
      password: data.user.password,
    },
  });
  expect(login.status()).toBe(200);
  const body = await login.json();

  await mkdir(path.dirname(AUTH_STATE_PATH), { recursive: true });
  await writeFile(
    AUTH_STATE_PATH,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: WEB_URL,
          localStorage: [
            { name: "authToken", value: body.authToken },
            { name: "authUser", value: JSON.stringify(body.user) },
          ],
        },
      ],
    }),
    "utf8",
  );
});
