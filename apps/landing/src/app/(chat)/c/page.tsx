import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export default function ChatRedirect() {
    const chatId = randomUUID();
    redirect(`/c/${chatId}`);
}
