import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function ChatRedirect() {
    const chatId = uuidv4();
    redirect(`/c/${chatId}`);
}
