import type { AccountRole } from "../../types/account.types";
import { useTranslation } from "react-i18next";
import { getRoleLabel } from "../../utils/displayLabels";
import styles from "./Members.module.css";

type RoleSelectorProps = {
  value: AccountRole;
  options?: AccountRole[];
  disabled?: boolean;
  onChange: (role: AccountRole) => void;
};

const ROLE_OPTIONS: AccountRole[] = ["OWNER", "ADMIN", "MEMBER"];

function RoleSelector({
  value,
  options = ROLE_OPTIONS,
  disabled = false,
  onChange,
}: RoleSelectorProps) {
  const { t } = useTranslation();

  return (
    <select
      className={`ui-control ${styles.roleSelect}`}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as AccountRole)}
    >
      {options.map((role) => (
        <option key={role} value={role}>
          {getRoleLabel(t, role)}
        </option>
      ))}
    </select>
  );
}

export default RoleSelector;
