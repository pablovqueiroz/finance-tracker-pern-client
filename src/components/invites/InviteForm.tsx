import type { FormEventHandler } from "react";
import type { AccountRole, AccountSummary } from "../../types/account.types";
import styles from "./Invites.module.css";

type InviteFormProps = {
  accounts: AccountSummary[];
  email: string;
  role: Extract<AccountRole, "ADMIN" | "MEMBER">;
  accountId: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: Extract<AccountRole, "ADMIN" | "MEMBER">) => void;
  onAccountChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function InviteForm({
  accounts,
  email,
  role,
  accountId,
  isSubmitting,
  onEmailChange,
  onRoleChange,
  onAccountChange,
  onSubmit,
}: InviteFormProps) {
  if (accounts.length === 0) {
    return (
      <p className={styles.emptyState}>
        Create an account first to start sending invites.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label>
        Email
        <input
          className="ui-control"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="user@email.com"
          required
        />
      </label>

      <label>
        Role
        <select
          className="ui-control"
          value={role}
          onChange={(event) =>
            onRoleChange(event.target.value as Extract<AccountRole, "ADMIN" | "MEMBER">)
          }
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </label>

      <label>
        Account
        <select
          className="ui-control"
          value={accountId}
          onChange={(event) => onAccountChange(event.target.value)}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <button className="ui-btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send invite"}
      </button>
    </form>
  );
}

export default InviteForm;
