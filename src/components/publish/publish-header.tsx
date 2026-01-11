"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function PublishHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <SidebarTrigger />
        </div>
        <Link href="/">
          <Image
            src="https://images.jazelc.com/uploads/hot-cars/hotcars_logo_green.png"
            alt="HotCars Logo"
            width={160}
            height={40}
            className="cursor-pointer"
          />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="hidden md:flex flex-col text-left">
          <p className="truncate text-sm font-semibold">John Doe</p>
          <p className="truncate text-xs text-muted-foreground">
            john.doe@example.com
          </p>
        </div>
      </div>
    </header>
  );
}
