'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Minus, Paperclip, ArrowLeft, Search } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatUser {
  id: string
  name: string | null
  companyName: string | null
  isOnline: boolean
}

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  sender: { id: string; name: string | null; companyName: string | null }
  receiver: { id: string; name: string | null; companyName: string | null }
}

interface ConversationSummary {
  userId: string
  name: string
  companyName: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// ─── Conversation List ───────────────────────────────────────────────────────

function ConversationList({
  conversations,
  onSelect,
  searchQuery,
  onSearchChange,
  isLoading,
}: {
  conversations: ConversationSummary[]
  onSelect: (userId: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  isLoading: boolean
}) {
  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:border-agri-emerald/50 focus-visible:ring-agri-emerald/20"
          />
        </div>
      </div>

      {/* Conversation items */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="size-8 border-2 border-agri-emerald/30 border-t-agri-emerald rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="size-12 rounded-full bg-white/5 flex items-center justify-center">
              <Send className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => onSelect(conv.userId)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="size-10 border border-white/10">
                    <AvatarFallback className="bg-agri-emerald/20 text-agri-emerald text-sm font-semibold">
                      {getInitials(conv.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-[oklch(0.15_0.012_260)]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {conv.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  {conv.companyName && (
                    <p className="text-xs text-agri-gold/70 truncate">{conv.companyName}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <Badge className="shrink-0 size-5 p-0 flex items-center justify-center bg-agri-emerald text-white text-[10px] font-bold border-0 rounded-full">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ─── Chat View ───────────────────────────────────────────────────────────────

function ChatView({
  messages,
  otherUser,
  onBack,
  onSend,
  isLoading,
  isSending,
}: {
  messages: ChatMessage[]
  otherUser: ChatUser | null
  onBack: () => void
  onSend: (content: string) => void
  isLoading: boolean
  isSending: boolean
}) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAppStore((s) => s.user)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when entering chat
  useEffect(() => {
    if (otherUser && !isLoading) {
      inputRef.current?.focus()
    }
  }, [otherUser, isLoading])

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setInputValue('')
  }, [inputValue, isSending, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="relative shrink-0">
          <Avatar className="size-9 border border-white/10">
            <AvatarFallback className="bg-agri-emerald/20 text-agri-emerald text-xs font-semibold">
              {getInitials(otherUser?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          {otherUser?.isOnline && (
            <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-[oklch(0.15_0.012_260)]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {otherUser?.name ?? 'Unknown User'}
          </p>
          <p className="text-xs text-muted-foreground">
            {otherUser?.isOnline ? (
              <span className="text-emerald-400">Online</span>
            ) : (
              'Offline'
            )}
            {otherUser?.companyName && (
              <span className="ml-1.5">· {otherUser.companyName}</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="size-8 border-2 border-agri-emerald/30 border-t-agri-emerald rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="size-14 rounded-full bg-white/5 flex items-center justify-center">
              <Send className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60">Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Date separator */}
            <div className="flex items-center justify-center py-2">
              <span className="text-[10px] text-muted-foreground/50 bg-white/5 px-3 py-1 rounded-full">
                Today
              </span>
            </div>

            {messages.map((msg, idx) => {
              const isOwn = msg.senderId === user?.id
              const showAvatar =
                !isOwn &&
                (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId)
              const isLastInGroup =
                idx === messages.length - 1 ||
                messages[idx + 1]?.senderId !== msg.senderId

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                    isLastInGroup ? 'mb-3' : 'mb-0.5'
                  }`}
                >
                  {/* Other user avatar */}
                  {!isOwn && (
                    <div className="w-8 shrink-0 mr-2">
                      {showAvatar && (
                        <Avatar className="size-7 border border-white/10">
                          <AvatarFallback className="bg-agri-emerald/15 text-agri-emerald text-[10px] font-semibold">
                            {getInitials(msg.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender name for group context */}
                    {!isOwn && showAvatar && (
                      <p className="text-[11px] text-agri-gold/70 mb-1 ml-1">
                        {msg.sender.name ?? 'Unknown'}
                      </p>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        isOwn
                          ? 'bg-agri-emerald text-white rounded-br-md'
                          : 'bg-white/[0.06] text-foreground/90 border border-white/[0.06] rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Timestamp */}
                    {isLastInGroup && (
                      <p
                        className={`text-[10px] text-muted-foreground/50 mt-1 ${
                          isOwn ? 'text-right mr-1' : 'ml-1'
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
            title="Attach file (coming soon)"
          >
            <Paperclip className="size-4" />
          </Button>

          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 h-9 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:border-agri-emerald/50 focus-visible:ring-agri-emerald/20"
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="size-9 shrink-0 bg-agri-emerald hover:bg-agri-emerald/80 text-white rounded-lg disabled:opacity-40"
          >
            {isSending ? (
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ChatPanel ──────────────────────────────────────────────────────────

export function ChatPanel() {
  const { chatOpen, setChatOpen, activeChatUser, setActiveChatUser, user } =
    useAppStore()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingConvs, setIsLoadingConvs] = useState(false)
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Fetch conversations when panel opens
  useEffect(() => {
    if (!chatOpen || !user) return

    const fetchConversations = async () => {
      setIsLoadingConvs(true)
      try {
        const res = await fetch(`/api/messages?userId=${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        // Group messages by conversation partner
        const convMap = new Map<
          string,
          {
            name: string
            companyName: string | null
            lastMessage: string
            lastMessageTime: string
            unreadCount: number
            isOnline: boolean
          }
        >()

        for (const msg of data.messages as ChatMessage[]) {
          const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId
          const partner =
            msg.senderId === user.id ? msg.receiver : msg.sender
          const existing = convMap.get(partnerId)

          const msgTime = new Date(msg.createdAt).getTime()

          if (!existing || msgTime > new Date(existing.lastMessageTime).getTime()) {
            convMap.set(partnerId, {
              name: partner.name ?? 'Unknown User',
              companyName: partner.companyName,
              lastMessage:
                msg.senderId === user.id ? `You: ${msg.content}` : msg.content,
              lastMessageTime: msg.createdAt,
              unreadCount:
                (existing?.unreadCount ?? 0) +
                (msg.senderId !== user.id && !msg.isRead ? 1 : 0),
              isOnline: false,
            })
          } else if (msg.senderId !== user.id && !msg.isRead) {
            existing.unreadCount += 1
          }
        }

        // Fetch online status for conversation partners
        const convList: ConversationSummary[] = []
        for (const [userId, info] of convMap) {
          convList.push({
            userId,
            ...info,
          })
        }

        // Sort by last message time (newest first)
        convList.sort(
          (a, b) =>
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
        )

        setConversations(convList)

        // Try to fetch online status for users
        try {
          const usersRes = await fetch('/api/users')
          if (usersRes.ok) {
            const usersData = await usersRes.json()
            const onlineMap = new Map<string, boolean>()
            for (const u of usersData.users ?? []) {
              onlineMap.set(u.id, u.isOnline ?? false)
            }
            setConversations((prev) =>
              prev.map((c) => ({
                ...c,
                isOnline: onlineMap.get(c.userId) ?? false,
              }))
            )
          }
        } catch {
          // Silently ignore online status fetch failure
        }
      } catch {
        toast.error('Failed to load conversations')
      } finally {
        setIsLoadingConvs(false)
      }
    }

    fetchConversations()
  }, [chatOpen, user])

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatUser || !user) {
      setMessages([])
      setOtherUser(null)
      return
    }

    const fetchMessages = async () => {
      setIsLoadingMsgs(true)
      try {
        // Fetch conversation messages
        const res = await fetch(
          `/api/messages?userId=${user.id}&otherUserId=${activeChatUser}`
        )
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setMessages(data.messages ?? [])

        // Fetch other user details
        const userRes = await fetch(`/api/users?id=${activeChatUser}`)
        if (userRes.ok) {
          const userData = await userRes.json()
          const u = userData.user ?? userData.users?.[0]
          if (u) {
            setOtherUser({
              id: u.id,
              name: u.name,
              companyName: u.companyName,
              isOnline: u.isOnline ?? false,
            })
          }
        }
      } catch {
        toast.error('Failed to load messages')
      } finally {
        setIsLoadingMsgs(false)
      }
    }

    fetchMessages()

    // Poll for new messages every 5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/messages?userId=${user.id}&otherUserId=${activeChatUser}`
        )
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages ?? [])
        }
      } catch {
        // Silent fail for polling
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [activeChatUser, user])

  const handleSelectConversation = useCallback(
    (userId: string) => {
      setActiveChatUser(userId)
      // Clear unread for that conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === userId ? { ...c, unreadCount: 0 } : c
        )
      )
    },
    [setActiveChatUser]
  )

  const handleBack = useCallback(() => {
    setActiveChatUser(null)
    setOtherUser(null)
    setMessages([])
  }, [setActiveChatUser])

  const handleSend = useCallback(
    async (content: string) => {
      if (!user || !activeChatUser) return
      setIsSending(true)
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.id,
            receiverId: activeChatUser,
            content,
          }),
        })

        if (!res.ok) throw new Error('Failed to send')

        const data = await res.json()
        setMessages((prev) => [...prev, data.message])

        // Update conversation list
        setConversations((prev) => {
          const existing = prev.find((c) => c.userId === activeChatUser)
          if (existing) {
            return prev
              .map((c) =>
                c.userId === activeChatUser
                  ? { ...c, lastMessage: `You: ${content}`, lastMessageTime: new Date().toISOString() }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(b.lastMessageTime).getTime() -
                  new Date(a.lastMessageTime).getTime()
              )
          }
          return prev
        })
      } catch {
        toast.error('Failed to send message')
      } finally {
        setIsSending(false)
      }
    },
    [user, activeChatUser]
  )

  const handleClose = useCallback(() => {
    setChatOpen(false)
  }, [setChatOpen])

  const handleMinimize = useCallback(() => {
    setChatOpen(false)
  }, [setChatOpen])

  // Don't render anything if user is not logged in
  if (!user) return null

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={handleClose}
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[380px] glass-card-strong rounded-l-2xl flex flex-col overflow-hidden"
            style={{
              boxShadow:
                '-10px 0 40px rgba(0, 0, 0, 0.3), 0 0 80px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-2 rounded-full bg-agri-emerald animate-pulse-green shrink-0" />
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {activeChatUser ? otherUser?.name ?? 'Chat' : 'Messages'}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMinimize}
                  className="size-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <Minus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="size-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Content: Conversation List or Chat View */}
            <div className="flex-1 min-h-0">
              {activeChatUser ? (
                <ChatView
                  messages={messages}
                  otherUser={otherUser}
                  onBack={handleBack}
                  onSend={handleSend}
                  isLoading={isLoadingMsgs}
                  isSending={isSending}
                />
              ) : (
                <ConversationList
                  conversations={conversations}
                  onSelect={handleSelectConversation}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  isLoading={isLoadingConvs}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
