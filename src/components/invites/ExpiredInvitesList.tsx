import InviteRow from "./InviteRow";
import styles from "./Invites.module.css";
import type { AccountInvite } from "../../types/invite.types";

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
  if (invites.length === 0) {
    return <p className={styles.emptyState}>No expired invites.</p>;
  }

  return (
    <div className={styles.list}>
      {invites.map((invite) => (
        <InviteRow
          key={invite.id}
          title={invite.email}
          subtitle={invite.account?.name ?? "Account unavailable"}
          status={invite.status}
          meta={[
            { label: "Role", value: invite.role },
            { label: "Expired", value: formatDate(invite.updatedAt) },
            { label: "Original expiry", value: formatDate(invite.expiresAt) },
          ]}
        />
      ))}
    </div>
  );
}

export default ExpiredInvitesList;
