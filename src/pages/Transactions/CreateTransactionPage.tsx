import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import styles from "./CreateTransactionPage.module.css";
import api from "../../services/api";
import Skeleton from "../../components/Skeleton/Skeleton";
import SkeletonButton from "../../components/Skeleton/SkeletonButton";
import SkeletonCard from "../../components/Skeleton/SkeletonCard";
import SkeletonText from "../../components/Skeleton/SkeletonText";
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
import { getLocale } from "../../i18n/getLocale";
import {
  getCategoryLabel,
  getCurrencyLabel,
  getTransactionTypeLabel,
} from "../../utils/displayLabels";

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
).reduce(
  (accumulator, [key, label]) => {
    const category = key as Category;
    accumulator[category.toLowerCase()] = category;
    accumulator[label.toLowerCase()] = category;
    return accumulator;
  },
  {} as Record<string, Category>,
);

type TransactionForm = {
  title: string;
  amount: string;
  type: TransactionType;
  category: Category;
  date: string;
  notes: string;
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const createInitialForm = (
  type: TransactionType = "EXPENSE",
): TransactionForm => ({
  title: "",
  amount: "",
  type,
  category: "OTHERS",
  date: getTodayDate(),
  notes: "",
});

function CreateTransactionPage() {
  const { i18n, t } = useTranslation();
  const { accountId } = useParams<{ accountId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<TransactionForm>(() => createInitialForm());
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");

  const currentMember = useMemo(
    () => account?.users.find((member) => member.userId === currentUser?.id),
    [account?.users, currentUser?.id],
  );
  const canEditOrDelete =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const availableCategories =
    form.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const bulkExample = t("transactionsPage.example");
  const locale = getLocale(i18n.resolvedLanguage);
  const categoryOptions = useMemo(
    () =>
      [...new Set(transactions.map((transaction) => transaction.category))].sort(
        (left, right) =>
          getCategoryLabel(t, left).localeCompare(getCategoryLabel(t, right)),
      ),
    [t, transactions],
  );
  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      if (selectedCategory && transaction.category !== selectedCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const fields = [
        transaction.title,
        getTransactionTypeLabel(t, transaction.type),
        transaction.type,
        String(transaction.amount),
        getCategoryLabel(t, transaction.category),
        transaction.category,
        transaction.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [searchTerm, selectedCategory, t, transactions]);
  const selectedCategoryTotal = useMemo(() => {
    if (!selectedCategory) return null;

    return filteredTransactions.reduce((total, transaction) => {
      const amount = Number(transaction.amount);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);
  }, [filteredTransactions, selectedCategory]);
  const getCreatorName = (transaction: Transaction) => {
    if (typeof transaction.createdBy === "string") return transaction.createdBy;
    if (transaction.createdBy?.name) return transaction.createdBy.name;
    if (!transaction.createdById || !account) return undefined;
    return account.users.find(
      (member) => member.userId === transaction.createdById,
    )?.user.name;
  };
  const getUpdaterName = (transaction: Transaction) => {
    if (transaction.updatedBy?.name) return transaction.updatedBy.name;
    if (!transaction.updatedById || !account) return undefined;
    return account.users.find(
      (member) => member.userId === transaction.updatedById,
    )?.user.name;
  };

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
      setErrorMessage(t("transactionsPage.loadFailed"));
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
    setForm(createInitialForm());
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
      throw new Error(t("transactionsPage.bulkPasteRequired"));
    }

    return lines.map((line, index) => {
      const rowNumber = index + 1;
      const [
        titleRaw,
        amountRaw,
        typeRaw,
        categoryRaw,
        dateRaw = "",
        ...notesRaw
      ] = line.split(",");
      const notesValue = notesRaw.join(",").trim();
      const title = titleRaw?.trim();
      const amount = Number(amountRaw?.trim());
      const typeToken = typeRaw?.trim().toLowerCase();
      const categoryToken = categoryRaw?.trim().toLowerCase();
      const type =
        BULK_TYPE_ALIASES[typeToken] ??
        (typeRaw?.trim().toUpperCase() as TransactionType);
      const category =
        BULK_CATEGORY_ALIASES[categoryToken] ??
        (categoryRaw?.trim().toUpperCase() as Category);
      const date = dateRaw.trim();

      if (!title || !amountRaw || !typeRaw || !categoryRaw) {
        throw new Error(
          t("transactionsPage.bulkLineRequired", { row: rowNumber }),
        );
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          t("transactionsPage.bulkAmountInvalid", { row: rowNumber }),
        );
      }

      if (type !== "INCOME" && type !== "EXPENSE") {
        throw new Error(
          t("transactionsPage.bulkTypeInvalid", { row: rowNumber }),
        );
      }

      if (!ALL_CATEGORIES.includes(category)) {
        throw new Error(
          t("transactionsPage.bulkCategoryInvalid", {
            row: rowNumber,
            category: categoryRaw,
          }),
        );
      }

      if (date) {
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new Error(
            t("transactionsPage.bulkDateInvalid", {
              row: rowNumber,
              date,
            }),
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
      setErrorMessage(t("transactionsPage.amountInvalid"));
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
        setSuccessMessage(t("transactionsPage.updated"));
      } else {
        await api.post("/transactions", payload);
        setSuccessMessage(t("transactionsPage.created"));
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
            t("transactionsPage.saveFailed"),
        );
      } else {
        setErrorMessage(t("accounts.details.unexpected"));
      }
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();
    if (!accountId || isBulkSubmitting) return;

    let transactionsPayload: CreateTransactionBody[];
    try {
      transactionsPayload = parseBulkTransactions(bulkText, accountId);
    } catch (error: unknown) {
      setSuccessMessage(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("transactionsPage.bulkInvalid"),
      );
      return;
    }

    try {
      setIsBulkSubmitting(true);
      const response = await api.post<{ count: number }>("/transactions/bulk", {
        transactions: transactionsPayload,
      });
      setSuccessMessage(
        t("transactionsPage.bulkCreated", { count: response.data.count }),
      );
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
            t("transactionsPage.bulkSaveFailed"),
        );
      } else {
        setErrorMessage(t("accounts.details.unexpected"));
      }
      setSuccessMessage(null);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  async function handleDelete(transactionId: string) {
    if (!canEditOrDelete) return;
    const confirmation = window.confirm(t("transactionsPage.deleteConfirm"));
    if (!confirmation) return;

    try {
      setDeletingId(transactionId);
      await api.delete(`/transactions/${transactionId}`);
      setTransactions((prev) =>
        prev.filter((item) => item.id !== transactionId),
      );
      setSuccessMessage(t("transactionsPage.deleted"));
      setErrorMessage(null);
      if (editingId === transactionId) clearForm();
    } catch (error: unknown) {
      console.error("Failed to delete transaction", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("transactionsPage.deleteFailed"),
        );
      } else {
        setErrorMessage(t("accounts.details.unexpected"));
      }
      setSuccessMessage(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.pageContainer} aria-busy="true">
        <section className={`${styles.header} ui-card`}>
          <Skeleton width="42%" height={26} />
          <SkeletonText lines={1} widths={["24%"]} />
          <SkeletonButton width={140} />
        </section>

        <section className={`${styles.listSection} ui-card`}>
          <div className={styles.listHeader}>
            <Skeleton width="36%" height={20} />
            <SkeletonButton width={170} />
            <SkeletonButton width={140} />
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <SkeletonCard avatar lines={2} actionCount={2} />
            <SkeletonCard avatar lines={2} actionCount={2} />
            <SkeletonCard avatar lines={2} actionCount={2} />
          </div>
        </section>
      </div>
    );
  }

  if (!account || !accountId) {
    return <p className={styles.pageState}>{t("transactionsPage.notFound")}</p>;
  }

  const formattedSelectedCategoryTotal =
    selectedCategoryTotal === null
      ? null
      : new Intl.NumberFormat(locale, {
          style: "currency",
          currency: account.currency,
        }).format(selectedCategoryTotal);

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
        <h2 className={styles.title}>
          {t("transactionsPage.headerTitle", { name: account.name })}
        </h2>
        <p className={styles.subtitle}>
          {t("transactionsPage.headerSubtitle", {
            currency: getCurrencyLabel(t, account.currency),
          })}
        </p>
        <Link className="ui-btn" to={`/accounts/${accountId}`}>
          {t("common.backToAccount")}
        </Link>
      </section>

      <section className={`${styles.listSection} ui-card`}>
        <div className={styles.listHeader}>
          <h3>
            {t("transactionsPage.allTransactions", {
              count: filteredTransactions.length,
            })}
          </h3>
          <button
            className="ui-btn"
            type="button"
            onClick={() => {
              const typeFromQuery = searchParams.get("type");
              const nextType =
                typeFromQuery === "INCOME" || typeFromQuery === "EXPENSE"
                  ? typeFromQuery
                  : "EXPENSE";
              setForm(createInitialForm(nextType));
              setEditingId(null);
              setIsBulkMode(false);
              setIsFormOpen(true);
            }}
          >
            {t("transactionsPage.createTransaction")}
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
            {t("transactionsPage.createBulk")}
          </button>
        </div>

        {isFormOpen && (
          <section className={styles.formSection}>
            <h3>
              {editingId
                ? t("transactionsPage.editTransaction")
                : isBulkMode
                  ? t("transactionsPage.newTransactionsBulk")
                  : t("transactionsPage.newTransaction")}
            </h3>
            {!editingId && (
              <div className={styles.modeSwitch}>
                <button
                  className={`${!isBulkMode ? "ui-btn" : `${styles.secondaryBtn} ui-btn`}`}
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                >
                  {t("transactionsPage.single")}
                </button>
                <button
                  className={`${isBulkMode ? "ui-btn" : `${styles.secondaryBtn} ui-btn`}`}
                  type="button"
                  onClick={() => setIsBulkMode(true)}
                >
                  {t("transactionsPage.bulk")}
                </button>
              </div>
            )}
            {!isBulkMode ? (
              <form className={styles.form} onSubmit={handleSubmit}>
                <label htmlFor="title">
                  {t("transactionsPage.title")}
                  <input
                    className="ui-control"
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                  />
                </label>

                <label htmlFor="amount">
                  {t("transactionsPage.amount")}
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
                  {t("transactionsPage.type")}
                  <select
                    className="ui-control"
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="EXPENSE">
                      {getTransactionTypeLabel(t, "EXPENSE")}
                    </option>
                    <option value="INCOME">
                      {getTransactionTypeLabel(t, "INCOME")}
                    </option>
                  </select>
                  <span className={styles.enumAssist}>
                    <span className={styles.enumAssistText}>
                      {t("transactionsPage.typeFriendlyLabels")}
                    </span>
                    <span className={styles.tooltipWrap}>
                      <button
                        className={styles.tooltipTrigger}
                        type="button"
                        aria-label={t("transactionsPage.viewCodes")}
                      >
                        {t("transactionsPage.viewCodes")}
                      </button>
                      <span className={styles.tooltipBox} role="tooltip">
                        {getTransactionTypeLabel(t, "INCOME")}
                        {"\n"}
                        {getTransactionTypeLabel(t, "EXPENSE")}
                      </span>
                    </span>
                  </span>
                </label>

                <label htmlFor="category">
                  {t("transactionsPage.category")}
                  <select
                    className="ui-control"
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {getCategoryLabel(t, category)}
                      </option>
                    ))}
                  </select>
                  <span className={styles.enumAssist}>
                    <span className={styles.enumAssistText}>
                      {t("transactionsPage.categoryCodesHint")}
                    </span>
                    <span className={styles.tooltipWrap}>
                      <button
                        className={styles.tooltipTrigger}
                        type="button"
                        aria-label={t("transactionsPage.viewCodes")}
                      >
                        {t("transactionsPage.viewCodes")}
                      </button>
                      <span className={styles.tooltipBox} role="tooltip">
                        {availableCategories
                          .map((category) => `${getCategoryLabel(t, category)}`)
                          .join("\n")}
                      </span>
                    </span>
                  </span>
                </label>

                <label htmlFor="date">
                  {t("transactionsPage.date")}
                  <div className={styles.dateInputRow}>
                    <input
                      className="ui-control"
                      id="date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                    />
                    {/* <button
                      className={`${styles.secondaryBtn} ${styles.todayButton} ui-btn`}
                      type="button"
                      onClick={handleSetToday}
                    >
                      {t("common.today")}
                    </button> */}
                  </div>
                </label>

                <label htmlFor="notes" className={styles.fieldWide}>
                  {t("transactionsPage.notes")}
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
                  <button
                    className="ui-btn"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? editingId
                        ? t("transactionsPage.updating")
                        : t("transactionsPage.creating")
                      : editingId
                        ? t("transactionsPage.update")
                        : t("transactionsPage.create")}
                  </button>
                  <button
                    className={`${styles.secondaryBtn} ui-btn`}
                    type="button"
                    onClick={clearForm}
                    disabled={isSubmitting}
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <form className={styles.bulkForm} onSubmit={handleBulkSubmit}>
                <details className={styles.bulkGuide}>
                  <summary className={styles.bulkGuideSummary}>
                    {t("transactionsPage.bulkGuideTitle")}
                  </summary>
                  <div className={styles.bulkGuideContent}>
                    <p className={styles.bulkHint}>
                      {t("transactionsPage.bulkGuideFormat")}{" "}
                      <code>title,amount,type,category,date,notes</code>
                    </p>
                    <p className={styles.bulkHint}>
                      {t("transactionsPage.bulkGuideHint")}
                    </p>
                    <div className={styles.bulkAssistRow}>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          {t("transactionsPage.bulkRequiredFields")}
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          {t("transactionsPage.bulkRequiredValues")}
                        </span>
                      </span>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          {t("transactionsPage.bulkTypeOptions")}
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          {t("transactionTypes.incomeSimple")}
                          {"\n"}
                          {t("transactionTypes.expenseSimple")}
                        </span>
                      </span>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          {t("transactionsPage.bulkDateFormat")}
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          {t("transactionsPage.bulkDateExample")}
                        </span>
                      </span>
                      <span className={styles.tooltipWrap}>
                        <button className={styles.tooltipTrigger} type="button">
                          {t("transactionsPage.bulkCategoryOptions")}
                        </button>
                        <span className={styles.tooltipBox} role="tooltip">
                          {t("transactionTypes.incomeSimple")}:{"\n"}
                          {INCOME_CATEGORIES.map((category) =>
                            getCategoryLabel(t, category),
                          ).join(", ")}
                          {"\n\n"}
                          {t("transactionTypes.expenseSimple")}:{"\n"}
                          {EXPENSE_CATEGORIES.map((category) =>
                            getCategoryLabel(t, category),
                          ).join(", ")}
                        </span>
                      </span>
                    </div>
                  </div>
                </details>
                <button
                  className={`${styles.secondaryBtn} ui-btn`}
                  type="button"
                  onClick={() => setBulkText(bulkExample)}
                >
                  {t("transactionsPage.fillSample")}
                </button>
                <textarea
                  className={`ui-control ${styles.bulkInput}`}
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  placeholder={bulkExample}
                  required
                />
                <div className={styles.formActions}>
                  <button
                    className="ui-btn"
                    type="submit"
                    disabled={isBulkSubmitting}
                  >
                    {isBulkSubmitting
                      ? t("transactionsPage.creating")
                      : t("transactionsPage.createBulkSubmit")}
                  </button>
                  <button
                    className={`${styles.secondaryBtn} ui-btn`}
                    type="button"
                    onClick={clearForm}
                    disabled={isBulkSubmitting}
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <div className={styles.filters}>
          <label className={styles.filterField} htmlFor="transaction-search">
            {t("transactionsPage.search")}
            <input
              id="transaction-search"
              className="ui-control"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("transactionsPage.searchPlaceholder")}
            />
          </label>

          <label className={styles.filterField} htmlFor="transaction-category">
            {t("transactionsPage.filterCategory")}
            <select
              id="transaction-category"
              className="ui-control"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as Category | "")
              }
            >
              <option value="">{t("transactionsPage.allCategories")}</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(t, category)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {formattedSelectedCategoryTotal ? (
          <p className={styles.categoryTotal}>
            {t("transactionsPage.categoryTotal", {
              category: getCategoryLabel(t, selectedCategory as Category),
              amount: formattedSelectedCategoryTotal,
            })}
          </p>
        ) : null}

        {transactions.length === 0 ? (
          <p>{t("transactionsPage.noTransactions")}</p>
        ) : filteredTransactions.length === 0 ? (
          <p>{t("transactionsPage.noFilteredTransactions")}</p>
        ) : (
          <div className={styles.list}>
            {filteredTransactions.map((transaction) => (
              <article className={styles.item} key={transaction.id}>
                <TransactionCard
                  transaction={transaction}
                  currency={account.currency}
                  creatorName={getCreatorName(transaction)}
                  updaterName={getUpdaterName(transaction)}
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
