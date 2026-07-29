import {
  expect,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test";
import { API_URL } from "./environment";

type UserData = {
  name: string;
  email: string;
  password: string;
  gender?: string;
};

export async function registerUser(
  request: APIRequestContext,
  user: UserData,
): Promise<APIResponse> {
  return request.post(`${API_URL}/auth/register`, {
    data: {
      ...user,
      confirmPassword: user.password,
    },
  });
}

export async function loginUser(
  request: APIRequestContext,
  user: Pick<UserData, "email" | "password">,
) {
  const response = await request.post(`${API_URL}/auth/login`, { data: user });
  expect(response.status()).toBe(200);
  return response.json();
}

export async function deleteUser(
  request: APIRequestContext,
  token: string,
  password: string,
) {
  const response = await request.delete(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { password },
  });
  expect(response.status()).toBe(200);
}

export async function createAccount(
  request: APIRequestContext,
  token: string,
  account: { name: string; description: string; currency: string },
) {
  const response = await request.post(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    data: account,
  });
  expect(response.status()).toBe(201);
  return response.json();
}

export async function deleteAccount(
  request: APIRequestContext,
  token: string,
  accountId: string,
) {
  const response = await request.delete(`${API_URL}/accounts/${accountId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
}
