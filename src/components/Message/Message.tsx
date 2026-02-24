import { useEffect } from "react";

type MessageType = "error" | "success" | "info";

type MessageProps = {
    type?: MessageType;
    text: string | null;
    clearMessage?: React.Dispatch<React.SetStateAction<string | null>>;
    duration?: number;
};

function Message({ type = "error", text, clearMessage, duration = 3000 }: MessageProps) {
    useEffect(() => {
        if (!text || !clearMessage) return;
        const timer: number = setTimeout(() => {
            clearMessage(null)
        }, duration)

        return () => clearTimeout(timer);
    }, [text, duration, clearMessage])

    if (!text) return null;

    return <p className={`message ${type}`}>{text}</p>;
}

export default Message;