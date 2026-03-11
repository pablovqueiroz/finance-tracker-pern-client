import type { AccountRole, Currency } from "./account.types";

export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";

export type InviteAccount = {
  id: string;
  name: string;
  currency?: Currency;
};

export type InviteSender = {
  id: string;
  name: string;
  email: string;
};

export type AccountInvite = {
  id: string;
  email: string;
  token: string;
  accountId: string;
  role: AccountRole;
  status: InviteStatus;
  invitedById: string;
  expiresAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  account?: InviteAccount;
  invitedBy?: InviteSender;
};
