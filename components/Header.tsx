"use client";

import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { OPEN_PALETTE_EVENT } from "@/components/CommandPalette";

interface HeaderProps {
  name: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Header({ name }: HeaderProps) {
  const openPalette = () =>
    window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));

  return (
    <header className="glass sticky top-0 z-30 border-x-0 border-t-0 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" aria-label="ScriptFlow home" className="shrink-0">
          <Logo />
        </Link>

        <button
          type="button"
          onClick={openPalette}
          className="hidden md:flex items-center gap-2 h-9 w-full max-w-sm rounded-lg border bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Search or jump to…</span>
          <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <Button
            aria-label="Search"
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={openPalette}
          >
            <Search className="h-4 w-4" />
          </Button>
          <NotificationBell />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="h-8 w-8 shrink-0 rounded-full bg-primary text-xs font-semibold text-primary-foreground outline-none transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {initials(name) || "U"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium truncate">{name}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="gap-2">
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
