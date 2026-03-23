"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery }     from "@tanstack/react-query"
import { usePathname }  from "next/navigation"
import Link             from "next/link"
import { MessageCircle, Trash2 } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
}                       from "@/components/ui/sidebar"
import { Skeleton }     from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { createFrontendJwtToken, getApiKey } from "@/lib/frontend-auth"
import {
  CHAT_HISTORY_UPDATED_EVENT,
  LocalStorageService,
} from "@/lib/local-storage-service"

// ── Types ────────────────────────────────────────────────────────────────────

type Conversation = {
  id:        string
  title:     string
  createdAt?: string
}

type SessionApiItem = {
  session_id: string
  title: string
}

function readCachedConversations(): Conversation[] {
  return LocalStorageService.getChatHistory()
}

// ── Date grouping ────────────────────────────────────────────────────────────

function groupByDate(convos: Conversation[]) {
  const now       = new Date()
  const today     = new Date(now); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const thisWeek  = new Date(today); thisWeek.setDate(today.getDate() - 7)

  return convos.reduce(
    (acc, c) => {
      if (!c.createdAt) {
        acc["Older"] = [...(acc["Older"] ?? []), c]
        return acc
      }

      const d = new Date(c.createdAt)
      if (Number.isNaN(d.getTime())) {
        acc["Older"] = [...(acc["Older"] ?? []), c]
        return acc
      }
      d.setHours(0, 0, 0, 0)
      const key =
        d >= today     ? "Today"     :
        d >= yesterday ? "Yesterday" :
        d >= thisWeek  ? "This week" : "Older"
      acc[key] = [...(acc[key] ?? []), c]
      return acc
    },
    {} as Record<string, Conversation[]>
  )
}

const GROUP_ORDER = ["Today", "Yesterday", "This week", "Older"] as const

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchConversations(identity?: { userId?: string | null; name?: string | null; email?: string | null }): Promise<Conversation[]> {
  const API_BASE =
    process.env.NEXT_PUBLIC_JHUNNU_API_URL ?? "https://jhunnu-backend.devshakya.xyz"

  // Read cache first for fallback and quick empty-token behavior.
  let cachedConversations: Conversation[] = []
  if (typeof window !== "undefined") {
    cachedConversations = readCachedConversations()
  }

  const token = await createFrontendJwtToken(identity)
  const apiKey = getApiKey()

  if (!token) {
    return cachedConversations
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }
    if (apiKey) {
      headers["x-api-key"] = apiKey
    }

    const res = await fetch(`${API_BASE}/sessions/`, {
      headers,
    })
    if (!res.ok) throw new Error("Failed to load history")
    const data = (await res.json()) as SessionApiItem[]

    const mapped: Conversation[] = data.map((item) => ({
      id: item.session_id,
      title: item.title,
      createdAt: undefined,
    }))

    // Merge server sessions with local cache so brand-new local chats
    // remain visible immediately until backend sessions catch up.
    const mappedIds = new Set(mapped.map((item) => item.id))
    const localOnly = cachedConversations.filter((item) => !mappedIds.has(item.id))

    const mergedServer = mapped.map((item) => {
      const localMatch = cachedConversations.find((cached) => cached.id === item.id)
      return {
        id: item.id,
        title: item.title?.trim() || localMatch?.title || "New chat",
        createdAt: localMatch?.createdAt,
      } satisfies Conversation
    })

    const merged: Conversation[] = [...localOnly, ...mergedServer]

    // Cache in localStorage for next visit
    if (typeof window !== "undefined") {
      LocalStorageService.setChatHistory(merged, true)
    }

    return merged
  } catch {
    return cachedConversations
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function NavHistory() {
  const { user, isLoaded } = useUser()
  const pathname = usePathname()
  const [tokenVersion, setTokenVersion] = useState(0)
  const [localConversations, setLocalConversations] = useState<Conversation[]>([])

  useEffect(() => {
    setLocalConversations(readCachedConversations())
  }, [])

  useEffect(() => {
    const refreshFromLocal = () => {
      setLocalConversations(readCachedConversations())
      setTokenVersion(v => v + 1)
    }

    window.addEventListener("storage", refreshFromLocal)
    window.addEventListener(CHAT_HISTORY_UPDATED_EVENT, refreshFromLocal)

    return () => {
      window.removeEventListener("storage", refreshFromLocal)
      window.removeEventListener(CHAT_HISTORY_UPDATED_EVENT, refreshFromLocal)
    }
  }, [])

  const { data: conversations = [], isLoading } = useQuery({
    queryKey:        ["conversations", tokenVersion],
    queryFn:         () =>
      fetchConversations({
        userId: user?.id,
        name: user?.fullName ?? user?.firstName ?? user?.username,
        email: user?.emailAddresses?.[0]?.emailAddress,
      }),
    enabled:         isLoaded,
    staleTime:       1000 * 30,          // 30s — refresh after new chat
    refetchOnMount:  true,
  })

  const displayConversations =
    conversations.length > 0 ? conversations : localConversations

  if (isLoading && localConversations.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>History</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="space-y-1 px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (displayConversations.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>History</SidebarGroupLabel>
        <SidebarGroupContent>
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No conversations yet.
          </p>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const grouped = groupByDate(displayConversations)

  return (
    <>
      {GROUP_ORDER.filter(g => grouped[g]?.length > 0).map(group => (
        <SidebarGroup key={group}>
          <SidebarGroupLabel>{group}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {grouped[group].map(c => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/c/${c.id}`}
                    tooltip={c.title}
                  >
                    <Link href={`/c/${c.id}`}>
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  {/* Delete action — shows on hover */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal className="w-4 h-4" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          // TODO: call delete API + invalidate query
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}