import Link from "next/link"
import { StrawberryIcon } from "@/components/ui/strawberry-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-[#FFF5F5] px-6">
            <Link
                href="/"
                className="flex items-center justify-center gap-2 font-semibold mx-auto"
            >
                <StrawberryIcon className="h-10 w-10" />
                <span className="text-2xl font-bold bg-gradient-to-r from-[#FF8A80] to-[#FF5252] bg-clip-text text-transparent">
                    Strawberry
                </span>
            </Link>
            <nav className="hidden flex-1 items-center gap-8 md:flex">
                <Link
                    href="/"
                    className="text-base font-bold text-[#2C1810] transition-colors hover:text-[#FF5252] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#FF5252] after:transition-all hover:after:w-full"
                >
                    Dashboard
                </Link>
                <Link
                    href="/tickets"
                    className="text-base font-bold text-[#2C1810] transition-colors hover:text-[#FF5252] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#FF5252] after:transition-all hover:after:w-full"
                >
                    Tickets
                </Link>
                <Link
                    href="/customers"
                    className="text-base font-bold text-[#2C1810] transition-colors hover:text-[#FF5252] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#FF5252] after:transition-all hover:after:w-full"
                >
                    Customers
                </Link>
                <Link
                    href="/analytics"
                    className="text-base font-bold text-[#2C1810] transition-colors hover:text-[#FF5252] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#FF5252] after:transition-all hover:after:w-full"
                >
                    Analytics
                </Link>
            </nav>
            <div className="ml-auto flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-md bg-[#FF5252]/5 px-4 text-sm font-medium text-[#2C1810] transition-colors hover:bg-[#FF5252]/10 hover:text-[#FF5252] border-[#FF5252]/20"
                >
                    New Ticket
                </Button>
                <Avatar className="h-9 w-9 ring-2 ring-[#FF5252]/20">
                    <AvatarImage
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                        alt="Avatar"
                    />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
            </div>
        </header>
    )
}
