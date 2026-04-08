"use client"

import { useState } from "react"
import { useAppKit } from "@reown/appkit/react"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileSheet } from "@/components/profile-sheet"
import { useSession } from "@/lib/auth-client"
import { WalletIcon } from "lucide-react"

export function UserControls() {
  const { data: sessionData } = useSession()
  const isSignedIn = !!sessionData?.session
  const user = sessionData?.user
  const { open } = useAppKit()
  const [profileOpen, setProfileOpen] = useState(false)

  const displayName = user?.name || "User"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      {isSignedIn && user ? (
        <button
          onClick={() => setProfileOpen(true)}
          aria-label="Open profile"
          className="rounded-full ring-2 ring-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-ring"
        >
          <Avatar size="default">
            {user.image && <AvatarImage src={user.image} alt={displayName} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        </button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => open()}>
          <WalletIcon size={14} />
          Connect
        </Button>
      )}

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}
