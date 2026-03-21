import { Suspense }       from "react"
import { auth }            from "@clerk/nextjs/server"
import { redirect }        from "next/navigation"
import ChatPageClient      from "./ChatClientPage"
import type { Message }    from "@/components/chat/thread/chat-thread"

interface Props {
    params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
    const { userId } = await auth()
    if (!userId) redirect("/login")

    const { id } = await params

    // History is loaded in the client component because the upstream API
    // requires a bearer token stored in localStorage.
    const messagesPromise: Promise<Message[]> = Promise.resolve([])

    return (
        // Suspense boundary handles the loading state while use() suspends
        <Suspense fallback={<ChatPageSkeleton />}>
            <ChatPageClient
                conversationId={id}
                messagesPromise={messagesPromise}
            />
        </Suspense>
    )
}

function ChatPageSkeleton() {
    return (
        <div className="flex flex-col rounded-t-4xl w-full h-full min-h-0 bg-background" />
    )
}