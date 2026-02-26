import { useEffect, useState } from "react";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import BalanceCard from "../../components/BalanceCard/BalanceCard";
import Hero from "../../components/Hero/Hero";
import Transactions from "../../components/Transactions/Transactions";
import type {
  AccountSummary,
  Currency,
  Transaction,
} from "../../types/account.types";
import styles from "./Dashboard.module.css";
import api from "../../services/api";

function Dashboard() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const activeAccount = accounts[activeAccountIndex] ?? null;
  const activeAccountId = activeAccount?.id ?? "";

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const accountsResponse = await api.get<AccountSummary[]>(`/accounts`);
        const accountList = Array.isArray(accountsResponse.data)
          ? accountsResponse.data.map((account) => ({
              ...account,
              users: account.users ?? [],
            }))
          : [];
        setAccounts(accountList);
        setActiveAccountIndex(0);
      } catch (error: unknown) {
        console.error("Failed to load accounts", error);
        setAccounts([]);
        setActiveAccountIndex(0);
      }
    }

    fetchAccounts();
  }, []);

  useEffect(() => {
    async function fetchTransactionsByAccount() {
      if (!activeAccountId) {
        setTransactions([]);
        setCurrency("EUR");
        return;
      }

      try {
        const transactionsResponse = await api.get<Transaction[]>(
          `/transactions/account/${activeAccountId}`,
        );
        const accountTransactions = Array.isArray(transactionsResponse.data)
          ? transactionsResponse.data
          : [];
        setTransactions(accountTransactions);
        setCurrency(activeAccount.currency);
      } catch (error: unknown) {
        console.error("Failed to load transactions", error);
        setTransactions([]);
        setCurrency(activeAccount.currency);
      }
    }

    fetchTransactionsByAccount();
  }, [activeAccountId, activeAccount?.currency]);

  const handlePrevAccount = () => {
    setActiveAccountIndex((prev) =>
      prev === 0 ? accounts.length - 1 : prev - 1,
    );
  };

  const handleNextAccount = () => {
    setActiveAccountIndex((prev) =>
      prev === accounts.length - 1 ? 0 : prev + 1,
    );
  };

  const handleSelectAccount = (index: number) => {
    setActiveAccountIndex(index);
  };

  return (
    <div className={styles.DashboardContainer}>
      <section className={styles.welcome}>
        <Hero />
      </section>

      <section className={styles.balanceCard}>
        <BalanceCard
          accounts={accounts}
          activeIndex={activeAccountIndex}
          onPrev={handlePrevAccount}
          onNext={handleNextAccount}
          onSelect={handleSelectAccount}
        />
      </section>

      <section className={styles.actions}>
        <ActionButtons />
      </section>

      <section className={styles.transactions}>
        <Transactions
          transactions={transactions}
          currency={currency}
          accountId={activeAccountId}
        />
      </section>
    </div>
  );
}
export default Dashboard;
