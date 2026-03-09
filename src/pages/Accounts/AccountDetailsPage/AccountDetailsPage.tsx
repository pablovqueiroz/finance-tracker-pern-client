import { useEffect, useState } from "react";
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

function AccountDetailsPage() {
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
        setErrorMessage("Failed to load account");
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
      setSuccessMessage("Updates saved.");
    } catch (error: unknown) {
      console.error("Failed to updae account", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Update account failed",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!account) return;
    const confirmation = window.confirm(
      "This action is irreversible. Are you sure you want to delete this account?",
    );
    if (!confirmation) return;

    try {
      await api.delete(`/accounts/${accountId}`);
      setSuccessMessage("Account successfully deleted");
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
      setErrorMessage("Please provide an email.");
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
      setSuccessMessage("Invite sent successfully.");
    } catch (error: unknown) {
      console.error("Failed to send invite", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to send invite.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!accountId || !account) return;
    const confirmation = window.confirm(
      `Remove ${memberName} from this account?`,
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
      setSuccessMessage("Member removed.");
    } catch (error: unknown) {
      console.error("Failed to remove member", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to remove member.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setRemovingMemberId(null);
    }
  }

  if (isLoading) return <p>Loading...</p>;
  if (!account) return null;
  const locale = navigator.language ?? "pt-PT";
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
            <p className={styles.currency}>{account.currency}</p>
            <p className={styles.balance}>Balance: {formattedBalance}</p>
            {currentMember && (
              <p className={styles.myRole}>My role:{currentMember.role}</p>
            )}
            {(canEdit || canDelete) && (
              <div className={styles.accountActions}>
                {canEdit && (
                  <button className="ui-btn" onClick={startEdit}>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button className="ui-btn" onClick={handleDelete}>
                    Delete
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
              placeholder="Account name"
            />
            <textarea
              className="ui-control"
              name="description"
              maxLength={60}
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
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
                  {currency}
                </option>
              ))}
            </select>
            <div>
              <button
                className="ui-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="ui-btn"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </section>

      <section className={`${styles.aMembersSection} ui-card`}>
        <h3 className={styles.membersTitle}>Members</h3>
        {canEdit && (
          <form className={styles.inviteForm} onSubmit={handleInviteMember}>
            <input
              className="ui-control"
              type="email"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select
              className="ui-control"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AccountRole)}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button className="ui-btn" type="submit" disabled={isInviting}>
              {isInviting ? "Sending..." : "Invite"}
            </button>
          </form>
        )}
        {account.users.map((member) => (
          <article className={styles.memberAvatar} key={member.userId}>
            <img src={member.user.image} alt={member.user.name} />
            <p className={styles.memberName}>{member.user.name}</p>
            <p className={styles.memberRole}>{member.role}</p>
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
                  {removingMemberId === member.id ? "Removing..." : "Remove"}
                </button>
              )}
          </article>
        ))}
      </section>

      <section className={`${styles.transactionsSection} ui-card`}>
        <h3 className={styles.transactionsTitle}>
          Transactions ({account._count.transactions})
        </h3>
        <button
          className="ui-btn"
          onClick={() => navigate(`/accounts/${accountId}/transactions`)}
        >
          Manage transactions
        </button>
        {account.transactions.length === 0 ? (
          <p>No transactions yet</p>
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
          Saving Goals ({account._count.savingGoals})
        </h3>
        <button
          className="ui-btn"
          onClick={() => navigate(`/accounts/${accountId}/savings`)}
        >
          Manage saving goals
        </button>
        {account.savingGoals.length === 0 ? (
          <p>No saving goals yet</p>
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
