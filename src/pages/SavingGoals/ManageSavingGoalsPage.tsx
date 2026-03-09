import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import styles from "./ManageSavingGoalsPage.module.css";
import api from "../../services/api";
import type {
  AccountDetail,
  AccountSummary,
  savingGoal,
} from "../../types/account.types";
import Message from "../../components/Message/Message";
import SavingGoalCard from "../../components/SavingGoalCard/SavingGoalCard";

type SavingGoalForm = {
  title: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  notes: string;
};

type MoveMoneyType = "ADD" | "REMOVE";

type AccountSummaryResponse = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  period: string;
};

const initialForm: SavingGoalForm = {
  title: "",
  targetAmount: "",
  currentAmount: "0",
  deadline: "",
  notes: "",
};

function ManageSavingGoalsPage() {
  const { accountId: routeAccountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [account, setAccount] = useState<
    Omit<AccountDetail, "transactions" | "savingGoals" | "_count"> | null
  >(null);
  const [goals, setGoals] = useState<savingGoal[]>([]);
  const [form, setForm] = useState<SavingGoalForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMovingGoalId, setIsMovingGoalId] = useState<string | null>(null);
  const [isClosingGoalId, setIsClosingGoalId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [movementAmounts, setMovementAmounts] = useState<
    Record<string, string>
  >({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reports = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totals = goals.reduce(
      (acc, goal) => {
        const current = Number(goal.currentAmount);
        const target = Number(goal.targetAmount);
        const safeCurrent = Number.isFinite(current) ? current : 0;
        const safeTarget = Number.isFinite(target) && target > 0 ? target : 0;
        const isCompleted = safeCurrent >= safeTarget && safeTarget > 0;
        const hasDeadline = Boolean(goal.deadline);
        const deadlineDate = hasDeadline ? new Date(goal.deadline as string) : null;
        const isOverdue =
          deadlineDate !== null && deadlineDate < today && !isCompleted;

        return {
          totalCurrent: acc.totalCurrent + safeCurrent,
          totalTarget: acc.totalTarget + safeTarget,
          completedCount: acc.completedCount + (isCompleted ? 1 : 0),
          overdueCount: acc.overdueCount + (isOverdue ? 1 : 0),
        };
      },
      {
        totalCurrent: 0,
        totalTarget: 0,
        completedCount: 0,
        overdueCount: 0,
      },
    );

    const completionRate =
      totals.totalTarget > 0
        ? Math.min((totals.totalCurrent / totals.totalTarget) * 100, 100)
        : 0;

    return {
      ...totals,
      completionRate: completionRate.toFixed(0),
    };
  }, [goals]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setIsLoadingAccounts(true);
        const response = await api.get<AccountSummary[]>("/accounts");
        const accountList = Array.isArray(response.data) ? response.data : [];
        setAccounts(accountList);

        if (accountList.length === 0) {
          setSelectedAccountId("");
          return;
        }

        const isRouteAccountValid = accountList.some(
          (item) => item.id === routeAccountId,
        );
        setSelectedAccountId(
          isRouteAccountValid ? routeAccountId || "" : accountList[0].id,
        );
      } catch (error: unknown) {
        console.error("Failed to load accounts", error);
        setErrorMessage("Failed to load accounts.");
        setAccounts([]);
        setSelectedAccountId("");
      } finally {
        setIsLoadingAccounts(false);
      }
    }

    fetchAccounts();
  }, [routeAccountId]);

  async function loadGoals(targetAccountId: string) {
    if (!targetAccountId) return;

    try {
      setIsLoadingGoals(true);
      const [accountResponse, goalsResponse, summaryResponse] = await Promise.all([
        api.get<Omit<AccountDetail, "transactions" | "savingGoals" | "_count">>(
          `/accounts/${targetAccountId}`,
        ),
        api.get<savingGoal[]>(`/saving-goals/account/${targetAccountId}`),
        api.get<AccountSummaryResponse>(`/transactions/summary/${targetAccountId}`),
      ]);
      setAccount(accountResponse.data);
      setGoals(Array.isArray(goalsResponse.data) ? goalsResponse.data : []);
      setAccountBalance(
        Number.isFinite(summaryResponse.data.balance)
          ? summaryResponse.data.balance
          : null,
      );
      setErrorMessage(null);
    } catch (error: unknown) {
      console.error("Failed to load saving goals", error);
      setErrorMessage("Failed to load saving goals.");
      setAccount(null);
      setGoals([]);
      setAccountBalance(null);
    } finally {
      setIsLoadingGoals(false);
    }
  }

  useEffect(() => {
    if (!selectedAccountId) return;
    loadGoals(selectedAccountId);
  }, [selectedAccountId]);

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

  const clearForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!selectedAccountId || isSaving) return;

    const title = form.title.trim();
    const targetAmount = Number(form.targetAmount);
    const currentAmount = Number(form.currentAmount);

    if (!title) {
      setErrorMessage("Title is required.");
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setErrorMessage("Target amount must be greater than zero.");
      return;
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      setErrorMessage("Current amount must be zero or more.");
      return;
    }

    const payload = {
      title,
      targetAmount,
      currentAmount,
      accountId: selectedAccountId,
      ...(form.deadline && { deadline: form.deadline }),
      ...(form.notes.trim() && { notes: form.notes.trim() }),
    };

    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/saving-goals/${editingId}`, payload);
        setSuccessMessage("Saving goal updated.");
      } else {
        await api.post("/saving-goals", payload);
        setSuccessMessage("Saving goal created.");
      }
      setErrorMessage(null);
      clearForm();
      await loadGoals(selectedAccountId);
    } catch (error: unknown) {
      console.error("Failed to save goal", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to save saving goal.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  async function handleDelete(goalId: string) {
    const confirmation = window.confirm(
      "This saving goal will be permanently deleted. Continue?",
    );
    if (!confirmation) return;

    try {
      setDeletingId(goalId);
      await api.delete(`/saving-goals/${goalId}`);
      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
      setErrorMessage(null);
      setSuccessMessage("Saving goal removed.");
      if (editingId === goalId) clearForm();
    } catch (error: unknown) {
      console.error("Failed to delete saving goal", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to delete saving goal.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMoveMoney(goal: savingGoal, type: MoveMoneyType) {
    if (!selectedAccountId || isMovingGoalId || isClosingGoalId) return;
    const amountRaw = movementAmounts[goal.id] ?? "";
    const amount = Number(amountRaw);
    const currentAmount = Number(goal.currentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage("Enter a valid amount greater than zero.");
      return;
    }

    if (type === "REMOVE" && amount > currentAmount) {
      setErrorMessage("Cannot remove more than current saved amount.");
      return;
    }

    if (type === "ADD" && accountBalance !== null && amount > accountBalance) {
      setErrorMessage("Insufficient account balance.");
      return;
    }

    try {
      setIsMovingGoalId(goal.id);
      await api.post(`/saving-goals/${goal.id}/move-money`, {
        amount,
        type,
      });
      setMovementAmounts((prev) => ({ ...prev, [goal.id]: "" }));
      setErrorMessage(null);
      setSuccessMessage(
        type === "ADD"
          ? "Money added to saving goal."
          : "Money moved back to account.",
      );
      await loadGoals(selectedAccountId);
    } catch (error: unknown) {
      console.error("Failed to move money on saving goal", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to move money.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setIsMovingGoalId(null);
    }
  }

  async function handleCloseGoal(goal: savingGoal) {
    if (!selectedAccountId || isMovingGoalId || isClosingGoalId) return;

    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const isCompleted = currentAmount >= targetAmount && targetAmount > 0;

    if (!isCompleted) {
      setErrorMessage("Goal must be completed before closing.");
      return;
    }

    const confirmation = window.confirm(
      "Move all saved money back to account and close this goal?",
    );
    if (!confirmation) return;

    try {
      setIsClosingGoalId(goal.id);
      if (currentAmount > 0) {
        await api.post(`/saving-goals/${goal.id}/move-money`, {
          amount: currentAmount,
          type: "REMOVE",
        });
      }
      await api.delete(`/saving-goals/${goal.id}`);
      setErrorMessage(null);
      setSuccessMessage("Goal closed and money moved to account.");
      await loadGoals(selectedAccountId);
    } catch (error: unknown) {
      console.error("Failed to close saving goal", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to close saving goal.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setIsClosingGoalId(null);
    }
  }

  if (isLoadingAccounts) {
    return <p className={styles.pageState}>Loading accounts...</p>;
  }

  if (accounts.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <section className="ui-card">
          <h2 className={styles.title}>Savings goals</h2>
          <p>Create an account first to start tracking savings goals.</p>
          <Link className="ui-btn" to="/create-account">
            Create account
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
        <h2 className={styles.title}>Savings goals</h2>
        <p className={styles.subtitle}>Create, update and track your goals by account.</p>

        <label className={styles.accountSelector} htmlFor="accountId">
          Account
          <select
            className="ui-control"
            id="accountId"
            value={selectedAccountId}
            onChange={(event) => {
              const nextAccountId = event.target.value;
              setSelectedAccountId(nextAccountId);
              if (location.pathname.startsWith("/accounts/")) {
                navigate(`/accounts/${nextAccountId}/savings`);
              }
            }}
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        {account && (
          <>
            <p className={styles.subtitle}>Currency: {account.currency}</p>
            {accountBalance !== null && (
              <p className={styles.subtitle}>
                Account balance:{" "}
                {new Intl.NumberFormat(navigator.language ?? "pt-PT", {
                  style: "currency",
                  currency: account.currency,
                }).format(accountBalance)}
              </p>
            )}
          </>
        )}
      </section>

      <section className={`${styles.reports} ui-card`}>
        <h3>Reports</h3>
        <div className={styles.reportGrid}>
          <article className={styles.reportItem}>
            <small>Total goals</small>
            <strong>{goals.length}</strong>
          </article>
          <article className={styles.reportItem}>
            <small>Completed goals</small>
            <strong>{reports.completedCount}</strong>
          </article>
          <article className={styles.reportItem}>
            <small>Overdue goals</small>
            <strong>{reports.overdueCount}</strong>
          </article>
          <article className={styles.reportItem}>
            <small>Overall completion</small>
            <strong>{reports.completionRate}%</strong>
          </article>
        </div>
      </section>

      <section className={`${styles.listSection} ui-card`}>
        <div className={styles.listHeader}>
          <h3>All goals ({goals.length})</h3>
          <button
            className="ui-btn"
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
              setIsFormOpen(true);
            }}
          >
            Create goal
          </button>
        </div>

        {isFormOpen && (
          <section className={styles.formSection}>
            <h3>{editingId ? "Edit saving goal" : "New saving goal"}</h3>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label htmlFor="title">
                Title
                <input
                  className="ui-control"
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </label>

              <label htmlFor="targetAmount">
                Target amount
                <input
                  className="ui-control"
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.targetAmount}
                  onChange={handleChange}
                  required
                />
              </label>

              <label htmlFor="currentAmount">
                Current amount
                <input
                  className="ui-control"
                  id="currentAmount"
                  name="currentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.currentAmount}
                  onChange={handleChange}
                  required
                />
              </label>

              <label htmlFor="deadline">
                Deadline
                <input
                  className="ui-control"
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleChange}
                />
              </label>

              <label className={styles.fieldWide} htmlFor="notes">
                Notes
                <textarea
                  className="ui-control"
                  id="notes"
                  name="notes"
                  maxLength={60}
                  value={form.notes}
                  onChange={handleChange}
                />
              </label>

              <div className={styles.formActions}>
                <button className="ui-btn" type="submit" disabled={isSaving}>
                  {isSaving
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                      ? "Update"
                      : "Create"}
                </button>
                <button
                  className={`${styles.secondaryBtn} ui-btn`}
                  type="button"
                  disabled={isSaving}
                  onClick={clearForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {isLoadingGoals ? (
          <p>Loading saving goals...</p>
        ) : goals.length === 0 ? (
          <p>No saving goals registered yet.</p>
        ) : (
          <div className={styles.list}>
            {goals.map((goal) => (
              <article className={styles.item} key={goal.id}>
                <SavingGoalCard goal={goal} currency={account?.currency ?? "EUR"} />
                <div className={styles.moneyActions}>
                  <input
                    className={`ui-control ${styles.moneyInput}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount"
                    value={movementAmounts[goal.id] ?? ""}
                    onChange={(event) =>
                      setMovementAmounts((prev) => ({
                        ...prev,
                        [goal.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    className="ui-btn"
                    type="button"
                    disabled={
                      isMovingGoalId === goal.id ||
                      isClosingGoalId === goal.id ||
                      (accountBalance !== null && accountBalance <= 0)
                    }
                    onClick={() => handleMoveMoney(goal, "ADD")}
                  >
                    {isMovingGoalId === goal.id ? "Moving..." : "Add money"}
                  </button>
                  <button
                    className={`${styles.secondaryBtn} ui-btn`}
                    type="button"
                    disabled={isMovingGoalId === goal.id || isClosingGoalId === goal.id}
                    onClick={() => handleMoveMoney(goal, "REMOVE")}
                  >
                    {isMovingGoalId === goal.id ? "Moving..." : "Remove money"}
                  </button>
                </div>
                <div className={styles.itemActions}>
                  <button
                    className={`${styles.secondaryBtn} ui-btn`}
                    type="button"
                    onClick={() => {
                      const targetAmountValue = Number(goal.targetAmount);
                      const currentAmountValue = Number(goal.currentAmount);
                      const deadlineValue = goal.deadline
                        ? new Date(goal.deadline).toISOString().slice(0, 10)
                        : "";
                      setEditingId(goal.id);
                      setForm({
                        title: goal.title,
                        targetAmount: Number.isFinite(targetAmountValue)
                          ? String(targetAmountValue)
                          : "",
                        currentAmount: Number.isFinite(currentAmountValue)
                          ? String(currentAmountValue)
                          : "0",
                        deadline: deadlineValue,
                        notes: goal.notes ?? "",
                      });
                      setIsFormOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.dangerBtn} ui-btn`}
                    type="button"
                    disabled={deletingId === goal.id}
                    onClick={() => handleDelete(goal.id)}
                  >
                    {deletingId === goal.id ? "Deleting..." : "Delete"}
                  </button>
                  {Number(goal.currentAmount) >= Number(goal.targetAmount) &&
                    Number(goal.targetAmount) > 0 && (
                      <button
                        className="ui-btn"
                        type="button"
                        disabled={
                          isClosingGoalId === goal.id ||
                          isMovingGoalId === goal.id ||
                          deletingId === goal.id
                        }
                        onClick={() => handleCloseGoal(goal)}
                      >
                        {isClosingGoalId === goal.id
                          ? "Closing..."
                          : "Close goal"}
                      </button>
                    )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ManageSavingGoalsPage;
