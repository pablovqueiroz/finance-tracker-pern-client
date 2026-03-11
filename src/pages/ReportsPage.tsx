import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Skeleton from "../components/Skeleton/Skeleton";
import SkeletonCard from "../components/Skeleton/SkeletonCard";
import SkeletonText from "../components/Skeleton/SkeletonText";
import ExpensesByCategoryChart from "../components/charts/ExpensesByCategoryChart";
import IncomeByCategoryChart from "../components/charts/IncomeByCategoryChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import SavingsGoalsChart from "../components/charts/SavingsGoalsChart";
import BalanceHistoryChart from "../components/charts/BalanceHistoryChart";
import Message from "../components/Message/Message";
import api from "../services/api";
import type {
  AccountSummary,
  savingGoal,
  Transaction,
} from "../types/account.types";
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
  name: string;
  currentAmount: number;
  targetAmount: number;
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

function normalizeSavingsGoals(goals: savingGoal[]): SavingsGoalReport[] {
  return goals.map((goal) => ({
    name: goal.title,
    currentAmount: toNumber(goal.currentAmount),
    targetAmount: toNumber(goal.targetAmount),
  }));
}

function ReportsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<CategoryTotal[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryTotal[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalReport[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryPoint[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          api.get<ExpenseAnalyticsResponse>(`/transactions/analytics/${accountId}`),
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
        setSavingsGoals(
          Array.isArray(savingsGoalsResponse.data)
            ? normalizeSavingsGoals(savingsGoalsResponse.data)
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
      setBalanceHistory([]);
      return;
    }

    fetchCharts(selectedAccountId);
  }, [selectedAccountId, t]);

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
          <section className={`${styles.chartSection} ${styles.fullWidth} ui-card`}>
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
        <div>
          <h2 className={styles.title}>{t("reportsPage.title")}</h2>
          <p className={styles.subtitle}>{t("reportsPage.subtitle")}</p>
        </div>

        <label className={styles.accountSelector} htmlFor="reports-account-select">
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
              <p className={styles.emptyState}>{t("reportsPage.noExpenseData")}</p>
            ) : (
              <ExpensesByCategoryChart items={expenseCategories} />
            )}
          </div>
        </section>

        <section className={`${styles.chartSection} ui-card`}>
          <h3>{t("reportsPage.incomeByCategory")}</h3>
          <div className={styles.chartWrap}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : incomeCategories.length === 0 ? (
              <p className={styles.emptyState}>{t("reportsPage.noIncomeData")}</p>
            ) : (
              <IncomeByCategoryChart items={incomeCategories} />
            )}
          </div>
        </section>

        <section className={`${styles.chartSection} ui-card`}>
          <h3>{t("reportsPage.savingsGoalsProgress")}</h3>
          <div className={styles.chartWrap}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : savingsGoals.length === 0 ? (
              <p className={styles.emptyState}>{t("reportsPage.noSavingsData")}</p>
            ) : (
              <SavingsGoalsChart items={savingsGoals} />
            )}
          </div>
        </section>

        <section className={`${styles.chartSection} ${styles.fullWidth} ui-card`}>
          <h3>{t("reportsPage.balanceHistory")}</h3>
          <div className={styles.chartWrap}>
            {isLoadingCharts ? (
              <Skeleton height="100%" style={{ minHeight: 280 }} />
            ) : balanceHistory.length === 0 ? (
              <p className={styles.emptyState}>{t("reportsPage.noBalanceData")}</p>
            ) : (
              <BalanceHistoryChart items={balanceHistory} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReportsPage;
