import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ExcelJS from "exceljs";
import { RiFileExcel2Line } from "react-icons/ri";
import Skeleton from "../../components/Skeleton/Skeleton";
import SkeletonCard from "../../components/Skeleton/SkeletonCard";
import SkeletonText from "../../components/Skeleton/SkeletonText";
import ExpensesByCategoryChart from "../../components/charts/ExpensesByCategoryChart";
import IncomeByCategoryChart from "../../components/charts/IncomeByCategoryChart";
import IncomeExpenseChart from "../../components/charts/IncomeExpenseChart";
import SavingsGoalsChart from "../../components/charts/SavingsGoalsChart";
import BalanceHistoryChart from "../../components/charts/BalanceHistoryChart";
import {
  expenseChartColors,
  incomeChartColors,
} from "../../components/charts/categoryChartColors";
import ChartLegend from "../../components/reports/ChartLegend";
import Message from "../../components/Message/Message";
import api from "../../services/api";
import type {
  AccountSummary,
  Category,
  Currency,
  savingGoal,
  Transaction,
} from "../../types/account.types";
import { getLocale } from "../../i18n/getLocale";
import { getCategoryLabel, getCurrencyLabel } from "../../utils/displayLabels";
import styles from "./ReportsPage.module.css";

type SummaryResponse = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  period: string;
};

type ExpenseAnalyticsResponse = {
  totalExpenses: number;
  categories: CategoryTotal[];
};

type CategoryTotal = {
  category: string;
  total: number;
};

type SavingsGoalReport = {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  depositAmount: number;
  withdrawalAmount: number;
  movements: SavingsGoalMovement[];
};

type SavingsGoalMovement = {
  date: string;
  depositAmount: number;
  withdrawalAmount: number;
  cumulativeAmount: number;
};

type BalanceHistoryPoint = {
  date: string;
  balance: number;
};

function toNumber(value: number | string | null | undefined) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeCategoryTotals(items: CategoryTotal[]) {
  return items
    .map((item) => ({
      category: item.category,
      total: toNumber(item.total),
    }))
    .filter((item) => item.total > 0);
}

function buildIncomeCategories(transactions: Transaction[]) {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (transaction.type !== "INCOME") return;

    const amount = toNumber(transaction.amount);
    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) + amount,
    );
  });

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((left, right) => right.total - left.total);
}

function buildBalanceHistory(transactions: Transaction[]) {
  const dailyTotals = new Map<string, number>();

  transactions.forEach((transaction) => {
    const dateValue = new Date(transaction.date);

    if (Number.isNaN(dateValue.getTime())) return;

    const dateKey = dateValue.toISOString().slice(0, 10);
    const amount = toNumber(transaction.amount);
    const signedAmount = transaction.type === "INCOME" ? amount : -amount;

    dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + signedAmount);
  });

  let runningBalance = 0;

  return Array.from(dailyTotals.entries())
    .sort(
      ([leftDate], [rightDate]) =>
        new Date(leftDate).getTime() - new Date(rightDate).getTime(),
    )
    .map(([date, balanceDelta]) => {
      runningBalance += balanceDelta;

      return {
        date,
        balance: Number(runningBalance.toFixed(2)),
      };
    });
}

function buildSavingsGoalReports(
  goals: savingGoal[],
  transactions: Transaction[],
): SavingsGoalReport[] {
  const deposits = new Map<string, number>();
  const withdrawals = new Map<string, number>();
  const movementsByGoal = new Map<
    string,
    Map<string, { depositAmount: number; withdrawalAmount: number }>
  >();

  transactions.forEach((transaction) => {
    const amount = toNumber(transaction.amount);
    const dateValue = new Date(transaction.date);
    const dateKey = Number.isNaN(dateValue.getTime())
      ? ""
      : dateValue.toISOString().slice(0, 10);

    if (transaction.title.startsWith("Transfer to saving goal: ")) {
      const goalName = transaction.title.replace(
        "Transfer to saving goal: ",
        "",
      );
      deposits.set(goalName, (deposits.get(goalName) ?? 0) + amount);
      if (dateKey) {
        const goalMovements = movementsByGoal.get(goalName) ?? new Map();
        const dateMovements = goalMovements.get(dateKey) ?? {
          depositAmount: 0,
          withdrawalAmount: 0,
        };

        dateMovements.depositAmount += amount;
        goalMovements.set(dateKey, dateMovements);
        movementsByGoal.set(goalName, goalMovements);
      }
    }

    if (transaction.title.startsWith("Transfer from saving goal: ")) {
      const goalName = transaction.title.replace(
        "Transfer from saving goal: ",
        "",
      );
      withdrawals.set(goalName, (withdrawals.get(goalName) ?? 0) + amount);
      if (dateKey) {
        const goalMovements = movementsByGoal.get(goalName) ?? new Map();
        const dateMovements = goalMovements.get(dateKey) ?? {
          depositAmount: 0,
          withdrawalAmount: 0,
        };

        dateMovements.withdrawalAmount += amount;
        goalMovements.set(dateKey, dateMovements);
        movementsByGoal.set(goalName, goalMovements);
      }
    }
  });

  return goals.map((goal) => {
    const currentAmount = toNumber(goal.currentAmount);
    const targetAmount = toNumber(goal.targetAmount);
    const depositAmount = deposits.get(goal.title) ?? 0;
    const withdrawalAmount = withdrawals.get(goal.title) ?? 0;
    const baselineAmount = currentAmount - (depositAmount - withdrawalAmount);
    let runningAmount = baselineAmount;

    const movements = Array.from(
      (movementsByGoal.get(goal.title) ?? new Map()).entries(),
    )
      .sort(
        ([leftDate], [rightDate]) =>
          new Date(leftDate).getTime() - new Date(rightDate).getTime(),
      )
      .map(([date, movement]) => {
        runningAmount += movement.depositAmount - movement.withdrawalAmount;

        return {
          date,
          depositAmount: Number(movement.depositAmount.toFixed(2)),
          withdrawalAmount: Number(movement.withdrawalAmount.toFixed(2)),
          cumulativeAmount: Number(runningAmount.toFixed(2)),
        };
      });

    return {
      id: goal.id,
      name: goal.title,
      currentAmount,
      targetAmount,
      depositAmount,
      withdrawalAmount,
      movements,
    };
  });
}

function ReportsPage() {
  const { i18n, t } = useTranslation();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<CategoryTotal[]>(
    [],
  );
  const [incomeCategories, setIncomeCategories] = useState<CategoryTotal[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalReport[]>([]);
  const [selectedSavingsGoalId, setSelectedSavingsGoalId] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryPoint[]>(
    [],
  );
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const locale = getLocale(i18n.resolvedLanguage);
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );
  const reportCurrency: Currency = selectedAccount?.currency ?? "EUR";
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: reportCurrency,
    }).format(value);
  const totalExpenseCategories = useMemo(
    () => expenseCategories.reduce((total, item) => total + item.total, 0),
    [expenseCategories],
  );
  const totalIncomeCategories = useMemo(
    () => incomeCategories.reduce((total, item) => total + item.total, 0),
    [incomeCategories],
  );
  const savingsTotals = useMemo(
    () =>
      savingsGoals.reduce(
        (totals, goal) => ({
          current: totals.current + goal.currentAmount,
          target: totals.target + goal.targetAmount,
          deposits: totals.deposits + goal.depositAmount,
          withdrawals: totals.withdrawals + goal.withdrawalAmount,
        }),
        {
          current: 0,
          target: 0,
          deposits: 0,
          withdrawals: 0,
        },
      ),
    [savingsGoals],
  );
  const selectedSavingsGoal = useMemo(
    () =>
      savingsGoals.find((goal) => goal.id === selectedSavingsGoalId) ??
      savingsGoals[0] ??
      null,
    [savingsGoals, selectedSavingsGoalId],
  );
  const selectedSavingsGoalProgress = useMemo(() => {
    if (!selectedSavingsGoal) return 0;

    if (selectedSavingsGoal.targetAmount <= 0) {
      return 0;
    }

    return Math.min(
      (selectedSavingsGoal.currentAmount / selectedSavingsGoal.targetAmount) *
        100,
      100,
    );
  }, [selectedSavingsGoal]);
  const selectedSavingsGoalHue = useMemo(
    () => Math.round((selectedSavingsGoalProgress / 100) * 120),
    [selectedSavingsGoalProgress],
  );

  const currencyNumberFormat = `"${reportCurrency}" #,##0.00`;
  const formatDateTime = (value: string | Date | null | undefined) => {
    if (!value) return "-";

    const parsedValue = new Date(value);
    if (Number.isNaN(parsedValue.getTime())) return "-";

    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsedValue);
  };
  const getTransactionCreatorName = (transaction: Transaction) => {
    if (typeof transaction.createdBy === "string") return transaction.createdBy;
    if (transaction.createdBy?.name) return transaction.createdBy.name;
    return "-";
  };
  const getTransactionUpdaterName = (transaction: Transaction) => {
    if (transaction.updatedBy?.name) return transaction.updatedBy.name;
    return transaction.updatedById ? t("reportsPage.unknownEditor") : "-";
  };

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setIsLoadingAccounts(true);
        const response = await api.get<AccountSummary[]>("/accounts");
        const accountList = Array.isArray(response.data) ? response.data : [];

        setAccounts(accountList);
        setSelectedAccountId(accountList[0]?.id ?? "");
        setErrorMessage(null);
      } catch (error: unknown) {
        console.error("Failed to load accounts", error);
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.errorMessage ??
              error.response?.data?.message ??
              t("reportsPage.loadAccountsFailed"),
          );
        } else {
          setErrorMessage(t("reportsPage.loadAccountsFailed"));
        }
        setAccounts([]);
        setSelectedAccountId("");
      } finally {
        setIsLoadingAccounts(false);
      }
    }

    fetchAccounts();
  }, [t]);

  useEffect(() => {
    async function fetchCharts(accountId: string) {
      try {
        setIsLoadingCharts(true);
        const [
          summaryResponse,
          expenseAnalyticsResponse,
          transactionsResponse,
          savingsGoalsResponse,
        ] = await Promise.all([
          api.get<SummaryResponse>(`/transactions/summary/${accountId}`),
          api.get<ExpenseAnalyticsResponse>(
            `/transactions/analytics/${accountId}`,
          ),
          api.get<Transaction[]>(`/transactions/account/${accountId}`),
          api.get<savingGoal[]>(`/saving-goals/account/${accountId}`),
        ]);

        const accountTransactions = Array.isArray(transactionsResponse.data)
          ? transactionsResponse.data
          : [];
        const expenseCategoriesData = Array.isArray(
          expenseAnalyticsResponse.data?.categories,
        )
          ? expenseAnalyticsResponse.data.categories
          : [];

        setSummary({
          totalIncome: toNumber(summaryResponse.data?.totalIncome),
          totalExpense: toNumber(summaryResponse.data?.totalExpense),
          balance: toNumber(summaryResponse.data?.balance),
          transactionCount: toNumber(summaryResponse.data?.transactionCount),
          period: summaryResponse.data?.period ?? "all-time",
        });
        setExpenseCategories(normalizeCategoryTotals(expenseCategoriesData));
        setIncomeCategories(buildIncomeCategories(accountTransactions));
        setTransactions(accountTransactions);
        setSavingsGoals(
          Array.isArray(savingsGoalsResponse.data)
            ? buildSavingsGoalReports(
                savingsGoalsResponse.data,
                accountTransactions,
              )
            : [],
        );
        setBalanceHistory(buildBalanceHistory(accountTransactions));
        setErrorMessage(null);
      } catch (error: unknown) {
        console.error("Failed to load reports", error);
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.errorMessage ??
              error.response?.data?.message ??
              t("reportsPage.loadReportsFailed"),
          );
        } else {
          setErrorMessage(t("reportsPage.loadReportsFailed"));
        }
        setSummary(null);
        setExpenseCategories([]);
        setIncomeCategories([]);
        setSavingsGoals([]);
        setTransactions([]);
        setBalanceHistory([]);
      } finally {
        setIsLoadingCharts(false);
      }
    }

    if (!selectedAccountId) {
      setSummary(null);
      setExpenseCategories([]);
      setIncomeCategories([]);
      setSavingsGoals([]);
      setTransactions([]);
      setBalanceHistory([]);
      return;
    }

    fetchCharts(selectedAccountId);
  }, [selectedAccountId, t]);

  useEffect(() => {
    if (savingsGoals.length === 0) {
      setSelectedSavingsGoalId("");
      return;
    }

    if (!savingsGoals.some((goal) => goal.id === selectedSavingsGoalId)) {
      setSelectedSavingsGoalId(savingsGoals[0].id);
    }
  }, [savingsGoals, selectedSavingsGoalId]);

  const handleExportExcel = async () => {
    if (!selectedAccount) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Finance Tracker";
    workbook.created = new Date();

    const styleTitleRow = (
      worksheet: ExcelJS.Worksheet,
      lastColumn: number,
    ) => {
      worksheet.mergeCells(1, 1, 1, lastColumn);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.font = { bold: true, size: 15, color: { argb: "FF0F172A" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };
    };

    const styleHeaderRow = (row: ExcelJS.Row) => {
      row.font = { bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE11D48" },
      };
    };

    const addTableSheet = ({
      name,
      title,
      columns,
      rows,
      currencyColumns = [],
    }: {
      name: string;
      title: string;
      columns: Array<{ header: string; key: string; width: number }>;
      rows: Array<Record<string, string | number>>;
      currencyColumns?: string[];
    }) => {
      const worksheet = workbook.addWorksheet(name);
      worksheet.columns = columns;
      worksheet.getCell("A1").value = title;
      styleTitleRow(worksheet, columns.length);
      worksheet.addRow([]);
      const headerRow = worksheet.addRow(
        columns.map((column) => column.header),
      );
      styleHeaderRow(headerRow);

      rows.forEach((rowData) => {
        const row = worksheet.addRow(
          columns.map((column) => rowData[column.key]),
        );
        columns.forEach((column, index) => {
          if (currencyColumns.includes(column.key)) {
            row.getCell(index + 1).numFmt = currencyNumberFormat;
          }
        });
      });

      worksheet.views = [{ state: "frozen", ySplit: 3 }];
      worksheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: 3, column: columns.length },
      };
    };

    addTableSheet({
      name: t("reportsPage.summarySheet"),
      title: t("reportsPage.summarySheet"),
      columns: [
        { header: t("reportsPage.summaryMetric"), key: "metric", width: 30 },
        { header: t("reportsPage.summaryValue"), key: "value", width: 22 },
      ],
      rows: [
        {
          metric: t("reportsPage.totalIncome"),
          value: summary?.totalIncome ?? 0,
        },
        {
          metric: t("reportsPage.totalExpenses"),
          value: summary?.totalExpense ?? 0,
        },
        { metric: t("reportsPage.netBalance"), value: summary?.balance ?? 0 },
        {
          metric: t("reportsPage.transactionCount"),
          value: summary?.transactionCount ?? 0,
        },
        {
          metric: t("reportsPage.expenseCategoriesTotal"),
          value: totalExpenseCategories,
        },
        {
          metric: t("reportsPage.incomeCategoriesTotal"),
          value: totalIncomeCategories,
        },
        { metric: t("reportsPage.totalSaved"), value: savingsTotals.current },
        { metric: t("reportsPage.totalTarget"), value: savingsTotals.target },
        {
          metric: t("reportsPage.totalDeposits"),
          value: savingsTotals.deposits,
        },
        {
          metric: t("reportsPage.totalWithdrawals"),
          value: savingsTotals.withdrawals,
        },
      ],
      currencyColumns: ["value"],
    });

    addTableSheet({
      name: t("reportsPage.incomeVsExpensesSheet"),
      title: t("reportsPage.incomeVsExpenses"),
      columns: [
        { header: t("reportsPage.summaryMetric"), key: "label", width: 30 },
        { header: t("charts.amount"), key: "amount", width: 22 },
      ],
      rows: [
        { label: t("charts.income"), amount: summary?.totalIncome ?? 0 },
        { label: t("charts.expenses"), amount: summary?.totalExpense ?? 0 },
      ],
      currencyColumns: ["amount"],
    });

    addTableSheet({
      name: t("reportsPage.expensesByCategorySheet"),
      title: t("reportsPage.expensesByCategory"),
      columns: [
        { header: t("transactionsPage.category"), key: "category", width: 34 },
        { header: t("charts.amount"), key: "total", width: 22 },
      ],
      rows: expenseCategories.map((item) => ({
        category: getCategoryLabel(t, item.category as Category),
        total: item.total,
      })),
      currencyColumns: ["total"],
    });

    addTableSheet({
      name: t("reportsPage.incomeByCategorySheet"),
      title: t("reportsPage.incomeByCategory"),
      columns: [
        { header: t("transactionsPage.category"), key: "category", width: 34 },
        { header: t("charts.amount"), key: "total", width: 22 },
      ],
      rows: incomeCategories.map((item) => ({
        category: getCategoryLabel(t, item.category as Category),
        total: item.total,
      })),
      currencyColumns: ["total"],
    });

    addTableSheet({
      name: t("reportsPage.savingGoalsSheet"),
      title: t("reportsPage.savingsGoalsProgress"),
      columns: [
        { header: t("common.title"), key: "goal", width: 32 },
        { header: t("charts.currentSaved"), key: "currentAmount", width: 18 },
        { header: t("charts.targetAmount"), key: "targetAmount", width: 18 },
        { header: t("charts.deposits"), key: "deposits", width: 18 },
        { header: t("charts.withdrawals"), key: "withdrawals", width: 18 },
      ],
      rows: savingsGoals.map((goal) => ({
        goal: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        deposits: goal.depositAmount,
        withdrawals: goal.withdrawalAmount,
      })),
      currencyColumns: [
        "currentAmount",
        "targetAmount",
        "deposits",
        "withdrawals",
      ],
    });

    addTableSheet({
      name: t("reportsPage.savingGoalMovementsSheet"),
      title: t("reportsPage.savingGoalMovementsSheet"),
      columns: [
        { header: t("common.title"), key: "goal", width: 28 },
        { header: t("common.date"), key: "date", width: 18 },
        { header: t("charts.deposits"), key: "deposits", width: 18 },
        { header: t("charts.withdrawals"), key: "withdrawals", width: 18 },
        { header: t("charts.currentSaved"), key: "cumulative", width: 20 },
      ],
      rows: savingsGoals.flatMap((goal) =>
        goal.movements.map((movement) => ({
          goal: goal.name,
          date: movement.date,
          deposits: movement.depositAmount,
          withdrawals: movement.withdrawalAmount,
          cumulative: movement.cumulativeAmount,
        })),
      ),
      currencyColumns: ["deposits", "withdrawals", "cumulative"],
    });

    addTableSheet({
      name: t("reportsPage.transactionsSheet"),
      title: t("reportsPage.transactionsSheet"),
      columns: [
        { header: t("common.title"), key: "title", width: 28 },
        { header: t("transactionsPage.amount"), key: "amount", width: 18 },
        { header: t("transactionsPage.type"), key: "type", width: 18 },
        { header: t("transactionsPage.category"), key: "category", width: 28 },
        { header: t("reportsPage.transactionDate"), key: "date", width: 22 },
        { header: t("reportsPage.createdBy"), key: "createdBy", width: 22 },
        { header: t("reportsPage.editedAt"), key: "updatedAt", width: 22 },
        { header: t("reportsPage.editedBy"), key: "updatedBy", width: 22 },
        { header: t("transactionsPage.notes"), key: "notes", width: 30 },
      ],
      rows: transactions.map((transaction) => ({
        title: transaction.title,
        amount: toNumber(transaction.amount),
        type: transaction.type,
        category: getCategoryLabel(t, transaction.category),
        date: formatDateTime(transaction.date),
        createdBy: getTransactionCreatorName(transaction),
        updatedAt: formatDateTime(transaction.updatedAt),
        updatedBy: getTransactionUpdaterName(transaction),
        notes: transaction.notes ?? "-",
      })),
      currencyColumns: ["amount"],
    });

    addTableSheet({
      name: t("reportsPage.balanceHistorySheet"),
      title: t("reportsPage.balanceHistory"),
      columns: [
        { header: t("common.date"), key: "date", width: 18 },
        { header: t("charts.balance"), key: "balance", width: 22 },
      ],
      rows: balanceHistory.map((item) => ({
        date: item.date,
        balance: item.balance,
      })),
      currencyColumns: ["balance"],
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const safeAccountName = selectedAccount.name.replace(/[^\w-]+/g, "-");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reports-${safeAccountName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingAccounts) {
    return (
      <div className={styles.pageContainer} aria-busy="true">
        <section className={`${styles.header} ui-card`}>
          <div>
            <Skeleton width="28%" height={26} />
            <div style={{ marginTop: "8px" }}>
              <SkeletonText lines={1} widths={["48%"]} />
            </div>
          </div>
          <div className={styles.accountSelector}>
            <Skeleton width="40%" height={14} />
            <Skeleton height={44} />
          </div>
        </section>

        <div className={styles.grid}>
          <section className={`${styles.chartSection} ui-card`}>
            <SkeletonCard titleWidth="52%" mediaHeight={320} lines={0} />
          </section>
          <section className={`${styles.chartSection} ui-card`}>
            <SkeletonCard titleWidth="58%" mediaHeight={320} lines={0} />
          </section>
          <section className={`${styles.chartSection} ui-card`}>
            <SkeletonCard titleWidth="50%" mediaHeight={320} lines={0} />
          </section>
          <section className={`${styles.chartSection} ui-card`}>
            <SkeletonCard titleWidth="56%" mediaHeight={320} lines={0} />
          </section>
          <section
            className={`${styles.chartSection} ${styles.fullWidth} ui-card`}
          >
            <SkeletonCard titleWidth="42%" mediaHeight={320} lines={0} />
          </section>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <section className="ui-card">
          <h2 className={styles.title}>{t("reportsPage.title")}</h2>
          <p>{t("reportsPage.emptyAccounts")}</p>
          <Link className="ui-btn" to="/create-account">
            {t("common.createAccount")}
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

      <section className={`${styles.header} ui-card`}>
        <button
          className={styles.exportButton}
          type="button"
          onClick={handleExportExcel}
          disabled={!selectedAccountId || isLoadingCharts}
          aria-label={t("reportsPage.exportExcel")}
          title={t("reportsPage.exportExcel")}
        >
          <RiFileExcel2Line />
        </button>
        <div className={styles.headerIntro}>
          <h2 className={styles.title}>{t("reportsPage.title")}</h2>
          <p className={styles.subtitle}>{t("reportsPage.subtitle")}</p>
          {selectedAccount ? (
            <p className={styles.subtitle}>
              {t("common.currency")}: {getCurrencyLabel(t, reportCurrency)}
            </p>
          ) : null}
        </div>
        <div className={styles.headerActions}>
          <label
            className={styles.accountSelector}
            htmlFor="reports-account-select"
          >
            {t("reportsPage.selectAccount")}
            <select
              className="ui-control"
              id="reports-account-select"
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={`${styles.summarySection} ui-card`}>
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <small>{t("reportsPage.totalIncome")}</small>
            <strong>{formatCurrency(summary?.totalIncome ?? 0)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <small>{t("reportsPage.totalExpenses")}</small>
            <strong>{formatCurrency(summary?.totalExpense ?? 0)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <small>{t("reportsPage.netBalance")}</small>
            <strong>{formatCurrency(summary?.balance ?? 0)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <small>{t("reportsPage.transactionCount")}</small>
            <strong>{summary?.transactionCount ?? 0}</strong>
          </article>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={`${styles.chartSection} ui-card`}>
          <h3>{t("reportsPage.incomeVsExpenses")}</h3>
          <div className={styles.chartWrap}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : !summary ? (
              <p className={styles.emptyState}>{t("reportsPage.noSummary")}</p>
            ) : (
              <IncomeExpenseChart
                income={summary.totalIncome}
                expenses={summary.totalExpense}
                currency={reportCurrency}
              />
            )}
          </div>
        </section>

        <section className={`${styles.chartSection} ui-card`}>
          <h3>{t("reportsPage.expensesByCategory")}</h3>
          <div className={styles.chartWrap}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : expenseCategories.length === 0 ? (
              <p className={styles.emptyState}>
                {t("reportsPage.noExpenseData")}
              </p>
            ) : (
              <ExpensesByCategoryChart
                items={expenseCategories}
                currency={reportCurrency}
              />
            )}
          </div>
          {expenseCategories.length > 0 ? (
            <ChartLegend
              items={expenseCategories.map((item, index) => ({
                label: getCategoryLabel(t, item.category as Category),
                color: expenseChartColors[index % expenseChartColors.length],
                value: formatCurrency(item.total),
              }))}
            />
          ) : null}
          {expenseCategories.length > 0 ? (
            <div className={styles.chartFooter}>
              <p className={styles.dataListTotal}>
                {t("reportsPage.expenseCategoriesTotal")}:{" "}
                {formatCurrency(totalExpenseCategories)}
              </p>
            </div>
          ) : null}
        </section>

        <section className={`${styles.chartSection} ui-card`}>
          <h3>{t("reportsPage.incomeByCategory")}</h3>
          <div className={styles.chartWrap}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : incomeCategories.length === 0 ? (
              <p className={styles.emptyState}>
                {t("reportsPage.noIncomeData")}
              </p>
            ) : (
              <IncomeByCategoryChart
                items={incomeCategories}
                currency={reportCurrency}
              />
            )}
          </div>
          {incomeCategories.length > 0 ? (
            <ChartLegend
              items={incomeCategories.map((item, index) => ({
                label: getCategoryLabel(t, item.category as Category),
                color: incomeChartColors[index % incomeChartColors.length],
                value: formatCurrency(item.total),
              }))}
            />
          ) : null}
          {incomeCategories.length > 0 ? (
            <div className={styles.chartFooter}>
              <p className={styles.dataListTotal}>
                {t("reportsPage.incomeCategoriesTotal")}:{" "}
                {formatCurrency(totalIncomeCategories)}
              </p>
            </div>
          ) : null}
        </section>

        <section className={`${styles.chartSection} ui-card`}>
          <h3>{t("reportsPage.savingsGoalsProgress")}</h3>
          {savingsGoals.length > 0 ? (
            <label
              className={styles.inlineSelector}
              htmlFor="reports-savings-goal-select"
            >
              {t("reportsPage.selectSavingGoal")}
              <select
                className="ui-control"
                id="reports-savings-goal-select"
                value={selectedSavingsGoal?.id ?? ""}
                onChange={(event) =>
                  setSelectedSavingsGoalId(event.target.value)
                }
              >
                {savingsGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {selectedSavingsGoal ? (
            <article
              className={styles.goalProgress}
              style={
                {
                  "--goal-progress-color": `hsl(${selectedSavingsGoalHue} 76% 42%)`,
                } as React.CSSProperties
              }
            >
              <div className={styles.goalProgressHeader}>
                <strong className={styles.goalProgressValue}>
                  {selectedSavingsGoalProgress.toFixed(0)}%
                </strong>
                <span className={styles.goalProgressLabel}>
                  {selectedSavingsGoal.name}
                </span>
              </div>
              <div className={styles.goalProgressTrack}>
                <div className={styles.goalProgressBar}>
                  <div
                    className={styles.goalProgressFill}
                    style={{ width: `${selectedSavingsGoalProgress}%` }}
                  />
                </div>
                <small className={styles.goalProgressAmounts}>
                  {formatCurrency(selectedSavingsGoal.currentAmount)}
                  {" / "}
                  {formatCurrency(selectedSavingsGoal.targetAmount)}
                </small>
              </div>
            </article>
          ) : null}
          <div className={`${styles.chartWrap} ${styles.goalChartWrap}`}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : savingsGoals.length === 0 ? (
              <p className={styles.emptyState}>
                {t("reportsPage.noSavingsData")}
              </p>
            ) : (
              <SavingsGoalsChart
                item={selectedSavingsGoal}
                currency={reportCurrency}
              />
            )}
          </div>
          {selectedSavingsGoal ? (
            <div className={styles.chartFooter}>
              <p className={styles.dataListTotal}>
                {selectedSavingsGoal.name}:{" "}
                {formatCurrency(selectedSavingsGoal.currentAmount)}
                {" / "}
                {formatCurrency(selectedSavingsGoal.targetAmount)}
              </p>
              <p className={styles.dataListTotal}>
                {t("reportsPage.totalDeposits")}:{" "}
                {formatCurrency(selectedSavingsGoal.depositAmount)}
                {" | "}
                {t("reportsPage.totalWithdrawals")}:{" "}
                {formatCurrency(selectedSavingsGoal.withdrawalAmount)}
              </p>
            </div>
          ) : null}
        </section>

        <section
          className={`${styles.chartSection} ${styles.fullWidth} ui-card`}
        >
          <h3>{t("reportsPage.balanceHistory")}</h3>
          <div className={styles.chartWrap}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : balanceHistory.length === 0 ? (
              <p className={styles.emptyState}>
                {t("reportsPage.noBalanceData")}
              </p>
            ) : (
              <BalanceHistoryChart
                items={balanceHistory}
                currency={reportCurrency}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReportsPage;
