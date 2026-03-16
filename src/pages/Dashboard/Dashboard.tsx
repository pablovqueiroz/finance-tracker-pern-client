import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BalanceCard from "../../components/BalanceCard/BalanceCard";
import Hero from "../../components/Hero/Hero";
import Skeleton from "../../components/Skeleton/Skeleton";
import SkeletonButton from "../../components/Skeleton/SkeletonButton";
import SkeletonCard from "../../components/Skeleton/SkeletonCard";
import SkeletonText from "../../components/Skeleton/SkeletonText";
import Transactions from "../../components/Transactions/Transactions";
import type {
  AccountDetail,
  AccountSummary,
  Currency,
  Transaction,
} from "../../types/account.types";
import type { AccountInvite } from "../../types/invite.types";
import styles from "./Dashboard.module.css";
import api from "../../services/api";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import { IoMailUnreadOutline } from "react-icons/io5";
import { useAuth } from "../../hooks/useAuth";

type AccountSummaryResponse = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  period: string;
};
type DashboardProps = {
  onActiveAccountChange: (accountId: string) => void;
};

function Dashboard({ onActiveAccountChange }: DashboardProps) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const activeAccount = accounts[activeAccountIndex] ?? null;
  const activeAccountId = activeAccount?.id ?? "";
  const currentMember = activeAccount?.users?.find(
    (member) => member.userId === currentUser?.id,
  );
  const canManageTransactions =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setIsLoadingAccounts(true);
        const accountsResponse = await api.get<AccountSummary[]>(`/accounts`);
        const baseAccountList = Array.isArray(accountsResponse.data)
          ? accountsResponse.data.map((account) => ({
              ...account,
              users: account.users ?? [],
            }))
          : [];

        const summaries = await Promise.allSettled(
          baseAccountList.map((account) =>
            api.get<AccountSummaryResponse>(
              `/transactions/summary/${account.id}`,
            ),
          ),
        );

        const accountList = baseAccountList.map((account, index) => {
          const summaryResult = summaries[index];
          if (summaryResult?.status === "fulfilled") {
            const summary = summaryResult.value.data;
            return {
              ...account,
              balance: summary.balance,
              _count: {
                transactions: summary.transactionCount,
                savingGoals: account._count?.savingGoals ?? 0,
              },
            };
          }

          return account;
        });

        setAccounts(accountList);
        setActiveAccountIndex(0);
      } catch (error: unknown) {
        console.error("Failed to load accounts", error);
        setAccounts([]);
        setActiveAccountIndex(0);
      } finally {
        setIsLoadingAccounts(false);
      }
    }

    fetchAccounts();
  }, []);
  useEffect(() => {
    onActiveAccountChange(activeAccountId);
  }, [activeAccountId, onActiveAccountChange]);

  useEffect(() => {
    async function fetchPendingInvites() {
      try {
        const response = await api.get<AccountInvite[]>("/invites/received");
        const inviteList = Array.isArray(response.data) ? response.data : [];
        setPendingInvitesCount(
          inviteList.filter((invite) => invite.status === "PENDING").length,
        );
      } catch (error: unknown) {
        console.error("Failed to load pending invites", error);
        setPendingInvitesCount(0);
      }
    }

    fetchPendingInvites();
  }, []);

  useEffect(() => {
    async function fetchTransactionsByAccount() {
      if (!activeAccountId) {
        setTransactions([]);
        setCurrency("EUR");
        setIsLoadingTransactions(false);
        return;
      }

      try {
        setIsLoadingTransactions(true);
        const [transactionsResponse, accountResponse] = await Promise.all([
          api.get<Transaction[]>(`/transactions/account/${activeAccountId}`),
          api.get<
            Omit<AccountDetail, "transactions" | "savingGoals" | "_count">
          >(`/accounts/${activeAccountId}`),
        ]);
        const accountTransactions = Array.isArray(transactionsResponse.data)
          ? transactionsResponse.data
          : [];
        const accountMembers = accountResponse.data.users ?? [];

        setTransactions(accountTransactions);
        setCurrency(activeAccount.currency);
        setAccounts((prev) =>
          prev.map((account) =>
            account.id === activeAccountId
              ? {
                  ...account,
                  users: accountMembers,
                }
              : account,
          ),
        );
      } catch (error: unknown) {
        console.error("Failed to load transactions", error);
        setTransactions([]);
        setCurrency(activeAccount.currency);
      } finally {
        setIsLoadingTransactions(false);
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

  if (isLoadingAccounts) {
    return (
      <div className={styles.DashboardContainer} aria-busy="true">
        <section className={`${styles.welcome} ui-card`}>
          <SkeletonText lines={2} widths={["36%", "58%"]} />
        </section>

        <section className={`${styles.balanceCard} ui-card`}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Skeleton width="36%" height={14} />
          </div>
          <SkeletonCard lines={3} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <SkeletonButton width={86} />
            <SkeletonButton width={98} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Skeleton width={10} height={10} circle />
            <Skeleton width={10} height={10} circle />
            <Skeleton width={10} height={10} circle />
          </div>
        </section>

        <section className={`${styles.actions} ui-card`}>
          <div style={{ display: "flex", gap: "12px" }}>
            <Skeleton width={56} height={56} />
            <Skeleton width={56} height={56} />
            <Skeleton width={56} height={56} />
          </div>
        </section>

        <section className={`${styles.transactions} ui-card`}>
          <Skeleton width="32%" height={18} />
          <div style={{ display: "grid", gap: "10px" }}>
            <SkeletonCard avatar lines={2} />
            <SkeletonCard avatar lines={2} />
            <SkeletonCard avatar lines={2} />
          </div>
        </section>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={styles.DashboardContainer}>
        <section className={styles.welcome}>
          <Hero />
        </section>

        {pendingInvitesCount > 0 ? (
          <section className={`${styles.pendingInvites} ui-card`}>
            <div className={styles.pendingInvitesContent}>
              <div className={styles.pendingInvitesCopy}>
                <IoMailUnreadOutline
                  className={styles.pendingInvitesIcon}
                  aria-hidden="true"
                />
                <div>
                  <p className={styles.pendingInvitesTitle}>
                    {t("dashboard.pendingInvites.title", {
                      count: pendingInvitesCount,
                    })}
                  </p>
                  <p className={styles.pendingInvitesText}>
                    {t("dashboard.pendingInvites.subtitle")}
                  </p>
                </div>
              </div>
              <Link className={styles.pendingInvitesLink} to="/invites">
                {t("dashboard.pendingInvites.action")}
              </Link>
            </div>
          </section>
        ) : null}

        <section className={`${styles.emptyState} ui-card`}>
          <h2>{t("dashboard.emptyTitle")}</h2>
          <p>{t("dashboard.emptyDescription")}</p>
          <Link className="ui-btn" to="/create-account">
            {t("dashboard.createAccount")}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.DashboardContainer}>
      <section className={styles.welcome}>
        <Hero />
      </section>

      {pendingInvitesCount > 0 ? (
        <section className={`${styles.pendingInvites} ui-card`}>
          <div className={styles.pendingInvitesContent}>
            <div className={styles.pendingInvitesCopy}>
              <IoMailUnreadOutline
                className={styles.pendingInvitesIcon}
                aria-hidden="true"
              />
              <div>
                <p className={styles.pendingInvitesTitle}>
                  {t("dashboard.pendingInvites.title", {
                    count: pendingInvitesCount,
                  })}
                </p>
                <p className={styles.pendingInvitesText}>
                  {t("dashboard.pendingInvites.subtitle")}
                </p>
              </div>
            </div>
            <Link className={styles.pendingInvitesLink} to="/invites">
              {t("dashboard.pendingInvites.action")}
            </Link>
          </div>
        </section>
      ) : null}

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
        <ActionButtons
          accountId={activeAccountId}
          canManageTransactions={canManageTransactions}
        />
      </section>

      <section className={styles.transactions}>
        {isLoadingTransactions ? (
          <div className="ui-card">
            <Skeleton width="32%" height={18} />
            <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
              <SkeletonCard avatar lines={2} />
              <SkeletonCard avatar lines={2} />
              <SkeletonCard avatar lines={2} />
            </div>
          </div>
        ) : (
          <Transactions
            transactions={transactions}
            currency={currency}
            accountId={activeAccountId}
            members={activeAccount?.users ?? []}
            canManageTransactions={canManageTransactions}
          />
        )}
      </section>
    </div>
  );
}

export default Dashboard;
