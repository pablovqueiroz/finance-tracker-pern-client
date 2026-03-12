import type { AccountMember, AccountRole } from "../../types/account.types";
import { useTranslation } from "react-i18next";
import MemberRow from "./MemberRow";
import styles from "./Members.module.css";

type MemberListProps = {
  members: AccountMember[];
  currentUserId?: string;
  canManageRoles: boolean;
  canRemoveMembers: boolean;
  updatingMemberId: string | null;
  removingMemberId: string | null;
  onRoleChange: (memberId: string, role: AccountRole) => void;
  onRemove: (memberId: string, memberName: string) => void;
};

function MemberList({
  members,
  currentUserId,
  canManageRoles,
  canRemoveMembers,
  updatingMemberId,
  removingMemberId,
  onRoleChange,
  onRemove,
}: MemberListProps) {
  const { t } = useTranslation();

  if (members.length === 0) {
    return <p className={styles.emptyState}>{t("members.empty")}</p>;
  }

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <span>{t("members.table.member")}</span>
        <span>{t("members.table.role")}</span>
        <span>{t("members.table.actions")}</span>
      </div>

      {members.map((member) => (
        <MemberRow
          key={member.id ?? member.userId}
          member={member}
          currentUserId={currentUserId}
          canManageRoles={canManageRoles}
          canRemoveMembers={canRemoveMembers}
          isUpdating={updatingMemberId === member.id}
          isRemoving={removingMemberId === member.id}
          onRoleChange={onRoleChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

export default MemberList;
