import { useEffect, useState } from "react";
import styles from "./ManageAccountsPage.module.css";
import { useNavigate } from "react-router";
import api from "../../../services/api";
import AccountCard from "../../../components/AccountCard/AccountCard";
import { useAuth } from "../../../hooks/useAuth";
import type { AccountSummary } from "../../../types/account.types";

type AccountSummaryResponse = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  period: string;
};

function ManageAccountsPage() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [, setErrorMessage] = useState<string | null>(null);
  const nav = useNavigate();

  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? "";

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await api.get<AccountSummary[]>(`/accounts`);
        const baseAccountList = Array.isArray(response.data)
          ? response.data.map((account) => ({
              ...account,
              users: account.users ?? [],
            }))
          : [];

        const summaries = await Promise.allSettled(
          baseAccountList.map((account) =>
            api.get<AccountSummaryResponse>(`/transactions/summary/${account.id}`),
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
        setErrorMessage(null);
      } catch (error: unknown) {
        console.error("Failed to load accounts", error);
        setErrorMessage("Failed to load accounts");
      }
    }
    fetchAccounts();
  }, []);

  const handleSelectAccount = (accountId: string) => {
    nav(`/accounts/${accountId}`);
  };

  return (
    <div className={styles.ManageAccountsPage}>
      <h2>All accounts here</h2>
      <section>
        {accounts.length === 0 ? (
          <p>No transactions yet</p>
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
