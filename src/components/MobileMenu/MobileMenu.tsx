import { NavLink } from "react-router-dom";
import { IoHomeOutline, IoHomeSharp } from "react-icons/io5";
import { HiOutlineWallet, HiWallet } from "react-icons/hi2";
import { FaCirclePlus } from "react-icons/fa6";
import { MdOutlineSavings, MdSavings, MdOutlineAccountCircle, MdAccountCircle } from "react-icons/md";
import styles from "./MobileMenu.module.css";

export default function MobileMenu() {
  return (
    <nav className={styles.mobileMenu}>
      <NavLink to="/dashboard">
        {({ isActive }) => (isActive ? <IoHomeSharp /> : <IoHomeOutline />)}
      </NavLink>

      <NavLink to="/wallet">
        {({ isActive }) => (isActive ? <HiWallet /> : <HiOutlineWallet />)}
      </NavLink>

      <NavLink to="/create-account">
        <FaCirclePlus className={styles.createNew} />
      </NavLink>

      <NavLink to="/savings">
        {({ isActive }) => (isActive ? <MdSavings /> : <MdOutlineSavings />)}
      </NavLink>

      <NavLink to="/profile">
        {({ isActive }) => (isActive ? <MdAccountCircle /> : <MdOutlineAccountCircle />)}
      </NavLink>
    </nav>
  );
}