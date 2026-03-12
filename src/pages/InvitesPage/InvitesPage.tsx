import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Skeleton from "../../components/Skeleton/Skeleton";
import SkeletonButton from "../../components/Skeleton/SkeletonButton";
import SkeletonCard from "../../components/Skeleton/SkeletonCard";
import SkeletonText from "../../components/Skeleton/SkeletonText";
import InviteForm from "../../components/invites/InviteForm";
import SentInvitesList from "../../components/invites/SentInvitesList";
import ReceivedInvitesList from "../../components/invites/ReceivedInvitesList";
import ExpiredInvitesList from "../../components/invites/ExpiredInvitesList";
import Message from "../../components/Message/Message";
import api from "../../services/api";
import type { AccountRole, AccountSummary } from "../../types/account.types";
import type { AccountInvite } from "../../types/invite.types";
import styles from "./InvitesPage.module.css";

type InviteFormRole = Extract<AccountRole, "ADMIN" | "MEMBER">;

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.errorMessage ??
      error.response?.data?.message ??
      fallback
    );
  }

  return fallback;
}

function InvitesPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [sentInvites, setSentInvites] = useState<AccountInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<AccountInvite[]>([]);
  const [expiredInvites, setExpiredInvites] = useState<AccountInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteFormRole>("MEMBER");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<
    "cancel" | "expire" | "accept" | "reject" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true);

      const response = await api.get<AccountSummary[]>("/accounts");
      const accountList = Array.isArray(response.data) ? response.data : [];
      const preferredAccountId = searchParams.get("accountId");

      setAccounts(accountList);
      setSelectedAccountId((currentValue) => {
        if (
          currentValue &&
          accountList.some((account) => account.id === currentValue)
        ) {
          return currentValue;
        }

        if (
          preferredAccountId &&
          accountList.some((account) => account.id === preferredAccountId)
        ) {
          return preferredAccountId;
        }

        return accountList[0]?.id ?? "";
      });
    } catch (error: unknown) {
      console.error("Failed to load accounts", error);
      setErrorMessage(getErrorMessage(error, t("invites.loadAccountsFailed")));
      setAccounts([]);
      setSelectedAccountId("");
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [searchParams, t]);

  const loadInvites = useCallback(async () => {
    try {
      setIsLoadingInvites(true);

      const [sentResponse, receivedResponse, expiredResponse] =
        await Promise.all([
          api.get<AccountInvite[]>("/invites/sent"),
          api.get<AccountInvite[]>("/invites/received"),
          api.get<AccountInvite[]>("/invites/expired"),
        ]);

      setSentInvites(Array.isArray(sentResponse.data) ? sentResponse.data : []);
      setReceivedInvites(
        Array.isArray(receivedResponse.data) ? receivedResponse.data : [],
      );
      setExpiredInvites(
        Array.isArray(expiredResponse.data) ? expiredResponse.data : [],
      );
      setErrorMessage(null);
    } catch (error: unknown) {
      console.error("Failed to load invites", error);
      setErrorMessage(getErrorMessage(error, t("invites.loadInvitesFailed")));
      setSentInvites([]);
      setReceivedInvites([]);
      setExpiredInvites([]);
    } finally {
      setIsLoadingInvites(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.all([loadAccounts(), loadInvites()]);
  }, [loadAccounts, loadInvites]);

  useEffect(() => {
    const preferredAccountId = searchParams.get("accountId");

    if (
      preferredAccountId &&
      accounts.some((account) => account.id === preferredAccountId)
    ) {
      setSelectedAccountId(preferredAccountId);
    }
  }, [accounts, searchParams]);

  async function handleSendInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !selectedAccountId) {
      setErrorMessage(t("invites.required"));
      return;
    }

    try {
      setIsSendingInvite(true);
      await api.post("/invites", {
        email: normalizedEmail,
        accountId: selectedAccountId,
        role,
      });
      setEmail("");
      setSuccessMessage(t("invites.sendSuccess"));
      setErrorMessage(null);
      await loadInvites();
    } catch (error: unknown) {
      console.error("Failed to send invite", error);
      setErrorMessage(getErrorMessage(error, t("invites.sendFailed")));
      setSuccessMessage(null);
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    const confirmation = window.confirm(t("invites.cancelConfirm"));
    if (!confirmation) return;

    try {
      setActiveInviteId(inviteId);
      setActiveAction("cancel");
      await api.patch(`/invites/${inviteId}/cancel`);
      setSuccessMessage(t("invites.cancelSuccess"));
      setErrorMessage(null);
      await loadInvites();
    } catch (error: unknown) {
      console.error("Failed to cancel invite", error);
      setErrorMessage(getErrorMessage(error, t("invites.cancelFailed")));
      setSuccessMessage(null);
    } finally {
      setActiveInviteId(null);
      setActiveAction(null);
    }
  }

  async function handleExpireInvite(inviteId: string) {
    const confirmation = window.confirm(t("invites.expireConfirm"));
    if (!confirmation) return;

    try {
      setActiveInviteId(inviteId);
      setActiveAction("expire");
      await api.patch(`/invites/${inviteId}/expire`);
      setSuccessMessage(t("invites.expireSuccess"));
      setErrorMessage(null);
      await loadInvites();
    } catch (error: unknown) {
      console.error("Failed to expire invite", error);
      setErrorMessage(getErrorMessage(error, t("invites.expireFailed")));
      setSuccessMessage(null);
    } finally {
      setActiveInviteId(null);
      setActiveAction(null);
    }
  }

  async function handleAcceptInvite(inviteId: string, token: string) {
    try {
      setActiveInviteId(inviteId);
      setActiveAction("accept");
      await api.post(`/invites/${token}/accept`);
      setSuccessMessage(t("invites.acceptSuccess"));
      setErrorMessage(null);
      await Promise.all([loadInvites(), loadAccounts()]);
    } catch (error: unknown) {
      console.error("Failed to accept invite", error);
      setErrorMessage(getErrorMessage(error, t("invites.acceptFailed")));
      setSuccessMessage(null);
    } finally {
      setActiveInviteId(null);
      setActiveAction(null);
    }
  }

  async function handleRejectInvite(inviteId: string, token: string) {
    const confirmation = window.confirm(t("invites.rejectConfirm"));
    if (!confirmation) return;

    try {
      setActiveInviteId(inviteId);
      setActiveAction("reject");
      await api.post(`/invites/${token}/reject`);
      setSuccessMessage(t("invites.rejectSuccess"));
      setErrorMessage(null);
      await loadInvites();
    } catch (error: unknown) {
      console.error("Failed to reject invite", error);
      setErrorMessage(getErrorMessage(error, t("invites.rejectFailed")));
      setSuccessMessage(null);
    } finally {
      setActiveInviteId(null);
      setActiveAction(null);
    }
  }

  const visibleSentInvites = sentInvites.filter(
    (invite) => invite.status !== "EXPIRED",
  );

  if (isLoadingAccounts && isLoadingInvites) {
    return (
      <div className={styles.pageContainer} aria-busy="true">
        <section className={`${styles.header} ui-card`}>
          <Skeleton width="24%" height={26} />
          <SkeletonText lines={1} widths={["52%"]} />
        </section>

        <section className={`${styles.section} ${styles.fullWidth} ui-card`}>
          <Skeleton width="28%" height={20} />
          <SkeletonText lines={1} widths={["56%"]} />
          <div style={{ display: "grid", gap: "12px" }}>
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
            <SkeletonButton width={160} />
          </div>
        </section>

        <div className={styles.grid}>
          <section className={`${styles.section} ui-card`}>
            <SkeletonCard avatar lines={2} actionCount={2} />
            <SkeletonCard avatar lines={2} actionCount={2} />
          </section>
          <section className={`${styles.section} ui-card`}>
            <SkeletonCard avatar lines={2} actionCount={2} />
            <SkeletonCard avatar lines={2} actionCount={2} />
          </section>
          <section className={`${styles.section} ${styles.fullWidth} ui-card`}>
            <SkeletonCard avatar lines={2} />
            <SkeletonCard avatar lines={2} />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Message
        type="error"
        text={errorMessage}
        clearMessage={setErrorMessage}
        duration={4000}
      />
      <Message
        type="success"
        text={successMessage}
        clearMessage={setSuccessMessage}
        duration={4000}
      />

      <section className={`${styles.header} ui-card`}>
        <h2 className={styles.title}>{t("invites.title")}</h2>
        <p className={styles.subtitle}>{t("invites.subtitle")}</p>
      </section>

      <section className={`${styles.section} ${styles.fullWidth} ui-card`}>
        <h3 className={styles.sectionTitle}>{t("invites.sendTitle")}</h3>
        <p className={styles.sectionSubtitle}>{t("invites.sendSubtitle")}</p>

        {isLoadingAccounts ? (
          <div aria-busy="true" style={{ display: "grid", gap: "12px" }}>
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
            <SkeletonButton width={160} />
          </div>
        ) : (
          <InviteForm
            accounts={accounts}
            email={email}
            role={role}
            accountId={selectedAccountId}
            isSubmitting={isSendingInvite}
            onEmailChange={setEmail}
            onRoleChange={setRole}
            onAccountChange={setSelectedAccountId}
            onSubmit={handleSendInvite}
          />
        )}
      </section>

      <div className={styles.grid}>
        <section className={`${styles.section} ui-card`}>
          <h3 className={styles.sectionTitle}>{t("invites.sentTitle")}</h3>
          <p className={styles.sectionSubtitle}>{t("invites.sentSubtitle")}</p>

          {isLoadingInvites ? (
            <div aria-busy="true" style={{ display: "grid", gap: "12px" }}>
              <SkeletonCard avatar lines={2} actionCount={2} />
              <SkeletonCard avatar lines={2} actionCount={2} />
            </div>
          ) : (
            <SentInvitesList
              invites={visibleSentInvites}
              activeInviteId={activeInviteId}
              activeAction={activeAction}
              onCancel={handleCancelInvite}
              onExpire={handleExpireInvite}
            />
          )}
        </section>

        <section className={`${styles.section} ui-card`}>
          <h3 className={styles.sectionTitle}>{t("invites.receivedTitle")}</h3>
          <p className={styles.sectionSubtitle}>
            {t("invites.receivedSubtitle")}
          </p>

          {isLoadingInvites ? (
            <div aria-busy="true" style={{ display: "grid", gap: "12px" }}>
              <SkeletonCard avatar lines={2} actionCount={2} />
              <SkeletonCard avatar lines={2} actionCount={2} />
            </div>
          ) : (
            <ReceivedInvitesList
              invites={receivedInvites}
              activeInviteId={activeInviteId}
              activeAction={activeAction}
              onAccept={handleAcceptInvite}
              onReject={handleRejectInvite}
            />
          )}
        </section>

        <section className={`${styles.section} ${styles.fullWidth} ui-card`}>
          <h3 className={styles.sectionTitle}>{t("invites.expiredTitle")}</h3>
          <p className={styles.sectionSubtitle}>
            {t("invites.expiredSubtitle")}
          </p>

          {isLoadingInvites ? (
            <div aria-busy="true" style={{ display: "grid", gap: "12px" }}>
              <SkeletonCard avatar lines={2} />
              <SkeletonCard avatar lines={2} />
            </div>
          ) : (
            <ExpiredInvitesList invites={expiredInvites} />
          )}
        </section>
      </div>
    </div>
  );
}

export default InvitesPage;
