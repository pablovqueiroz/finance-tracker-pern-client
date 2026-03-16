import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";
import type { AccountRole, AccountSummary } from "../../types/account.types";
import { getRoleLabel } from "../../utils/displayLabels";
import Spinner from "../Spinner/Spinner";
import styles from "./Invites.module.css";

type InviteFormProps = {
  accounts: AccountSummary[];
  email: string;
  role: Extract<AccountRole, "ADMIN" | "MEMBER">;
  accountId: string;
  isSubmitting: boolean;
  canSendInvites?: boolean;
  readOnlyMessage?: string;
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
  canSendInvites = true,
  readOnlyMessage,
  onEmailChange,
  onRoleChange,
  onAccountChange,
  onSubmit,
}: InviteFormProps) {
  const { t } = useTranslation();

  if (accounts.length === 0) {
    return (
      <p className={styles.emptyState}>{t("invites.createAccountFirst")}</p>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label>
        {t("common.email")}
        <input
          className="ui-control"
          type="email"
          value={email}
          disabled={!canSendInvites}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={t("contact.emailPlaceholder")}
          required
        />
      </label>

      <label>
        {t("common.role")}
        <select
          className="ui-control"
          value={role}
          disabled={!canSendInvites}
          onChange={(event) =>
            onRoleChange(
              event.target.value as Extract<AccountRole, "ADMIN" | "MEMBER">,
            )
          }
        >
          <option value="MEMBER">{getRoleLabel(t, "MEMBER")}</option>
          <option value="ADMIN">{getRoleLabel(t, "ADMIN")}</option>
        </select>
      </label>

      <label>
        {t("common.account")}
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

      <p
        className={`${styles.formNotice} ${
          !canSendInvites && readOnlyMessage ? styles.formNoticeVisible : ""
        }`}
        aria-live="polite"
      >
        {!canSendInvites && readOnlyMessage ? readOnlyMessage : " "}
      </p>

      <div className={styles.submitWrap}>
        <button
          className={`${styles.submitButton} ui-btn`}
          type="submit"
          disabled={isSubmitting || !canSendInvites}
        >
          {isSubmitting ? (
            <span className={styles.submitButtonContent}>
              <Spinner loadingLabel={t("invites.sending")} />
              <span>{t("invites.sending")}</span>
            </span>
          ) : (
            t("invites.sendInvite")
          )}
        </button>
      </div>
    </form>
  );
}

export default InviteForm;
