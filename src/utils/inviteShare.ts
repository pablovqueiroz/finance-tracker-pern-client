import type { TFunction } from "i18next";

export const INVITE_SITE_URL = "https://budgetivo.vercel.app";

export type InviteSharePayload = {
  accountName: string;
  inviterName: string;
  recipientEmail: string;
};

export function buildInviteShareMessage(
  t: TFunction,
  payload: InviteSharePayload,
) {
  return [
    t("invites.share.messageIntro", {
      inviterName: payload.inviterName,
      accountName: payload.accountName,
    }),
    t("invites.share.messageOpen", { url: INVITE_SITE_URL }),
    t("invites.share.messageCreateAccount"),
    t("invites.share.messageAccept"),
  ].join("\n");
}

export function buildInviteShareSubject(
  t: TFunction,
  payload: InviteSharePayload,
) {
  return t("invites.share.subject", { accountName: payload.accountName });
}

export function buildInviteMailtoLink(
  subject: string,
  body: string,
  recipientEmail?: string,
) {
  const query = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${recipientEmail ?? ""}?${query.toString()}`;
}

export function buildInviteSmsLink(message: string) {
  return `sms:?&body=${encodeURIComponent(message)}`;
}

export function buildInviteWhatsAppLink(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
