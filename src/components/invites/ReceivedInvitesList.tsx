import { useTranslation } from "react-i18next";
import InviteRow from "./InviteRow";
import styles from "./Invites.module.css";
import type { AccountInvite } from "../../types/invite.types";
import { getRoleLabel } from "../../utils/displayLabels";

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
  const { t } = useTranslation();

  if (invites.length === 0) {
    return <p className={styles.emptyState}>{t("invites.noReceived")}</p>;
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
            title={invite.account?.name ?? t("invites.accountUnavailable")}
            subtitle={t("invites.invitedBy", {
              name: invite.invitedBy?.name ?? t("invites.unknownUser"),
            })}
            status={invite.status}
            meta={[
              {
                label: t("invites.meta.role"),
                value: getRoleLabel(t, invite.role),
              },
              {
                label: t("invites.meta.invitedBy"),
                value: invite.invitedBy?.email ?? t("common.noEmail"),
              },
              { label: t("invites.meta.expires"), value: formatDate(invite.expiresAt) },
            ]}
            actions={
              <>
                <button
                  className="ui-btn"
                  type="button"
                  disabled={activeInviteId !== null}
                  onClick={() => onAccept(invite.id, invite.token)}
                >
                  {isAccepting ? t("invites.accepting") : t("invites.accept")}
                </button>
                <button
                  className={`${styles.secondaryBtn} ui-btn`}
                  type="button"
                  disabled={activeInviteId !== null}
                  onClick={() => onReject(invite.id, invite.token)}
                >
                  {isRejecting ? t("invites.rejecting") : t("invites.reject")}
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
