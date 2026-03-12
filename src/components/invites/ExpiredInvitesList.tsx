import { useTranslation } from "react-i18next";
import InviteRow from "./InviteRow";
import styles from "./Invites.module.css";
import type { AccountInvite } from "../../types/invite.types";
import { getRoleLabel } from "../../utils/displayLabels";

type ExpiredInvitesListProps = {
  invites: AccountInvite[];
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

function ExpiredInvitesList({ invites }: ExpiredInvitesListProps) {
  const { t } = useTranslation();

  if (invites.length === 0) {
    return <p className={styles.emptyState}>{t("invites.noExpired")}</p>;
  }

  return (
    <div className={styles.list}>
      {invites.map((invite) => (
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
            { label: t("invites.meta.expired"), value: formatDate(invite.updatedAt) },
            {
              label: t("invites.meta.originalExpiry"),
              value: formatDate(invite.expiresAt),
            },
          ]}
        />
      ))}
    </div>
  );
}

export default ExpiredInvitesList;
