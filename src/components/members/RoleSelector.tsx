import type { AccountRole } from "../../types/account.types";
import styles from "./Members.module.css";

type RoleSelectorProps = {
  value: AccountRole;
  disabled?: boolean;
  onChange: (role: AccountRole) => void;
};

const ROLE_OPTIONS: AccountRole[] = ["OWNER", "ADMIN", "MEMBER"];

function RoleSelector({
  value,
  disabled = false,
  onChange,
}: RoleSelectorProps) {
  return (
    <select
      className={`ui-control ${styles.roleSelect}`}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as AccountRole)}
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}

export default RoleSelector;
