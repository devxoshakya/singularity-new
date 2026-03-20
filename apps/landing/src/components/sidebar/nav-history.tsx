"use client"

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

// ── Types ────────────────────────────────────────────────────────────────────

type Conversation = {
  id:        string
  title:     string
  createdAt: string
}

// ── Date grouping ────────────────────────────────────────────────────────────

function groupByDate(convos: Conversation[]) {
  const now       = new Date()
  const today     = new Date(now); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const thisWeek  = new Date(today); thisWeek.setDate(today.getDate() - 7)

  return convos.reduce(
    (acc, c) => {
      const d = new Date(c.createdAt); d.setHours(0, 0, 0, 0)
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

async function fetchConversations(): Promise<Conversation[]> {
  // Try localStorage first for instant paint
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("chat-history")
    if (cached) return JSON.parse(cached)
  }

  const res = await fetch("/api/conversations")
  if (!res.ok) throw new Error("Failed to load history")
  const data = await res.json()

  // Cache in localStorage for next visit
  if (typeof window !== "undefined") {
    localStorage.setItem("chat-history", JSON.stringify(data))
  }

  return data
}

// ── Component ────────────────────────────────────────────────────────────────

export function NavHistory() {
  const pathname = usePathname()

  const { data: conversations = [], isLoading } = useQuery({
    queryKey:        ["conversations"],
    queryFn:         fetchConversations,
    staleTime:       1000 * 30,          // 30s — refresh after new chat
    refetchOnMount:  true,
  })

  if (isLoading) {
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

  if (conversations.length === 0) {
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

  const grouped = groupByDate(conversations)

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