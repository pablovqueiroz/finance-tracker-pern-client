import InviteRow from "./InviteRow";
import styles from "./Invites.module.css";
import type { AccountInvite } from "../../types/invite.types";

type ReceivedInvitesListProps = {
  invites: AccountInvite[];
  activeInviteId: string | null;
  activeAction: "cancel" | "expire" | "accept" | "reject" | null;
  onAccept: (inviteId: string, token: string) => void;
  onReject: (inviteId: string, token: string) => void;
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

function ReceivedInvitesList({
  invites,
  activeInviteId,
  activeAction,
  onAccept,
  onReject,
}: ReceivedInvitesListProps) {
  if (invites.length === 0) {
    return <p className={styles.emptyState}>No received invites right now.</p>;
  }

  return (
    <div className={styles.list}>
      {invites.map((invite) => {
        const isAccepting =
          activeInviteId === invite.id && activeAction === "accept";
        const isRejecting =
          activeInviteId === invite.id && activeAction === "reject";

        return (
          <InviteRow
            key={invite.id}
            title={invite.account?.name ?? "Account unavailable"}
            subtitle={`Invited by ${invite.invitedBy?.name ?? "Unknown user"}`}
            status={invite.status}
            meta={[
              { label: "Role", value: invite.role },
              {
                label: "Invited by",
                value: invite.invitedBy?.email ?? "No email",
              },
              { label: "Expires", value: formatDate(invite.expiresAt) },
            ]}
            actions={
              <>
                <button
                  className="ui-btn"
                  type="button"
                  disabled={activeInviteId !== null}
                  onClick={() => onAccept(invite.id, invite.token)}
                >
                  {isAccepting ? "Accepting..." : "Accept"}
                </button>
                <button
                  className={`${styles.secondaryBtn} ui-btn`}
                  type="button"
                  disabled={activeInviteId !== null}
                  onClick={() => onReject(invite.id, invite.token)}
                >
                  {isRejecting ? "Rejecting..." : "Reject"}
                </button>
              </>
            }
          />
        );
      })}
    </div>
  );
}

export default ReceivedInvitesList;
