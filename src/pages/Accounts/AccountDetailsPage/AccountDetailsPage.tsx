import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaUserEdit } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import styles from "./AccountDetailsPage.module.css";
import api from "../../../services/api";
import axios from "axios";
import type {
  AccountCounts,
  AccountDetail,
  AccountRole,
  Currency,
  Transaction,
  savingGoal,
} from "../../../types/account.types";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import TransactionCard from "../../../components/TransactionCard/TransactionCard";
import SavingGoalCard from "../../../components/SavingGoalCard/SavingGoalCard";
import Message from "../../../components/Message/Message";
import RoleSelector from "../../../components/members/RoleSelector";
import { getCurrencyLabel, getRoleLabel } from "../../../utils/displayLabels";
import { getLocale } from "../../../i18n/getLocale";
import Skeleton from "../../../components/Skeleton/Skeleton";
import SkeletonButton from "../../../components/Skeleton/SkeletonButton";
import SkeletonCard from "../../../components/Skeleton/SkeletonCard";
import LoadingStatus from "../../../components/LoadingStatus/LoadingStatus";
import LoadErrorState from "../../../components/LoadErrorState/LoadErrorState";
import AsyncButtonContent from "../../../components/AsyncButtonContent/AsyncButtonContent";

function AccountDetailsPage() {
  const { t, i18n } = useTranslation();
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AccountRole>("MEMBER");
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    currency: "EUR" as Currency,
  });
  const CURRENCIES: Currency[] = ["EUR", "USD", "BRL", "GBP", "JPY"];

  const fetchAccount = useCallback(async () => {
    if (!accountId) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [accountResponse, transactionsResponse, savingGoalsResponse] =
        await Promise.all([
          api.get<Omit<AccountDetail, "transactions" | "savingGoals" | "_count">>(
            `/accounts/${accountId}`,
          ),
          api.get<Transaction[]>(`/transactions/account/${accountId}`),
          api.get<savingGoal[]>(`/saving-goals/account/${accountId}`),
        ]);

      const transactions = Array.isArray(transactionsResponse.data)
        ? transactionsResponse.data
        : [];
      const savingGoals = Array.isArray(savingGoalsResponse.data)
        ? savingGoalsResponse.data
        : [];
      const counts: AccountCounts = {
        transactions: transactions.length,
        savingGoals: savingGoals.length,
      };

      setAccount({
        ...accountResponse.data,
        users: accountResponse.data.users ?? [],
        transactions,
        savingGoals,
        _count: counts,
      });
    } catch (error: unknown) {
      console.error("Failed to load account", error);
      setAccount(null);
      setErrorMessage(t("accounts.details.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [accountId, t]);

  useEffect(() => {
    void fetchAccount();
  }, [fetchAccount]);

  const currentMember = account?.users.find(
    (user) => user.userId === currentUser?.id,
  );

  const canEdit =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const canDelete = currentMember?.role === "OWNER";
  const getCreatorName = (transaction: Transaction) => {
    if (typeof transaction.createdBy === "string") return transaction.createdBy;
    if (transaction.createdBy?.name) return transaction.createdBy.name;
    if (!transaction.createdById) return undefined;
    return account?.users.find(
      (member) => member.userId === transaction.createdById,
    )?.user.name;
  };
  const getUpdaterName = (transaction: Transaction) => {
    if (transaction.updatedBy?.name) return transaction.updatedBy.name;
    if (!transaction.updatedById) return undefined;
    return account?.users.find(
      (member) => member.userId === transaction.updatedById,
    )?.user.name;
  };

  function startEdit() {
    if (!account) return;
    setForm({
      name: account.name,
      description: account.description ?? "",
      currency: account.currency,
    });
    setIsEditing(true);
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function handleSave() {
    if (!accountId || !account) return;

    const payload: Partial<typeof form> = {};
    if (form.name !== account.name) payload.name = form.name.trim();
    if (form.description !== (account.description ?? ""))
      payload.description = form.description.trim();
    if (form.currency !== account.currency) payload.currency = form.currency;
    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.put(`/accounts/${accountId}`, payload);
      setAccount((prev) => (prev ? { ...prev, ...res.data } : prev));
      setIsEditing(false);
      setErrorMessage(null);
      setSuccessMessage(t("accounts.details.updatesSaved"));
    } catch (error: unknown) {
      console.error("Failed to update account", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(t("accounts.details.updateFailed"));
      } else {
        setErrorMessage(t("accounts.details.unexpected"));
      }
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!account || isDeleting) return;
    const confirmation = window.confirm(
      t("accounts.details.deleteConfirm"),
    );
    if (!confirmation) return;

    try {
      setIsDeleting(true);
      await api.delete(`/accounts/${accountId}`);
      setSuccessMessage(t("accounts.details.deleteSuccess"));
      setTimeout(() => {
        navigate("/accounts");
      }, 3000);
    } catch (error: unknown) {
      console.error("Failed to delete account", error);
      setErrorMessage(t("accounts.details.deleteFailed"));
      setSuccessMessage(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMemberRoleUpdate(memberId: string, role: AccountRole) {
    if (!accountId || !account) return;

    const targetMember = account.users.find((member) => member.id === memberId);
    if (!targetMember || targetMember.role === role) return;

    try {
      setUpdatingMemberId(memberId);
      await api.patch(`/accounts/${accountId}/members/${memberId}`, { role });
      setAccount((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((member) =>
                member.id === memberId ? { ...member, role } : member,
              ),
            }
          : prev,
      );
      setSuccessMessage(t("members.updateSuccess"));
      setErrorMessage(null);
      setEditingMemberId(null);
    } catch (error: unknown) {
      console.error("Failed to update member role", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(t("members.updateFailed"));
      } else {
        setErrorMessage(t("members.updateFailed"));
      }
      setSuccessMessage(null);
    } finally {
      setUpdatingMemberId(null);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.accountDetailsPageContainer} aria-busy="true">
        <LoadingStatus label={t("accounts.details.loading")} />
        <section className={`${styles.accountDetails} ui-card`}>
          <Skeleton width="42%" height={28} />
          <Skeleton width="68%" height={16} />
          <Skeleton width="32%" height={18} />
          <SkeletonButton width={130} />
        </section>
        <section className="ui-card">
          <SkeletonCard avatar lines={2} />
          <SkeletonCard avatar lines={2} />
        </section>
        <section className="ui-card">
          <SkeletonCard avatar lines={2} actionCount={1} />
          <SkeletonCard avatar lines={2} actionCount={1} />
        </section>
      </div>
    );
  }

  if (!account) {
    return (
      <div className={styles.accountDetailsPageContainer}>
        <LoadErrorState
          message={errorMessage ?? t("accounts.details.loadFailed")}
          onRetry={() => void fetchAccount()}
        />
      </div>
    );
  }
  const locale = getLocale(i18n.resolvedLanguage);
  const balance = account.transactions.reduce((acc, transaction) => {
    const amount = Number(transaction.amount);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return transaction.type === "INCOME" ? acc + safeAmount : acc - safeAmount;
  }, 0);
  const formattedBalance = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: account.currency,
  }).format(balance);

  return (
    <div className={styles.accountDetailsPageContainer}>
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

      <section className={`${styles.accountDetails} ui-card`}>
        {!isEditing ? (
          <>
            <h2 className={styles.accountTitle}>{account.name}</h2>
            {account.description && (
              <p className={styles.description}>{account.description}</p>
            )}
            <p className={styles.currency}>{getCurrencyLabel(t, account.currency)}</p>
            <p className={styles.balance}>
              {t("accounts.details.balance", { amount: formattedBalance })}
            </p>
            {currentMember && (
              <p className={styles.myRole}>
                {t("accounts.details.myRole", {
                  role: getRoleLabel(t, currentMember.role),
                })}
              </p>
            )}
            {(canEdit || canDelete) && (
              <div className={styles.accountActions}>
                {canEdit && (
                  <button className="ui-btn" onClick={startEdit}>
                    {t("accounts.details.edit")}
                  </button>
                )}
                {canDelete && (
                  <button
                    className="ui-btn"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-busy={isDeleting}
                  >
                    <AsyncButtonContent
                      isLoading={isDeleting}
                      idleLabel={t("accounts.details.delete")}
                      loadingLabel={t("accounts.details.deleting")}
                    />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <input
              className="ui-control"
              name="name"
              value={form.name}
              maxLength={20}
              onChange={handleChange}
              placeholder={t("accounts.details.accountNamePlaceholder")}
            />
            <textarea
              className="ui-control"
              name="description"
              maxLength={60}
              value={form.description}
              onChange={handleChange}
              placeholder={t("accounts.details.descriptionPlaceholder")}
            />

            <select
              className="ui-control"
              name="currency"
              id="currency"
              value={form.currency}
              onChange={handleChange}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {getCurrencyLabel(t, currency)}
                </option>
              ))}
            </select>
            <div className={styles.editActions}>
              <button
                className="ui-btn"
                onClick={handleSave}
                disabled={isSaving}
                aria-busy={isSaving}
              >
                <AsyncButtonContent
                  isLoading={isSaving}
                  idleLabel={t("accounts.details.save")}
                  loadingLabel={t("accounts.details.saving")}
                />
              </button>
              <button
                className="ui-btn"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                {t("accounts.details.cancel")}
              </button>
            </div>
          </>
        )}
      </section>

      <section className={`${styles.aMembersSection} ui-card`}>
        <div className={styles.sectionHeader}>
          <div className={styles.membersTitleWrap}>
            <h3 className={styles.membersTitle}>{t("accounts.details.members")}</h3>
            <button
              className={styles.manageMembersButton}
              type="button"
              onClick={() => navigate(`/accounts/${accountId}/members`)}
              aria-label={t("accounts.details.manageMembers")}
              title={t("accounts.details.manageMembers")}
            >
              <IoSettingsOutline aria-hidden="true" />
            </button>
          </div>
          <div className={styles.accountActions}>
            <button
              className="ui-btn"
              type="button"
              onClick={() => navigate(`/invites?accountId=${accountId}`)}
            >
              {t("common.invites")}
            </button>
          </div>
        </div>
        {account.users.map((member) => {
          const canManageMemberRole =
            currentMember?.role === "OWNER" &&
            member.role !== "OWNER" &&
            Boolean(member.id);
          const isEditingMember = editingMemberId === member.id;
          const isUpdatingMember = updatingMemberId === member.id;

          return (
            <article className={styles.memberRow} key={member.userId}>
              <img src={member.user.image} alt={member.user.name} />
              <div className={styles.memberInfo}>
                <p className={styles.memberName}>{member.user.name}</p>
                <p className={styles.memberRole}>{getRoleLabel(t, member.role)}</p>
              </div>

              <div className={styles.memberActions}>
                {canManageMemberRole ? (
                  <>
                    <button
                      className={styles.memberEditButton}
                      type="button"
                      aria-label={t("members.editRole", { name: member.user.name })}
                      aria-expanded={isEditingMember}
                      disabled={isUpdatingMember}
                      onClick={() => {
                        setSelectedRole(member.role);
                        setEditingMemberId((current) =>
                          current === member.id ? null : (member.id ?? null),
                        );
                      }}
                    >
                      <FaUserEdit aria-hidden="true" />
                    </button>

                    {isEditingMember ? (
                      <div className={styles.memberEditor}>
                        <RoleSelector
                          value={selectedRole}
                          options={["MEMBER", "ADMIN"]}
                          disabled={isUpdatingMember}
                          onChange={setSelectedRole}
                        />
                        <button
                          className="ui-btn"
                          type="button"
                          disabled={isUpdatingMember || selectedRole === member.role}
                          aria-busy={isUpdatingMember}
                          onClick={() =>
                            member.id
                              ? void handleMemberRoleUpdate(member.id, selectedRole)
                              : undefined
                          }
                        >
                          <AsyncButtonContent
                            isLoading={isUpdatingMember}
                            idleLabel={t("members.updateRoleAction")}
                            loadingLabel={t("common.updating")}
                          />
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <section className={`${styles.transactionsSection} ui-card`}>
        <h3 className={styles.transactionsTitle}>
          {t("common.transactions")} ({account._count.transactions})
        </h3>
        <button
          className="ui-btn"
          onClick={() => navigate(`/accounts/${accountId}/transactions`)}
        >
          {t("accounts.details.manageTransactions")}
        </button>
        {account.transactions.length === 0 ? (
          <p>{t("accounts.details.noTransactions")}</p>
        ) : (
          account.transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              currency={account.currency}
              transaction={transaction}
              creatorName={getCreatorName(transaction)}
              updaterName={getUpdaterName(transaction)}
            />
          ))
        )}
      </section>

      <section className={`${styles.savingGoalsSection} ui-card`}>
        <h3 className={styles.savingGoalsTitle}>
          {t("savingGoals.title")} ({account._count.savingGoals})
        </h3>
        <button
          className="ui-btn"
          onClick={() => navigate(`/accounts/${accountId}/savings`)}
        >
          {t("accounts.details.manageSavingGoals")}
        </button>
        {account.savingGoals.length === 0 ? (
          <p>{t("accounts.details.noSavingGoals")}</p>
        ) : (
          account.savingGoals.map((goal) => (
            <SavingGoalCard
              key={goal.id}
              currency={account.currency}
              goal={goal}
            />
          ))
        )}
      </section>
    </div>
  );
}
export default AccountDetailsPage;
