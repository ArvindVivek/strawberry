"use client"

import { Filter, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useFileMonitor } from "@/hooks/useFileMonitor"
import { Toaster } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTicketsByStatus, searchTickets } from "@/lib/data/loadTickets"
import { Ticket } from "@/lib/types/ticket"

export default function TicketsPage() {
    const { files, isLoading } = useFileMonitor()
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")

    const filteredTickets = searchQuery
        ? searchTickets(searchQuery)
        : statusFilter === "ALL"
        ? getTicketsByStatus("OPEN")
        : getTicketsByStatus(statusFilter)

    return (
        <div className="flex min-h-screen flex-col">
            <Toaster />
            <Header />
            <main className="flex-1 space-y-4 p-4 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-[#2C1810]">
                        Tickets
                    </h1>
                    <Button className="bg-[#FF5252] hover:bg-[#FF5252]/90">
                        <Link href="/tickets/new">New Ticket</Link>
                    </Button>
                </div>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#2C1810]" />
                        <Input
                            className="pl-8"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Tickets</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-4">
                    {filteredTickets.map((ticket) => (
                        <TicketCard key={ticket.ticket_id} ticket={ticket} />
                    ))}
                </div>
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-[#2C1810]">
                        Data Files
                    </h2>
                    <ul className="list-disc pl-5">
                        {files.map((file) => (
                            <li key={file.filename} className="text-[#2C1810]">
                                {file.filename} (Last Modified:{" "}
                                {new Date(file.last_modified).toLocaleString()})
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    )
}

function TicketCard({ ticket }: { ticket: Ticket }) {
    const statusColors = {
        OPEN: "bg-[#FF5252] text-[#FFF5F5]",
        PENDING: "bg-[#FF8A80] text-[#2C1810]",
        CLOSED: "bg-[#FFE5E5] text-[#2C1810]",
    }

    const priorityColors = {
        HIGH: "bg-[#FF5252] text-[#FFF5F5]",
        MEDIUM: "bg-[#FF8A80] text-[#2C1810]",
        LOW: "bg-[#FFE5E5] text-[#2C1810]",
    }

    const customerName = ticket.customer_email_address
        .split("@")[0]
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")

    return (
        <Link href={`/tickets/${ticket.ticket_id}`}>
            <Card className="hover:bg-[#FFE5E5]/50 transition-colors">
                <div className="flex items-start gap-4 p-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customerName}`}
                            alt={customerName}
                        />
                        <AvatarFallback>
                            {customerName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[#2C1810]">
                                {ticket.ticket_title}
                            </h3>
                            <Badge className={statusColors[ticket.status]}>
                                {ticket.status}
                            </Badge>
                            <Badge className={priorityColors[ticket.priority]}>
                                {ticket.priority}
                            </Badge>
                        </div>
                        <p className="text-sm text-[#2C1810]">
                            {ticket.ticket_summary}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#2C1810]">
                            <span>{customerName}</span>
                            <span>•</span>
                            <span>
                                {new Date(
                                    ticket.sender_timestamp
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
