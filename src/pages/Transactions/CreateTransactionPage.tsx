import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import styles from "./CreateTransactionPage.module.css";
import api from "../../services/api";
import type {
  AccountDetail,
  Category,
  Transaction,
  TransactionType,
} from "../../types/account.types";
import Message from "../../components/Message/Message";
import TransactionCard from "../../components/TransactionCard/TransactionCard";
import { useAuth } from "../../hooks/useAuth";

const INCOME_CATEGORIES: Category[] = [
  "SALARY",
  "BONUS",
  "FREELANCE",
  "BUSINESS_REVENUE",
  "RENTAL_INCOME",
  "DIVIDENDS",
  "INTEREST",
  "REFUNDS",
  "GIFTS_RECEIVED",
  "OTHERS",
];

const EXPENSE_CATEGORIES: Category[] = [
  "HOUSING",
  "ELECTRICITY",
  "WATER",
  "GAS",
  "HOME_INTERNET",
  "MOBILE_PHONE",
  "GROCERIES",
  "RESTAURANTS_DELIVERY",
  "TRANSPORT_FUEL",
  "HEALTH_PHARMACY",
  "LEISURE_HOBBIES",
  "SUBSCRIPTIONS_STREAMING",
  "SHOPPING",
  "EDUCATION",
  "PERSONAL_CARE",
  "INVESTMENTS",
  "DEBT_INSTALLMENTS",
  "OTHERS",
];

type TransactionForm = {
  title: string;
  amount: string;
  type: TransactionType;
  category: Category;
  date: string;
  notes: string;
};

const initialForm: TransactionForm = {
  title: "",
  amount: "",
  type: "EXPENSE",
  category: "OTHERS",
  date: "",
  notes: "",
};

function CreateTransactionPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<TransactionForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const currentMember = useMemo(
    () => account?.users.find((member) => member.userId === currentUser?.id),
    [account?.users, currentUser?.id],
  );
  const canEditOrDelete =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const availableCategories =
    form.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function loadData() {
    if (!accountId) return;

    setIsLoading(true);
    try {
      const [accountResponse, transactionsResponse] = await Promise.all([
        api.get<Omit<AccountDetail, "transactions" | "savingGoals" | "_count">>(
          `/accounts/${accountId}`,
        ),
        api.get<Transaction[]>(`/transactions/account/${accountId}`),
      ]);

      const accountData = accountResponse.data;
      const accountTransactions = Array.isArray(transactionsResponse.data)
        ? transactionsResponse.data
        : [];

      setAccount({
        ...accountData,
        users: accountData.users ?? [],
        transactions: [],
        savingGoals: [],
        _count: {
          transactions: accountTransactions.length,
          savingGoals: 0,
        },
      });
      setTransactions(accountTransactions);
      setErrorMessage(null);
    } catch (error: unknown) {
      console.error("Failed to load account transactions", error);
      setErrorMessage("Failed to load transactions.");
      setAccount(null);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [accountId]);

  useEffect(() => {
    const editFromQuery = searchParams.get("edit");
    if (!editFromQuery) return;
    if (transactions.some((item) => item.id === editFromQuery)) {
      setEditingId(editFromQuery);
      setIsFormOpen(true);
    }
  }, [searchParams, transactions]);

  useEffect(() => {
    if (editingId) return;
    const typeFromQuery = searchParams.get("type");
    if (typeFromQuery === "INCOME" || typeFromQuery === "EXPENSE") {
      setForm((prev) => ({
        ...prev,
        type: typeFromQuery,
      }));
      setIsFormOpen(true);
    }
  }, [searchParams, editingId]);

  useEffect(() => {
    if (!editingId) return;
    const editingTransaction = transactions.find((item) => item.id === editingId);
    if (!editingTransaction) return;

    const amountValue = Number(editingTransaction.amount);
    const formattedDate = editingTransaction.date
      ? new Date(editingTransaction.date).toISOString().slice(0, 10)
      : "";

    setForm({
      title: editingTransaction.title,
      amount: Number.isFinite(amountValue) ? String(amountValue) : "",
      type: editingTransaction.type,
      category: editingTransaction.category,
      date: formattedDate,
      notes: editingTransaction.notes ?? "",
    });
  }, [editingId, transactions]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "type") {
      const nextType = value as TransactionType;
      const nextCategories =
        nextType === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setForm((prev) => ({
        ...prev,
        type: nextType,
        category: nextCategories.includes(prev.category)
          ? prev.category
          : nextCategories[0],
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsFormOpen(false);
    if (searchParams.get("edit")) {
      const next = new URLSearchParams(searchParams);
      next.delete("edit");
      setSearchParams(next);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!accountId || isSubmitting) return;

    const parsedAmount = Number(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Amount must be greater than zero.");
      return;
    }

    const normalizedTitle = form.title.trim() || form.category;

    const payload = {
      title: normalizedTitle,
      amount: parsedAmount,
      type: form.type,
      category: form.category,
      accountId,
      ...(form.date && { date: form.date }),
      ...(form.notes.trim() && { notes: form.notes.trim() }),
    };

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
        setSuccessMessage("Transaction updated.");
      } else {
        await api.post("/transactions", payload);
        setSuccessMessage("Transaction created.");
      }

      setErrorMessage(null);
      clearForm();
      await loadData();
    } catch (error: unknown) {
      console.error("Failed to save transaction", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to save transaction.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleDelete(transactionId: string) {
    if (!canEditOrDelete) return;
    const confirmation = window.confirm(
      "This transaction will be permanently deleted. Continue?",
    );
    if (!confirmation) return;

    try {
      setDeletingId(transactionId);
      await api.delete(`/transactions/${transactionId}`);
      setTransactions((prev) => prev.filter((item) => item.id !== transactionId));
      setSuccessMessage("Transaction removed.");
      setErrorMessage(null);
      if (editingId === transactionId) clearForm();
    } catch (error: unknown) {
      console.error("Failed to delete transaction", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to delete transaction.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <p className={styles.pageState}>Loading transactions...</p>;
  }

  if (!account || !accountId) {
    return <p className={styles.pageState}>Account not found.</p>;
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
        <h2 className={styles.title}>Transactions - {account.name}</h2>
        <p className={styles.subtitle}>Currency: {account.currency}</p>
        <Link className="ui-btn" to={`/accounts/${accountId}`}>
          Back to account
        </Link>
      </section>

      <section className={`${styles.listSection} ui-card`}>
        <div className={styles.listHeader}>
          <h3>All transactions ({transactions.length})</h3>
          <button
            className="ui-btn"
            type="button"
            onClick={() => {
              const typeFromQuery = searchParams.get("type");
              const nextType =
                typeFromQuery === "INCOME" || typeFromQuery === "EXPENSE"
                  ? typeFromQuery
                  : "EXPENSE";
              setForm({ ...initialForm, type: nextType });
              setEditingId(null);
              setIsFormOpen(true);
            }}
          >
            Create transaction
          </button>
        </div>

        {isFormOpen && (
          <section className={styles.formSection}>
            <h3>{editingId ? "Edit transaction" : "New transaction"}</h3>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label htmlFor="title">
                Title
                <input
                  className="ui-control"
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="amount">
                Amount
                <input
                  className="ui-control"
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </label>

              <label htmlFor="type">
                Type
                <select
                  className="ui-control"
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </label>

              <label htmlFor="category">
                Category
                <select
                  className="ui-control"
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="date">
                Date
                <input
                  className="ui-control"
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="notes" className={styles.fieldWide}>
                Notes
                <textarea
                  className="ui-control"
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                />
              </label>

              <div className={styles.formActions}>
                <button className="ui-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting
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
                  onClick={clearForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {transactions.length === 0 ? (
          <p>No transactions registered yet.</p>
        ) : (
          <div className={styles.list}>
            {transactions.map((transaction) => (
              <article className={styles.item} key={transaction.id}>
                <TransactionCard
                  transaction={transaction}
                  currency={account.currency}
                  onEdit={
                    canEditOrDelete
                      ? () => {
                          setEditingId(transaction.id);
                          const next = new URLSearchParams(searchParams);
                          next.set("edit", transaction.id);
                          setSearchParams(next);
                          setIsFormOpen(true);
                        }
                      : undefined
                  }
                  onDelete={
                    canEditOrDelete
                      ? () => handleDelete(transaction.id)
                      : undefined
                  }
                  isDeleting={deletingId === transaction.id}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CreateTransactionPage;
