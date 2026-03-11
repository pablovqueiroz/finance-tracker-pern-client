import type { ReactNode } from "react";
import type { InviteStatus } from "../../types/invite.types";
import styles from "./Invites.module.css";

type InviteMetaItem = {
  label: string;
  value: string;
};

type InviteRowProps = {
  title: string;
  subtitle?: string;
  status?: InviteStatus;
  meta: InviteMetaItem[];
  actions?: ReactNode;
};

function getStatusClassName(status?: InviteStatus) {
  if (status === "ACCEPTED") return styles.badgeAccepted;
  if (status === "CANCELLED") return styles.badgeCancelled;
  if (status === "EXPIRED") return styles.badgeExpired;
  return styles.badgePending;
}

function InviteRow({
  title,
  subtitle,
  status,
  meta,
  actions,
}: InviteRowProps) {
  return (
    <article className={styles.row}>
      <div className={styles.rowTop}>
        <div className={styles.main}>
          <p className={styles.title}>{title}</p>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>

        {status ? (
          <span className={`${styles.badge} ${getStatusClassName(status)}`}>
            {status}
          </span>
        ) : null}
      </div>

      <div className={styles.meta}>
        {meta.map((item) => (
          <div className={styles.metaItem} key={`${title}-${item.label}`}>
            <span className={styles.metaLabel}>{item.label}</span>
            <span className={styles.metaValue}>{item.value}</span>
          </div>
        ))}
      </div>

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </article>
  );
}

export default InviteRow;
