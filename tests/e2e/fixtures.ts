import { readFile } from "node:fs/promises";
import {
  request as createRequestContext,
  test as base,
  expect,
  type APIRequestContext,
} from "@playwright/test";
import { API_URL, AUTH_STATE_PATH } from "./support/environment";
import {
  createTestData,
  type E2ETestData,
} from "./support/testData";

type Fixtures = {
  api: APIRequestContext;
  testData: E2ETestData;
};

type AuthState = {
  authToken: string;
  authUser: string;
};

async function readAuthState(): Promise<AuthState> {
  const state = JSON.parse(await readFile(AUTH_STATE_PATH, "utf8"));
  const entries = state.origins
    ?.flatMap((origin: { localStorage?: Array<{ name: string; value: string }> }) =>
      origin.localStorage ?? [],
    );
  const authToken = entries?.find(
    (entry: { name: string }) => entry.name === "authToken",
  )?.value;
  const authUser = entries?.find(
    (entry: { name: string }) => entry.name === "authUser",
  )?.value;

  if (!authToken || !authUser) {
    throw new Error(
      "Authenticated E2E storage state does not contain authToken and authUser.",
    );
  }

  return { authToken, authUser };
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, provide) => {
    const authState = await readAuthState();
    await page.addInitScript((state: AuthState) => {
      localStorage.setItem("authToken", state.authToken);
      localStorage.setItem("authUser", state.authUser);
    }, authState);
    await provide(page);
  },
  testData: async ({ browserName }, provide, testInfo) => {
    void browserName;
    await provide(createTestData(testInfo.workerIndex));
  },
  api: async ({ browserName }, provide) => {
    void browserName;
    const { authToken } = await readAuthState();
    const api = await createRequestContext.newContext({
      baseURL: `${API_URL}/`,
      extraHTTPHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    await provide(api);
    await api.dispose();
  },
});

test.use({ storageState: AUTH_STATE_PATH });

export { expect };
