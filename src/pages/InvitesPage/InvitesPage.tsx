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
import Message from "../../components/Message/Message";
import api from "../../services/api";
import type {
  AccountDetail,
  AccountRole,
  AccountSummary,
} from "../../types/account.types";
import type { AccountInvite, InviteStatus } from "../../types/invite.types";
import { useAuth } from "../../hooks/useAuth";
import InviteSharePanel from "../../components/invites/InviteSharePanel";
import styles from "./InvitesPage.module.css";
import type { InviteSharePayload } from "../../utils/inviteShare";

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

function isExistingInviteError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;

  if (error.response?.status === 409) return true;

  const rawMessage =
    error.response?.data?.errorMessage ?? error.response?.data?.message ?? "";
  const message = String(rawMessage).toLowerCase();

  return (
    message.includes("already") ||
    message.includes("existing") ||
    message.includes("pending invite") ||
    message.includes("invite already") ||
    message.includes("active invite")
  );
}

function InvitesPage() {
  const { i18n, t } = useTranslation();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [sentInvites, setSentInvites] = useState<AccountInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<AccountInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteFormRole>("MEMBER");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<
    "cancel" | "accept" | "reject" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<InviteSharePayload | null>(
    null,
  );
  const [selectedAccountRole, setSelectedAccountRole] =
    useState<AccountRole | null>(null);
  const [sentStatusFilter, setSentStatusFilter] =
    useState<InviteStatus>("PENDING");
  const [receivedStatusFilter, setReceivedStatusFilter] =
    useState<InviteStatus>("PENDING");

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

      const [sentResponse, receivedResponse] = await Promise.all([
        api.get<AccountInvite[]>("/invites/sent"),
        api.get<AccountInvite[]>("/invites/received"),
      ]);

      setSentInvites(Array.isArray(sentResponse.data) ? sentResponse.data : []);
      setReceivedInvites(
        Array.isArray(receivedResponse.data) ? receivedResponse.data : [],
      );
      setErrorMessage(null);
    } catch (error: unknown) {
      console.error("Failed to load invites", error);
      setErrorMessage(getErrorMessage(error, t("invites.loadInvitesFailed")));
      setSentInvites([]);
      setReceivedInvites([]);
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

  useEffect(() => {
    async function loadSelectedAccountRole() {
      if (!selectedAccountId || !currentUser?.id) {
        setSelectedAccountRole(null);
        return;
      }

      try {
        const response = await api.get<AccountDetail>(`/accounts/${selectedAccountId}`);
        const memberRole =
          response.data.users.find((member) => member.userId === currentUser.id)?.role ??
          null;
        setSelectedAccountRole(memberRole);
      } catch (error: unknown) {
        console.error("Failed to load selected account role", error);
        setSelectedAccountRole(null);
      }
    }

    void loadSelectedAccountRole();
  }, [currentUser?.id, selectedAccountId]);

  async function handleSendInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSendInvites) {
      setErrorMessage(t("invites.readOnly"));
      setSuccessMessage(null);
      return;
    }

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
        language: (i18n.resolvedLanguage ?? "en").slice(0, 2),
      });
      const selectedAccount = accounts.find(
        (account) => account.id === selectedAccountId,
      );
      const nextSharePayload = {
        recipientEmail: normalizedEmail,
        accountName: selectedAccount?.name ?? t("invites.accountUnavailable"),
        inviterName: currentUser?.name ?? t("invites.unknownUser"),
      };
      setEmail("");
      setSuccessMessage(t("invites.sendSuccess"));
      setErrorMessage(null);
      setSharePayload(nextSharePayload);
      await loadInvites();
    } catch (error: unknown) {
      console.error("Failed to send invite", error);
      if (isExistingInviteError(error)) {
        const existingInvite = sentInvites.find(
          (invite) =>
            invite.email.trim().toLowerCase() === normalizedEmail &&
            invite.accountId === selectedAccountId &&
            invite.status === "PENDING",
        );
        const selectedAccount = accounts.find(
          (account) => account.id === selectedAccountId,
        );
        setErrorMessage(null);
        setSuccessMessage(t("invites.existingInviteReady"));
        setSharePayload({
          recipientEmail: existingInvite?.email ?? normalizedEmail,
          accountName:
            existingInvite?.account?.name ??
            selectedAccount?.name ??
            t("invites.accountUnavailable"),
          inviterName: currentUser?.name ?? t("invites.unknownUser"),
        });
      } else {
        setErrorMessage(getErrorMessage(error, t("invites.sendFailed")));
        setSuccessMessage(null);
        setSharePayload(null);
      }
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

  const statusOptions: InviteStatus[] = [
    "PENDING",
    "ACCEPTED",
    "CANCELLED",
    "EXPIRED",
  ];

  const filteredSentInvites = sentInvites.filter(
    (invite) => invite.status === sentStatusFilter,
  );
  const filteredReceivedInvites = receivedInvites.filter(
    (invite) => invite.status === receivedStatusFilter,
  );
  const canSendInvites =
    selectedAccountRole === "OWNER" || selectedAccountRole === "ADMIN";

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
        duration={8000}
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
          <>
            <InviteForm
              accounts={accounts}
              email={email}
              role={role}
              accountId={selectedAccountId}
              isSubmitting={isSendingInvite}
              canSendInvites={canSendInvites}
              readOnlyMessage={t("invites.readOnly")}
              onEmailChange={setEmail}
              onRoleChange={setRole}
              onAccountChange={setSelectedAccountId}
              onSubmit={handleSendInvite}
            />
            {sharePayload ? (
              <InviteSharePanel
                payload={sharePayload}
                onClose={() => setSharePayload(null)}
              />
            ) : null}
          </>
        )}
      </section>

      <div className={styles.grid}>
        <section className={`${styles.section} ui-card`}>
          <h3 className={styles.sectionTitle}>{t("invites.sentTitle")}</h3>
          <p className={styles.sectionSubtitle}>{t("invites.sentSubtitle")}</p>
          {sentInvites.length > 0 ? (
            <div className={styles.filterRow}>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`${styles.filterButton} ${
                    sentStatusFilter === status ? styles.filterButtonActive : ""
                  }`}
                  type="button"
                  aria-pressed={sentStatusFilter === status}
                  onClick={() => setSentStatusFilter(status)}
                >
                  {t(`invites.status.${status}`)}
                </button>
              ))}
            </div>
          ) : null}

          {isLoadingInvites ? (
            <div aria-busy="true" style={{ display: "grid", gap: "12px" }}>
              <SkeletonCard avatar lines={2} actionCount={2} />
              <SkeletonCard avatar lines={2} actionCount={2} />
            </div>
          ) : sentInvites.length === 0 ? (
            <p>{t("invites.noSent")}</p>
          ) : filteredSentInvites.length === 0 ? (
            <p>
              {t("invites.noSentForStatus", {
                status: t(`invites.status.${sentStatusFilter}`),
              })}
            </p>
          ) : (
            <SentInvitesList
              invites={filteredSentInvites}
              activeInviteId={activeInviteId}
              activeAction={activeAction}
              onCancel={handleCancelInvite}
              onReviewShare={(invite) =>
                setSharePayload({
                  recipientEmail: invite.email,
                  accountName:
                    invite.account?.name ?? t("invites.accountUnavailable"),
                  inviterName:
                    invite.invitedBy?.name ??
                    currentUser?.name ??
                    t("invites.unknownUser"),
                })
              }
            />
          )}
        </section>

        <section className={`${styles.section} ui-card`}>
          <h3 className={styles.sectionTitle}>{t("invites.receivedTitle")}</h3>
          <p className={styles.sectionSubtitle}>
            {t("invites.receivedSubtitle")}
          </p>
          {receivedInvites.length > 0 ? (
            <div className={styles.filterRow}>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`${styles.filterButton} ${
                    receivedStatusFilter === status
                      ? styles.filterButtonActive
                      : ""
                  }`}
                  type="button"
                  aria-pressed={receivedStatusFilter === status}
                  onClick={() => setReceivedStatusFilter(status)}
                >
                  {t(`invites.status.${status}`)}
                </button>
              ))}
            </div>
          ) : null}

          {isLoadingInvites ? (
            <div aria-busy="true" style={{ display: "grid", gap: "12px" }}>
              <SkeletonCard avatar lines={2} actionCount={2} />
              <SkeletonCard avatar lines={2} actionCount={2} />
            </div>
          ) : receivedInvites.length === 0 ? (
            <p>{t("invites.noReceived")}</p>
          ) : filteredReceivedInvites.length === 0 ? (
            <p>
              {t("invites.noReceivedForStatus", {
                status: t(`invites.status.${receivedStatusFilter}`),
              })}
            </p>
          ) : (
            <ReceivedInvitesList
              invites={filteredReceivedInvites}
              activeInviteId={activeInviteId}
              activeAction={activeAction}
              onAccept={handleAcceptInvite}
              onReject={handleRejectInvite}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default InvitesPage;
