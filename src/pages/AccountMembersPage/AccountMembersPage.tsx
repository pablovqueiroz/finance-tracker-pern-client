import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
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
} from "../../types/account.types";
import { getCurrencyLabel, getRoleLabel } from "../../utils/displayLabels";
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
  const { accountId } = useParams<{ accountId: string }>();
  const { currentUser } = useAuth();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadPageData() {
    if (!accountId) return;

    try {
      setIsLoading(true);

      const [accountResponse, membersResponse] = await Promise.all([
        api.get<AccountInfo>(`/accounts/${accountId}`),
        api.get<AccountMember[]>(`/accounts/${accountId}/members`),
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
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();
  }, [accountId]);

  const currentMember = members.find(
    (member) => member.userId === currentUser?.id,
  );
  const canManageRoles = currentMember?.role === "OWNER";
  const canRemoveMembers = currentMember?.role === "OWNER";

  async function handleRoleChange(memberId: string, role: AccountRole) {
    if (!accountId || !memberId) return;

    const targetMember = members.find((member) => member.id === memberId);
    if (!targetMember || targetMember.role === role) return;

    try {
      setUpdatingMemberId(memberId);
      await api.patch(`/accounts/${accountId}/members/${memberId}`, { role });
      setSuccessMessage(t("members.updateSuccess"));
      setErrorMessage(null);
      await loadPageData();
    } catch (error: unknown) {
      console.error("Failed to update member role", error);
      setErrorMessage(getErrorMessage(error, t("members.updateFailed")));
      setSuccessMessage(null);
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!accountId || !memberId) return;

    const confirmation = window.confirm(
      t("members.removeConfirm", { name: memberName }),
    );

    if (!confirmation) return;

    try {
      setRemovingMemberId(memberId);
      await api.delete(`/accounts/${accountId}/members/${memberId}`);
      setSuccessMessage(t("members.removeSuccess"));
      setErrorMessage(null);
      await loadPageData();
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
          <div className={styles.headerTop}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="28%" height={26} />
              <div style={{ marginTop: "8px" }}>
                <SkeletonText lines={1} widths={["50%"]} />
              </div>
            </div>

            <div className={styles.headerActions}>
              <SkeletonButton width={140} />
              <SkeletonButton width={140} />
            </div>
          </div>

          <div className={styles.infoRow}>
            <Skeleton width={72} height={28} />
            <Skeleton width={132} height={28} />
          </div>
        </section>

        <section className={`${styles.section} ui-card`}>
          <Skeleton width="34%" height={20} />
          <SkeletonText lines={1} widths={["54%"]} />
          <div style={{ display: "grid", gap: "12px" }}>
            <SkeletonCard avatar lines={1} actionCount={2} />
            <SkeletonCard avatar lines={1} actionCount={2} />
            <SkeletonCard avatar lines={1} actionCount={2} />
          </div>
        </section>
      </div>
    );
  }

  if (!accountId || !account) {
    return (
      <div className={styles.pageContainer}>
        <section className="ui-card">
          <h2 className={styles.title}>{t("members.title")}</h2>
          <p className={styles.sectionSubtitle}>{t("members.notFound")}</p>
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
        <div className={styles.headerTop}>
          <div>
            <h2 className={styles.title}>{t("members.title")}</h2>
            <p className={styles.subtitle}>
              {t("members.subtitle", { account: account.name })}
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link className="ui-btn" to={`/accounts/${accountId}`}>
              {t("common.backToAccount")}
            </Link>
            <Link className="ui-btn" to={`/invites?accountId=${accountId}`}>
              {t("members.openInvites")}
            </Link>
          </div>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.badge}>
            {getCurrencyLabel(t, account.currency)}
          </span>
          {currentMember ? (
            <span className={styles.badge}>
              {t("members.myRole", {
                role: getRoleLabel(t, currentMember.role),
              })}
            </span>
          ) : null}
        </div>
      </section>

      <section className={`${styles.section} ui-card`}>
        <h3 className={styles.sectionTitle}>{t("members.sectionTitle")}</h3>
        <p className={styles.sectionSubtitle}>{t("members.sectionSubtitle")}</p>

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
