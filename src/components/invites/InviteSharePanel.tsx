import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaWindowClose } from "react-icons/fa";
import { IoCopyOutline, IoLogoWhatsapp } from "react-icons/io5";
import { MdOutlineMailOutline, MdOutlineTextsms } from "react-icons/md";
import {
  buildInviteMailtoLink,
  buildInviteShareMessage,
  buildInviteShareSubject,
  buildInviteSmsLink,
  buildInviteWhatsAppLink,
  INVITE_SITE_URL,
  type InviteSharePayload,
} from "../../utils/inviteShare";
import styles from "./Invites.module.css";

type InviteSharePanelProps = {
  payload: InviteSharePayload;
  onClose: () => void;
};

function InviteSharePanel({ payload, onClose }: InviteSharePanelProps) {
  const { t } = useTranslation();
  const [copyFeedback, setCopyFeedback] = useState("");
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";

  const message = useMemo(
    () => buildInviteShareMessage(t, payload),
    [payload, t],
  );
  const subject = useMemo(
    () => buildInviteShareSubject(t, payload),
    [payload, t],
  );
  const mailtoLink = useMemo(
    () => buildInviteMailtoLink(subject, message, payload.recipientEmail),
    [message, payload.recipientEmail, subject],
  );
  const smsLink = useMemo(() => buildInviteSmsLink(message), [message]);
  const whatsappLink = useMemo(
    () => buildInviteWhatsAppLink(message),
    [message],
  );

  useEffect(() => {
    if (!copyFeedback) return;

    const timeout = window.setTimeout(() => setCopyFeedback(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyFeedback(t("invites.share.copySuccess"));
    } catch (error) {
      console.error("Failed to copy invite message", error);
      setCopyFeedback(t("invites.share.copyFallback"));
    }
  }

  async function handleNativeShare() {
    if (!canNativeShare) return;

    try {
      await navigator.share({
        title: subject,
        text: message,
        url: INVITE_SITE_URL,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Failed to open native share", error);
    }
  }

  return (
    <div
      className={styles.shareModalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <section
        className={styles.shareModal}
        aria-label={t("invites.share.title")}
        aria-modal="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.shareHeader}>
          <div className={styles.shareHeaderContent}>
            <p className={styles.shareTitle}>{t("invites.share.title")}</p>
            <p className={styles.shareSubtitle}>{t("invites.share.subtitle")}</p>
          </div>
          <button
            className={styles.shareClose}
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <FaWindowClose aria-hidden="true" />
          </button>
        </div>

        <span className={styles.shareRecipient}>
          {t("invites.share.recipient", { email: payload.recipientEmail })}
        </span>

        <label className={styles.sharePreviewLabel} htmlFor="invite-share-preview">
          {t("invites.share.previewLabel")}
        </label>
        <textarea
          id="invite-share-preview"
          className={`ui-control ${styles.sharePreview}`}
          value={message}
          readOnly
        />

        <div className={styles.shareActions}>
          <button
            className={`${styles.shareActionBtn} ui-btn`}
            type="button"
            onClick={handleCopy}
          >
            <IoCopyOutline aria-hidden="true" />
            {t("invites.share.copy")}
          </button>
          <a
            className={`${styles.secondaryBtn} ${styles.shareActionBtn} ui-btn`}
            href={mailtoLink}
          >
            <MdOutlineMailOutline aria-hidden="true" />
            {t("invites.share.email")}
          </a>
          {isMobile ? (
            <a
              className={`${styles.secondaryBtn} ${styles.shareActionBtn} ui-btn`}
              href={smsLink}
            >
              <MdOutlineTextsms aria-hidden="true" />
              {t("invites.share.sms")}
            </a>
          ) : null}
          {isMobile ? (
            <a
              className={`${styles.secondaryBtn} ${styles.shareActionBtn} ${styles.whatsappBtn} ui-btn`}
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
            >
              <IoLogoWhatsapp aria-hidden="true" />
              {t("invites.share.whatsApp")}
            </a>
          ) : null}
          {canNativeShare ? (
            <button
              className={`${styles.secondaryBtn} ${styles.shareActionBtn} ui-btn`}
              type="button"
              onClick={() => void handleNativeShare()}
            >
              {t("invites.share.more")}
            </button>
          ) : null}
        </div>

        {copyFeedback ? (
          <p className={styles.shareFeedback} role="status">
            {copyFeedback}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default InviteSharePanel;
