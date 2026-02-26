import { useEffect, useState } from "react";
import styles from "./ManageAccountsPage.module.css";
import { useNavigate } from "react-router";
import api from "../../../services/api";
import AccountCard from "../../../components/AccountCard/AccountCard";
import { useAuth } from "../../../hooks/useAuth";
import type { AccountSummary } from "../../../types/account.types";

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
        const accountList = Array.isArray(response.data)
          ? response.data.map((account) => ({
              ...account,
              users: account.users ?? [],
            }))
          : [];
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
