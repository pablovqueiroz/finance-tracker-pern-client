import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { GiPartyPopper } from "react-icons/gi";
import { MdErrorOutline } from "react-icons/md";
import styles from "./Message.module.css";

type MessageType = "error" | "success" | "info";

type MessageProps = {
  type?: MessageType;
  text: string | null;
  clearMessage?: Dispatch<SetStateAction<string | null>>;
  duration?: number;
};

function Message({
  type = "error",
  text,
  clearMessage,
  duration = 3000,
}: MessageProps) {
  useEffect(() => {
    if (!text || !clearMessage) return;

    const timer = window.setTimeout(() => {
      clearMessage(null);
    }, Math.min(duration, 3000));

    return () => window.clearTimeout(timer);
  }, [text, duration, clearMessage]);

  if (!text) return null;

  const Icon =
    type === "success" ? GiPartyPopper : type === "error" ? MdErrorOutline : null;

  return (
    <div
      className={`${styles.message} ${styles[type]}`}
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      {Icon ? <Icon className={styles.icon} aria-hidden="true" /> : null}
      <span className={styles.text}>{text}</span>
    </div>
  );
}

export default Message;
