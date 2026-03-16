import { useState } from "react";
import type { AccountMember, AccountRole } from "../../types/account.types";
import { useTranslation } from "react-i18next";
import { FaUserEdit } from "react-icons/fa";
import { getRoleLabel } from "../../utils/displayLabels";
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
  const { t } = useTranslation();
  const memberId = member.id ?? "";
  const isCurrentUser = member.userId === currentUserId;
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AccountRole>(member.role);
  const canEditRole =
    canManageRoles &&
    member.role !== "OWNER" &&
    Boolean(memberId);
  const canRemove = canRemoveMembers && !isCurrentUser && Boolean(memberId);
  const isBusy = isUpdating || isRemoving;

  function handleToggleRoleEditor() {
    if (!canEditRole || isBusy) return;

    setSelectedRole(member.role);
    setIsEditingRole((current) => !current);
  }

  function handleUpdateRole() {
    if (!memberId || selectedRole === member.role || isBusy) return;

    onRoleChange(memberId, selectedRole);
    setIsEditingRole(false);
  }

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
          <p className={styles.email}>{member.user.email ?? t("common.noEmail")}</p>
        </div>
      </div>

      <span className={styles.roleBadge}>{getRoleLabel(t, member.role)}</span>

      <div className={styles.actions}>
        <div className={styles.roleEditor}>
          {canEditRole ? (
            <>
              <button
                className={styles.editButton}
                type="button"
                aria-label={t("members.editRole", { name: member.user.name })}
                aria-expanded={isEditingRole}
                disabled={isBusy}
                onClick={handleToggleRoleEditor}
              >
                <FaUserEdit aria-hidden="true" />
              </button>

              {isEditingRole ? (
                <div className={styles.roleEditorPanel}>
                  <RoleSelector
                    value={selectedRole}
                    options={["MEMBER", "ADMIN"]}
                    disabled={isBusy}
                    onChange={setSelectedRole}
                  />
                  <button
                    className="ui-btn"
                    type="button"
                    disabled={isBusy || selectedRole === member.role}
                    onClick={handleUpdateRole}
                  >
                    {isUpdating ? t("common.updating") : t("common.update")}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {canRemove ? (
          <button
            className={`ui-btn ${styles.removeButton}`}
            type="button"
            disabled={isBusy}
            onClick={() => onRemove(memberId, member.user.name)}
          >
            {isRemoving ? t("members.removing") : t("common.remove")}
          </button>
        ) : (
          <button className="ui-btn" type="button" disabled>
            {isCurrentUser ? t("members.currentUser") : t("members.locked")}
          </button>
        )}
      </div>
    </article>
  );
}

export default MemberRow;
