import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import styles from "./CreateTransactionPage.module.css";
import api from "../../services/api";
import type {
  AccountDetail,
  Category,
  CreateTransactionBody,
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

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

const TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Income (Entry)",
  EXPENSE: "Expense (Outflow)",
};

const CATEGORY_LABELS: Record<Category, string> = {
  SALARY: "Salary",
  BONUS: "Bonus",
  FREELANCE: "Freelance",
  BUSINESS_REVENUE: "Business Revenue",
  RENTAL_INCOME: "Rental Income",
  DIVIDENDS: "Dividends",
  INTEREST: "Interest",
  REFUNDS: "Refunds",
  GIFTS_RECEIVED: "Gifts Received",
  HOUSING: "Housing",
  ELECTRICITY: "Electricity",
  WATER: "Water",
  GAS: "Gas",
  HOME_INTERNET: "Home Internet",
  MOBILE_PHONE: "Mobile Phone",
  GROCERIES: "Groceries",
  RESTAURANTS_DELIVERY: "Restaurants and Delivery",
  TRANSPORT_FUEL: "Transport and Fuel",
  HEALTH_PHARMACY: "Health and Pharmacy",
  LEISURE_HOBBIES: "Leisure and Hobbies",
  SUBSCRIPTIONS_STREAMING: "Subscriptions and Streaming",
  SHOPPING: "Shopping",
  EDUCATION: "Education",
  PERSONAL_CARE: "Personal Care",
  INVESTMENTS: "Investments",
  DEBT_INSTALLMENTS: "Debt Installments",
  OTHERS: "Others",
};

const BULK_TYPE_ALIASES: Record<string, TransactionType> = {
  income: "INCOME",
  receita: "INCOME",
  entry: "INCOME",
  expense: "EXPENSE",
  despesa: "EXPENSE",
  outflow: "EXPENSE",
};

const BULK_CATEGORY_ALIASES: Record<string, Category> = Object.entries(
  CATEGORY_LABELS,
).reduce((accumulator, [key, label]) => {
  const category = key as Category;
  accumulator[category.toLowerCase()] = category;
  accumulator[label.toLowerCase()] = category;
  return accumulator;
}, {} as Record<string, Category>);

const BULK_EXAMPLE = `Salary,1500,Income,Salary,2026-03-01,Monthly salary
Groceries,120.50,Expense,Groceries,2026-03-02,Weekly supermarket`;

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
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

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
    const editingTransaction = transactions.find(
      (item) => item.id === editingId,
    );
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
    setIsBulkMode(false);
    setBulkText("");
    if (searchParams.get("edit")) {
      const next = new URLSearchParams(searchParams);
      next.delete("edit");
      setSearchParams(next);
    }
  };

  const parseBulkTransactions = (
    rawText: string,
    targetAccountId: string,
  ): CreateTransactionBody[] => {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new Error("Paste at least one transaction line.");
    }

    return lines.map((line, index) => {
      const rowNumber = index + 1;
      const [titleRaw, amountRaw, typeRaw, categoryRaw, dateRaw = "", ...notesRaw] =
        line.split(",");
      const notesValue = notesRaw.join(",").trim();
      const title = titleRaw?.trim();
      const amount = Number(amountRaw?.trim());
      const typeToken = typeRaw?.trim().toLowerCase();
      const categoryToken = categoryRaw?.trim().toLowerCase();
      const type = BULK_TYPE_ALIASES[typeToken] ?? (typeRaw?.trim().toUpperCase() as TransactionType);
      const category =
        BULK_CATEGORY_ALIASES[categoryToken] ??
        (categoryRaw?.trim().toUpperCase() as Category);
      const date = dateRaw.trim();

      if (!title || !amountRaw || !typeRaw || !categoryRaw) {
        throw new Error(
          `Line ${rowNumber}: use format "title,amount,type,category,date,notes".`,
        );
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Line ${rowNumber}: amount must be greater than zero.`);
      }

      if (type !== "INCOME" && type !== "EXPENSE") {
        throw new Error(
          `Line ${rowNumber}: type must be Income or Expense.`,
        );
      }

      if (!ALL_CATEGORIES.includes(category)) {
        throw new Error(
          `Line ${rowNumber}: category "${categoryRaw}" is not recognized.`,
        );
      }

      if (date) {
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new Error(
            `Line ${rowNumber}: invalid date "${date}". Use YYYY-MM-DD.`,
          );
        }
      }

      return {
        title,
        amount,
        type,
        category,
        accountId: targetAccountId,
        ...(date && { date }),
        ...(notesValue && { notes: notesValue }),
      };
    });
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

  const handleBulkSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!accountId || isBulkSubmitting) return;

    let transactionsPayload: CreateTransactionBody[];
    try {
      transactionsPayload = parseBulkTransactions(bulkText, accountId);
    } catch (error: unknown) {
      setSuccessMessage(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Invalid bulk input.",
      );
      return;
    }

    try {
      setIsBulkSubmitting(true);
      const response = await api.post<{ count: number }>("/transactions/bulk", {
        transactions: transactionsPayload,
      });
      setSuccessMessage(`${response.data.count} transaction(s) created.`);
      setErrorMessage(null);
      setBulkText("");
      setIsFormOpen(false);
      setIsBulkMode(false);
      await loadData();
    } catch (error: unknown) {
      console.error("Failed to create bulk transactions", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed to create transactions in bulk.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage(null);
    } finally {
      setIsBulkSubmitting(false);
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
      setTransactions((prev) =>
        prev.filter((item) => item.id !== transactionId),
      );
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
              setIsBulkMode(false);
              setIsFormOpen(true);
            }}
          >
            Create transaction
          </button>
          <button
            className={`${styles.secondaryBtn} ui-btn`}
            type="button"
            onClick={() => {
              setEditingId(null);
              setIsBulkMode(true);
              setIsFormOpen(true);
            }}
          >
            Create in bulk
          </button>
        </div>

        {isFormOpen && (
          <section className={styles.formSection}>
            <h3>
              {editingId
                ? "Edit transaction"
                : isBulkMode
                  ? "New transactions (bulk)"
                  : "New transaction"}
            </h3>
            {!editingId && (
              <div className={styles.modeSwitch}>
                <button
                  className={`${!isBulkMode ? "ui-btn" : `${styles.secondaryBtn} ui-btn`}`}
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                >
                  Single
                </button>
                <button
                  className={`${isBulkMode ? "ui-btn" : `${styles.secondaryBtn} ui-btn`}`}
                  type="button"
                  onClick={() => setIsBulkMode(true)}
                >
                  Bulk
                </button>
              </div>
            )}
            {!isBulkMode ? (
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
                    <option value="EXPENSE">{TYPE_LABELS.EXPENSE}</option>
                    <option value="INCOME">{TYPE_LABELS.INCOME}</option>
                  </select>
                  <span className={styles.enumAssist}>
                    <span className={styles.enumAssistText}>
                      Friendly labels are shown.
                    </span>
                    <span className={styles.tooltipWrap}>
                      <button
                        className={styles.tooltipTrigger}
                        type="button"
                        aria-label="Show enum codes for type"
                      >
                        View codes
                      </button>
                      <span className={styles.tooltipBox} role="tooltip">
                        {"Income (Entry) -> INCOME"}
                        {"\n"}
                        {"Expense (Outflow) -> EXPENSE"}
                      </span>
                    </span>
                  </span>
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
                        {CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                  <span className={styles.enumAssist}>
                    <span className={styles.enumAssistText}>
                      Hover/touch to see category codes.
                    </span>
                    <span className={styles.tooltipWrap}>
                      <button
                        className={styles.tooltipTrigger}
                        type="button"
                        aria-label="Show enum codes for categories"
                      >
                        View codes
                      </button>
                      <span className={styles.tooltipBox} role="tooltip">
                        {availableCategories
                          .map(
                            (category) =>
                              `${CATEGORY_LABELS[category]} -> ${category}`,
                          )
                          .join("\n")}
                      </span>
                    </span>
                  </span>
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
                  <button
                    className="ui-btn"
                    type="submit"
                    disabled={isSubmitting}
                  >
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
            ) : (
              <form className={styles.bulkForm} onSubmit={handleBulkSubmit}>
                <details className={styles.bulkGuide}>
                  <summary className={styles.bulkGuideSummary}>
                    How to fill bulk transactions
                  </summary>
                  <div className={styles.bulkGuideContent}>
                    <p className={styles.bulkHint}>
                      Use one line per transaction with this order:
                      {" "}
                      <code>title,amount,type,category,date,notes</code>
                    </p>
                    <p className={styles.bulkHint}>
                      Hover the labels below or tap them on mobile to view
                      accepted options.
                    </p>
                    <div className={styles.bulkAssistRow}>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          Required fields
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          title, amount, type, category
                        </span>
                      </span>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          Type options
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          {"Income -> INCOME"}
                          {"\n"}
                          {"Expense -> EXPENSE"}
                        </span>
                      </span>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          Date format
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          Use YYYY-MM-DD{"\n"}
                          Example: 2026-03-06
                        </span>
                      </span>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          Category options
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          Income:{"\n"}
                          {INCOME_CATEGORIES.map(
                            (category) => CATEGORY_LABELS[category],
                          ).join(", ")}
                          {"\n\n"}
                          Expense:{"\n"}
                          {EXPENSE_CATEGORIES.map(
                            (category) => CATEGORY_LABELS[category],
                          ).join(", ")}
                        </span>
                      </span>
                    </div>
                  </div>
                </details>
                <button
                  className={`${styles.secondaryBtn} ui-btn`}
                  type="button"
                  onClick={() => setBulkText(BULK_EXAMPLE)}
                >
                  Fill sample lines
                </button>
                <textarea
                  className={`ui-control ${styles.bulkInput}`}
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  placeholder={BULK_EXAMPLE}
                  required
                />
                <div className={styles.formActions}>
                  <button
                    className="ui-btn"
                    type="submit"
                    disabled={isBulkSubmitting}
                  >
                    {isBulkSubmitting ? "Creating..." : "Create in bulk"}
                  </button>
                  <button
                    className={`${styles.secondaryBtn} ui-btn`}
                    type="button"
                    onClick={clearForm}
                    disabled={isBulkSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
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
