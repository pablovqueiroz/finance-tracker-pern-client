import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import styles from "./ManageAccountsPage.module.css";
import api from "../../../services/api";
import AccountCard from "../../../components/AccountCard/AccountCard";
import { useAuth } from "../../../hooks/useAuth";
import type { AccountSummary } from "../../../types/account.types";
import Skeleton from "../../../components/Skeleton/Skeleton";
import SkeletonButton from "../../../components/Skeleton/SkeletonButton";
import SkeletonCard from "../../../components/Skeleton/SkeletonCard";
import LoadingStatus from "../../../components/LoadingStatus/LoadingStatus";
import LoadErrorState from "../../../components/LoadErrorState/LoadErrorState";

type AccountSummaryResponse = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  period: string;
};

function ManageAccountsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const nav = useNavigate();

  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? "";

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await api.get<AccountSummary[]>(`/accounts`);
      const baseAccountList = Array.isArray(response.data)
        ? response.data.map((account) => ({
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

        return {
          ...account,
          balance: account.balance ?? 0,
          _count: {
            transactions: account._count?.transactions ?? 0,
            savingGoals: account._count?.savingGoals ?? 0,
          },
        };
      });

      setAccounts(accountList);
    } catch (error: unknown) {
      console.error("Failed to load accounts", error);
      setAccounts([]);
      setErrorMessage(t("accounts.manage.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const handleSelectAccount = (accountId: string) => {
    nav(`/accounts/${accountId}`);
  };

  if (isLoading) {
    return (
      <div className={styles.ManageAccountsPage} aria-busy="true">
        <LoadingStatus label={t("common.loading")} />
        <div className={styles.header}>
          <Skeleton width="34%" height={28} />
          <SkeletonButton width={150} />
        </div>
        <section aria-hidden="true">
          <SkeletonCard avatar lines={2} actionCount={1} />
          <SkeletonCard avatar lines={2} actionCount={1} />
          <SkeletonCard avatar lines={2} actionCount={1} />
        </section>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.ManageAccountsPage}>
        <LoadErrorState
          message={errorMessage}
          onRetry={() => void fetchAccounts()}
        />
      </div>
    );
  }

  return (
    <div className={styles.ManageAccountsPage}>
      <div className={styles.header}>
        <h2>{t("accounts.manage.title")}</h2>
        <button
          className="ui-btn"
          type="button"
          onClick={() => nav("/create-account")}
        >
          {t("common.createAccount")}
        </button>
      </div>
      <section>
        {accounts.length === 0 ? (
          <p>{t("accounts.manage.empty")}</p>
        ) : (
          accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              currentUserId={currentUserId}
              onSelect={() => handleSelectAccount(account.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}

export default ManageAccountsPage;
