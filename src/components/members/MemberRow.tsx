import type { AccountMember, AccountRole } from "../../types/account.types";
import RoleSelector from "./RoleSelector";
import styles from "./Members.module.css";

type MemberRowProps = {
  member: AccountMember;
  currentUserId?: string;
  canManageRoles: boolean;
  canRemoveMembers: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  onRoleChange: (memberId: string, role: AccountRole) => void;
  onRemove: (memberId: string, memberName: string) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function MemberRow({
  member,
  currentUserId,
  canManageRoles,
  canRemoveMembers,
  isUpdating,
  isRemoving,
  onRoleChange,
  onRemove,
}: MemberRowProps) {
  const memberId = member.id ?? "";
  const isCurrentUser = member.userId === currentUserId;
  const canEditRole = canManageRoles && !isCurrentUser && Boolean(memberId);
  const canRemove = canRemoveMembers && !isCurrentUser && Boolean(memberId);

  return (
    <article className={styles.row}>
      <div className={styles.memberCell}>
        {member.user.image ? (
          <img
            className={styles.avatar}
            src={member.user.image}
            alt={member.user.name}
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {getInitials(member.user.name)}
          </div>
        )}

        <div className={styles.textBlock}>
          <p className={styles.name}>{member.user.name}</p>
          <p className={styles.email}>{member.user.email ?? "No email"}</p>
        </div>
      </div>

      <span className={styles.roleBadge}>{member.role}</span>

      <div className={styles.actions}>
        <RoleSelector
          value={member.role}
          disabled={!canEditRole || isUpdating || isRemoving}
          onChange={(role) => onRoleChange(memberId, role)}
        />

        {canRemove ? (
          <button
            className={`ui-btn ${styles.removeButton}`}
            type="button"
            disabled={isUpdating || isRemoving}
            onClick={() => onRemove(memberId, member.user.name)}
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        ) : (
          <button className="ui-btn" type="button" disabled>
            {isCurrentUser ? "You" : "Locked"}
          </button>
        )}
      </div>
    </article>
  );
}

export default MemberRow;
