import { useEffect, useState } from "react";
import styles from "./AccountDetailsPage.module.css";
import api from "../../../services/api";
import type {
  AccountCounts,
  AccountDetail,
  Transaction,
  savingGoal,
} from "../../../types/account.types";
import { useParams } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import TransactionCard from "../../../components/TransactionCard/TransactionCard";
import SavingGoalCard from "../../../components/SavingGoalCard/SavingGoalCard";

function AccountDetailsPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const { currentUser } = useAuth();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccount() {
      try {
        const [accountResponse, transactionsResponse, savingGoalsResponse] =
          await Promise.all([
            api.get<
              Omit<AccountDetail, "transactions" | "savingGoals" | "_count">
            >(`/accounts/${accountId}`),
            api.get<Transaction[]>(`/transactions/account/${accountId}`),
            api.get<savingGoal[]>(`/saving-goals/account/${accountId}`),
          ]);

        const transactions = Array.isArray(transactionsResponse.data)
          ? transactionsResponse.data
          : [];
        const savingGoals = Array.isArray(savingGoalsResponse.data)
          ? savingGoalsResponse.data
          : [];
        const counts: AccountCounts = {
          transactions: transactions.length,
          savingGoals: savingGoals.length,
        };

        setAccount({
          ...accountResponse.data,
          users: accountResponse.data.users ?? [],
          transactions,
          savingGoals,
          _count: counts,
        });
        setErrorMessage(null);
      } catch (error: unknown) {
        console.error("Failed to load account", error);
        setErrorMessage("Failed to load account");
      } finally {
        setIsLoading(false);
      }
    }
    if (accountId) fetchAccount();
  }, [accountId]);

  const currentMember = account?.users.find(
    (user) => user.userId === currentUser?.id,
  );

  if (isLoading) return <p>Loading...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;
  if (!account) return null;

  return (
    <div className={styles.accountDetailsPageContainer}>
      <section className={styles.accountDetails}>
        <h2 className={styles.accountTitle}>{account.name}</h2>
        {account.description && (
          <p className={styles.description}>{account.description}</p>
        )}
        <p className={styles.currency}>{account.currency}</p>
        {currentMember && (
          <p className={styles.myRole}>My role:{currentMember.role}</p>
        )}
      </section>

      <section className={styles.aMembersSection}>
        <h3 className={styles.membersTitle}>Members</h3>
        {account.users.map((member) => (
          <article className={styles.memberAvatar} key={member.userId}>
            <img src={member.user.image} alt={member.user.name} />
            <p className={styles.memberName}>{member.user.name}</p>
            <p className={styles.memberRole}>{member.role}</p>
          </article>
        ))}
      </section>

      <section className={styles.transactionsSection}>
        <h3 className={styles.transactionsTitle}>
          Transactions ({account._count.transactions})
        </h3>
        {account.transactions.length === 0 ? (
          <p>No transactions yet</p>
        ) : (
          account.transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              currency={account.currency}
              transaction={transaction}
            />
          ))
        )}
      </section>

      <section className={styles.savingGoalsSection}>
        <h3 className={styles.savingGoalsTitle}>
          Saving Goals ({account._count.savingGoals})
        </h3>
        {account.savingGoals.length === 0 ? (
          <p>No saving goals yet</p>
        ) : (
          account.savingGoals.map((goal) => (
            <SavingGoalCard
              key={goal.id}
              currency={account.currency}
              goal={goal}
            />
          ))
        )}
      </section>
    </div>
  );
}
export default AccountDetailsPage;
