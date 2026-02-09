"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User,
  Heart,
  Bookmark,
  Clock,
  Shield,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { signOut } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getInitials(name: string | undefined | null, email: string | undefined | null): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0] ?? "")
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }
  if (email) {
    const first = email[0]
    return first ? first.toUpperCase() : "U"
  }
  return "U"
}

export function UserMenu() {
  const { user, isPending } = useAuth()
  const router = useRouter()

  if (isPending) {
    return <Skeleton className="h-8 w-20" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="font-heading text-xs uppercase tracking-wider"
        >
          <Link href="/login">[ Sign_In ]</Link>
        </Button>
        <Button
          size="sm"
          asChild
          className="font-heading text-xs uppercase tracking-wider"
        >
          <Link href="/register">[ Sign_Up ]</Link>
        </Button>
      </div>
    )
  }

  const initials = getInitials(user.name, user.email)
  const isAdmin = user.role === "admin"

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/")
        },
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="User menu">
          <Avatar size="sm">
            <AvatarFallback className="font-heading text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            {user.name && (
              <p className="text-sm font-medium leading-none font-heading">
                {user.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground leading-none font-heading">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer font-heading text-xs uppercase tracking-wider">
            <User className="mr-2 size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/favorites" className="cursor-pointer font-heading text-xs uppercase tracking-wider">
            <Heart className="mr-2 size-4" />
            Favorites
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bookmarks" className="cursor-pointer font-heading text-xs uppercase tracking-wider">
            <Bookmark className="mr-2 size-4" />
            Bookmarks
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/history" className="cursor-pointer font-heading text-xs uppercase tracking-wider">
            <Clock className="mr-2 size-4" />
            View_History
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer font-heading text-xs uppercase tracking-wider text-primary">
                <Shield className="mr-2 size-4" />
                Admin_Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive font-heading text-xs uppercase tracking-wider"
          onSelect={handleSignOut}
        >
          <LogOut className="mr-2 size-4" />
          [ Disconnect ]
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
