import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { getCurrencyLabel, getRoleLabel } from "../../../utils/displayLabels";
import { getLocale } from "../../../i18n/getLocale";

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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AccountRole>("MEMBER");
  const [isInviting, setIsInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    currency: "EUR" as Currency,
  });
  const CURRENCIES: Currency[] = ["EUR", "USD", "BRL", "GBP", "JPY"];

  useEffect(() => {
    async function fetchAccount() {
      try {
        const [accountResponse, transactionsResponse, savingGoalsResponse] =
          await Promise.all([
            api.get<
              Omit<AccountDetail, "transactions" | "savingGoals" | "_count">
            >(`/accounts/${accountId}`),
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
        setErrorMessage(null);
      } catch (error: unknown) {
        console.error("Failed to load account", error);
        setErrorMessage(t("accounts.details.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    }
    if (accountId) fetchAccount();
  }, [accountId]);

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
      console.error("Failed to updae account", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("accounts.details.updateFailed"),
        );
      } else {
        setErrorMessage(t("accounts.details.unexpected"));
      }
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!account) return;
    const confirmation = window.confirm(
      t("accounts.details.deleteConfirm"),
    );
    if (!confirmation) return;

    try {
      await api.delete(`/accounts/${accountId}`);
      setSuccessMessage(t("accounts.details.deleteSuccess"));
      setTimeout(() => {
        navigate("/accounts");
      }, 3000);
    } catch (error: unknown) {
      console.error("Failed to delete account", error);
    }
  }

  async function handleInviteMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accountId) return;

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage(t("accounts.details.emailRequired"));
      return;
    }

    try {
      setIsInviting(true);
      await api.post("/invites", {
        email: normalizedEmail,
        accountId,
        role: inviteRole,
      });
      setInviteEmail("");
      setErrorMessage(null);
      setSuccessMessage(t("accounts.details.inviteSuccess"));
    } catch (error: unknown) {
      console.error("Failed to send invite", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("accounts.details.inviteFailed"),
        );
      } else {
        setErrorMessage(t("accounts.details.unexpected"));
      }
      setSuccessMessage(null);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!accountId || !account) return;
    const confirmation = window.confirm(
      t("accounts.details.removeMemberConfirm", { name: memberName }),
    );
    if (!confirmation) return;

    try {
      setRemovingMemberId(memberId);
      await api.delete(`/accounts/${accountId}/members/${memberId}`);
      setAccount((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.filter((member) => member.id !== memberId),
            }
          : prev,
      );
      setErrorMessage(null);
      setSuccessMessage(t("accounts.details.removeMemberSuccess"));
    } catch (error: unknown) {
      console.error("Failed to remove member", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("accounts.details.removeMemberFailed"),
        );
      } else {
        setErrorMessage(t("accounts.details.unexpected"));
      }
      setSuccessMessage(null);
    } finally {
      setRemovingMemberId(null);
    }
  }

  if (isLoading) return <p>{t("accounts.details.loading")}</p>;
  if (!account) return null;
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
                  <button className="ui-btn" onClick={handleDelete}>
                    {t("accounts.details.delete")}
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
              >
                {isSaving ? t("accounts.details.saving") : t("accounts.details.save")}
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
          <h3 className={styles.membersTitle}>{t("accounts.details.members")}</h3>
          <div className={styles.accountActions}>
            <button
              className="ui-btn"
              type="button"
              onClick={() => navigate(`/accounts/${accountId}/members`)}
            >
              {t("accounts.details.manageMembers")}
            </button>
            <button
              className="ui-btn"
              type="button"
              onClick={() => navigate(`/invites?accountId=${accountId}`)}
            >
              {t("common.invites")}
            </button>
          </div>
        </div>
        {canEdit && (
          <form className={styles.inviteForm} onSubmit={handleInviteMember}>
            <input
              className="ui-control"
              type="email"
              placeholder={t("accounts.details.invitePlaceholder")}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select
              className="ui-control"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AccountRole)}
            >
              <option value="MEMBER">{getRoleLabel(t, "MEMBER")}</option>
              <option value="ADMIN">{getRoleLabel(t, "ADMIN")}</option>
            </select>
            <button className="ui-btn" type="submit" disabled={isInviting}>
              {isInviting ? t("accounts.details.sending") : t("accounts.details.invite")}
            </button>
          </form>
        )}
        {account.users.map((member) => (
          <article className={styles.memberAvatar} key={member.userId}>
            <img src={member.user.image} alt={member.user.name} />
            <p className={styles.memberName}>{member.user.name}</p>
            <p className={styles.memberRole}>{getRoleLabel(t, member.role)}</p>
            {canDelete &&
              member.userId !== currentUser?.id &&
              typeof member.id === "string" && (
                <button
                  className={`${styles.memberActionBtn} ui-btn`}
                  onClick={() =>
                    handleRemoveMember(member.id as string, member.user.name)
                  }
                  disabled={removingMemberId === member.id}
                >
                  {removingMemberId === member.id
                    ? t("accounts.details.removing")
                    : t("accounts.details.remove")}
                </button>
              )}
          </article>
        ))}
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
