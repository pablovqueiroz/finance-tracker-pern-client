import { useTranslation } from "react-i18next";
import InviteRow from "./InviteRow";
import styles from "./Invites.module.css";
import type { AccountInvite } from "../../types/invite.types";
import { getRoleLabel } from "../../utils/displayLabels";

type SentInvitesListProps = {
  invites: AccountInvite[];
  activeInviteId: string | null;
  activeAction: "cancel" | "expire" | "accept" | "reject" | null;
  onCancel: (inviteId: string) => void;
  onExpire: (inviteId: string) => void;
};

function formatDate(value: string | Date) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(navigator.language ?? "pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function SentInvitesList({
  invites,
  activeInviteId,
  activeAction,
  onCancel,
  onExpire,
}: SentInvitesListProps) {
  const { t } = useTranslation();

  if (invites.length === 0) {
    return <p className={styles.emptyState}>{t("invites.noSent")}</p>;
  }

  return (
    <div className={styles.list}>
      {invites.map((invite) => {
        const isPending = invite.status === "PENDING";
        const isCancelling =
          activeInviteId === invite.id && activeAction === "cancel";
        const isExpiring =
          activeInviteId === invite.id && activeAction === "expire";

        return (
          <InviteRow
            key={invite.id}
            title={invite.email}
            subtitle={invite.account?.name ?? t("invites.accountUnavailable")}
            status={invite.status}
            meta={[
              {
                label: t("invites.meta.role"),
                value: getRoleLabel(t, invite.role),
              },
              { label: t("invites.meta.expires"), value: formatDate(invite.expiresAt) },
              { label: t("invites.meta.created"), value: formatDate(invite.createdAt) },
            ]}
            actions={
              <>
                <button
                  className={`${styles.secondaryBtn} ui-btn`}
                  type="button"
                  disabled={!isPending || activeInviteId !== null}
                  onClick={() => onCancel(invite.id)}
                >
                  {isCancelling ? t("invites.cancelling") : t("invites.cancelInvite")}
                </button>
                <button
                  className="ui-btn"
                  type="button"
                  disabled={!isPending || activeInviteId !== null}
                  onClick={() => onExpire(invite.id)}
                >
                  {isExpiring ? t("invites.expiring") : t("invites.expireInvite")}
                </button>
              </>
            }
          />
        );
      })}
    </div>
  );
}

export default SentInvitesList;
