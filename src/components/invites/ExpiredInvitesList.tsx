import { useTranslation } from "react-i18next";
import InviteRow from "./InviteRow";
import styles from "./Invites.module.css";
import type { AccountInvite } from "../../types/invite.types";
import { getRoleLabel } from "../../utils/displayLabels";
import { getLocale } from "../../i18n/getLocale";

type ExpiredInvitesListProps = {
  invites: AccountInvite[];
};

function formatDate(
  value: string | Date,
  locale: string,
  unknownDate: string,
) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return unknownDate;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function ExpiredInvitesList({ invites }: ExpiredInvitesListProps) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const unknownDate = t("common.unknownDate");

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
            {
              label: t("invites.meta.expired"),
              value: formatDate(invite.updatedAt, locale, unknownDate),
            },
            {
              label: t("invites.meta.originalExpiry"),
              value: formatDate(invite.expiresAt, locale, unknownDate),
            },
          ]}
        />
      ))}
    </div>
  );
}

export default ExpiredInvitesList;
