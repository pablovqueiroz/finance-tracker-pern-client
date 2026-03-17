import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Skeleton from "../../components/Skeleton/Skeleton";
import SkeletonButton from "../../components/Skeleton/SkeletonButton";
import SkeletonCard from "../../components/Skeleton/SkeletonCard";
import SkeletonText from "../../components/Skeleton/SkeletonText";
import MemberList from "../../components/members/MemberList";
import Message from "../../components/Message/Message";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import type {
  AccountDetail,
  AccountMember,
  AccountRole,
  AccountSummary,
} from "../../types/account.types";
import styles from "./AccountMembersPage.module.css";

type AccountInfo = Omit<
  AccountDetail,
  "transactions" | "savingGoals" | "_count"
>;

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

function AccountMembersPage() {
  const { t } = useTranslation();
  const { accountId: routeAccountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await api.get<AccountSummary[]>("/accounts");
      const accountList = Array.isArray(response.data) ? response.data : [];
      setAccounts(accountList);

      if (accountList.length === 0) {
        setSelectedAccountId("");
        setAccount(null);
        setMembers([]);
        setErrorMessage(null);
        return;
      }

      const isRouteAccountValid = accountList.some(
        (item) => item.id === routeAccountId,
      );
      const nextAccountId = isRouteAccountValid
        ? routeAccountId || ""
        : accountList[0].id;

      setSelectedAccountId(nextAccountId);
      setErrorMessage(null);

      if (
        nextAccountId &&
        nextAccountId !== routeAccountId &&
        location.pathname.startsWith("/accounts/")
      ) {
        navigate(`/accounts/${nextAccountId}/members`, { replace: true });
      }
    } catch (error: unknown) {
      console.error("Failed to load accounts", error);
      setAccounts([]);
      setSelectedAccountId("");
      setAccount(null);
      setMembers([]);
      setErrorMessage(getErrorMessage(error, t("members.loadFailed")));
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [location.pathname, navigate, routeAccountId, t]);

  const loadPageData = useCallback(
    async (targetAccountId: string) => {
      if (!targetAccountId) {
        setAccount(null);
        setMembers([]);
        setIsLoadingMembers(false);
        return;
      }

      try {
        setIsLoadingMembers(true);

        const [accountResponse, membersResponse] = await Promise.all([
          api.get<AccountInfo>(`/accounts/${targetAccountId}`),
          api.get<AccountMember[]>(`/accounts/${targetAccountId}/members`),
        ]);

        setAccount(accountResponse.data);
        setMembers(
          Array.isArray(membersResponse.data) ? membersResponse.data : [],
        );
        setErrorMessage(null);
      } catch (error: unknown) {
        console.error("Failed to load account members", error);
        setErrorMessage(getErrorMessage(error, t("members.loadFailed")));
        setAccount(null);
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    void loadPageData(selectedAccountId);
  }, [loadPageData, selectedAccountId]);

  const currentMember = members.find(
    (member) => member.userId === currentUser?.id,
  );
  const canManageRoles = currentMember?.role === "OWNER";
  const canRemoveMembers = currentMember?.role === "OWNER";
  const isLoading = isLoadingAccounts || isLoadingMembers;

  async function handleRoleChange(memberId: string, role: AccountRole) {
    if (!selectedAccountId || !memberId) return;

    const targetMember = members.find((member) => member.id === memberId);
    if (!targetMember || targetMember.role === role) return;

    try {
      setUpdatingMemberId(memberId);
      await api.patch(`/accounts/${selectedAccountId}/members/${memberId}`, {
        role,
      });
      setSuccessMessage(t("members.updateSuccess"));
      setErrorMessage(null);
      await loadPageData(selectedAccountId);
    } catch (error: unknown) {
      console.error("Failed to update member role", error);
      setErrorMessage(getErrorMessage(error, t("members.updateFailed")));
      setSuccessMessage(null);
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!selectedAccountId || !memberId) return;

    const confirmation = window.confirm(
      t("members.removeConfirm", { name: memberName }),
    );

    if (!confirmation) return;

    try {
      setRemovingMemberId(memberId);
      await api.delete(`/accounts/${selectedAccountId}/members/${memberId}`);
      setSuccessMessage(t("members.removeSuccess"));
      setErrorMessage(null);
      await loadPageData(selectedAccountId);
    } catch (error: unknown) {
      console.error("Failed to remove member", error);
      setErrorMessage(getErrorMessage(error, t("members.removeFailed")));
      setSuccessMessage(null);
    } finally {
      setRemovingMemberId(null);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.pageContainer} aria-busy="true">
        <section className={`${styles.header} ui-card`}>
          <div className={styles.hero}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="16%" height={12} />
              <div style={{ marginTop: "12px" }}>
                <Skeleton width="34%" height={28} />
              </div>
              <div style={{ marginTop: "10px" }}>
                <SkeletonText lines={2} widths={["56%", "38%"]} />
              </div>
            </div>

            <div className={styles.selectorSkeleton}>
              <Skeleton width="48%" height={12} />
              <div style={{ marginTop: "8px" }}>
                <Skeleton width="100%" height={40} />
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <SkeletonButton width={140} />
            <SkeletonButton width={140} />
          </div>
        </section>

        <section className={`${styles.section} ui-card`}>
          <div className={styles.sectionHeader}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="28%" height={20} />
              <div style={{ marginTop: "8px" }}>
                <SkeletonText lines={1} widths={["46%"]} />
              </div>
            </div>
            <Skeleton width={40} height={32} />
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <SkeletonCard avatar lines={1} actionCount={2} />
            <SkeletonCard avatar lines={1} actionCount={2} />
            <SkeletonCard avatar lines={1} actionCount={2} />
          </div>
        </section>
      </div>
    );
  }

  if (!accounts.length || !selectedAccountId || !account) {
    return (
      <div className={styles.pageContainer}>
        <section className={`${styles.header} ui-card`}>
          <h2 className={styles.title}>{t("members.title")}</h2>
          <p className={styles.subtitle}>{t("members.notFound")}</p>
          <Link className="ui-btn" to="/accounts">
            {t("common.backToAccounts")}
          </Link>
        </section>
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
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>{t("common.account")}</span>
            <h2 className={styles.title}>{account.name}</h2>
            <p className={styles.subtitle}>
              {t("members.subtitle", { account: account.name })}
            </p>
            {account.description ? (
              <p className={styles.accountDescription}>{account.description}</p>
            ) : null}
          </div>

          <label className={styles.accountSelector} htmlFor="members-account">
            <span className={styles.accountSelectorLabel}>
              {t("common.account")}
            </span>
            <select
              className={`ui-control ${styles.accountSelectorInput}`}
              id="members-account"
              value={selectedAccountId}
              onChange={(event) => {
                const nextAccountId = event.target.value;
                setSelectedAccountId(nextAccountId);
                navigate(`/accounts/${nextAccountId}/members`);
              }}
            >
              {accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.headerActions}>
          <Link
            className={`${styles.secondaryBtn} ui-btn`}
            to={`/accounts/${selectedAccountId}`}
          >
            {t("common.backToAccount")}
          </Link>
          <Link
            className="ui-btn"
            to={`/invites?accountId=${selectedAccountId}`}
          >
            {t("members.openInvites")}
          </Link>
        </div>
      </section>

      <section className={`${styles.section} ui-card`}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>{t("members.sectionTitle")}</h3>
            <p className={styles.sectionSubtitle}>
              {t("members.sectionSubtitle")}
            </p>
          </div>
        </div>

        <MemberList
          members={members}
          currentUserId={currentUser?.id}
          canManageRoles={canManageRoles}
          canRemoveMembers={canRemoveMembers}
          updatingMemberId={updatingMemberId}
          removingMemberId={removingMemberId}
          onRoleChange={handleRoleChange}
          onRemove={handleRemove}
        />
      </section>
    </div>
  );
}

export default AccountMembersPage;
