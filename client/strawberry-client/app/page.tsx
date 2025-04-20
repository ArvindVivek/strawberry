"use client"

import { ArrowUp, Clock, MessageSquare, Users } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadTickets, getTicketsByStatus } from "@/lib/data/loadTickets"
import { Ticket } from "@/lib/types/ticket"
import { useFileWatcher } from "@/hooks/useFileWatcher"

export default function DashboardPage() {
    // Initialize file watching
    useFileWatcher()

    const tickets = loadTickets().tickets
    const openTickets = getTicketsByStatus("OPEN")
    const pendingTickets = getTicketsByStatus("PENDING")
    const closedTickets = getTicketsByStatus("CLOSED")

    const totalTickets = tickets.length
    const resolutionRate = Math.round(
        (closedTickets.length / totalTickets) * 100
    )
    const averageResponseTime = "5m 23s" // This would be calculated from actual response times
    const customerSatisfaction = "92%" // This would be calculated from actual satisfaction data

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 space-y-4 p-4 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-[#2C1810]">
                        Dashboard
                    </h1>
                    <Button className="bg-[#FF5252] hover:bg-[#FF5252]/90">
                        <Link href="/tickets/new">New Ticket</Link>
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[#FF5252]/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                Total Tickets
                            </CardTitle>
                            <MessageSquare className="h-4 w-4 text-[#2C1810]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#2C1810]">
                                {totalTickets}
                            </div>
                            <p className="text-xs text-[#2C1810]">
                                <span className="text-[#FF5252]">+12%</span>{" "}
                                from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#FF5252]/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                Response Time
                            </CardTitle>
                            <Clock className="h-4 w-4 text-[#2C1810]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#2C1810]">
                                {averageResponseTime}
                            </div>
                            <p className="text-xs text-[#2C1810]">
                                <span className="text-[#FF5252]">-8%</span> from
                                last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#FF5252]/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                Customer Satisfaction
                            </CardTitle>
                            <Users className="h-4 w-4 text-[#2C1810]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#2C1810]">
                                {customerSatisfaction}
                            </div>
                            <p className="text-xs text-[#2C1810]">
                                <span className="text-[#FF5252]">+2%</span> from
                                last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#FF5252]/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                Resolution Rate
                            </CardTitle>
                            <ArrowUp className="h-4 w-4 text-[#2C1810]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#2C1810]">
                                {resolutionRate}%
                            </div>
                            <p className="text-xs text-[#2C1810]">
                                <span className="text-[#FF5252]">+5%</span> from
                                last month
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <Tabs defaultValue="active" className="space-y-4">
                    <TabsList className="bg-[#FFE5E5]">
                        <TabsTrigger
                            value="active"
                            className="data-[state=active]:bg-[#FF5252] data-[state=active]:text-[#FFF5F5]"
                        >
                            Active Tickets
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="data-[state=active]:bg-[#FF5252] data-[state=active]:text-[#FFF5F5]"
                        >
                            Pending
                        </TabsTrigger>
                        <TabsTrigger
                            value="closed"
                            className="data-[state=active]:bg-[#FF5252] data-[state=active]:text-[#FFF5F5]"
                        >
                            Closed
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="space-y-4">
                        <div className="grid gap-4">
                            {openTickets.map((ticket) => (
                                <TicketCard
                                    key={ticket.ticket_id}
                                    ticket={ticket}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="pending" className="space-y-4">
                        <div className="grid gap-4">
                            {pendingTickets.map((ticket) => (
                                <TicketCard
                                    key={ticket.ticket_id}
                                    ticket={ticket}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="closed" className="space-y-4">
                        <div className="grid gap-4">
                            {closedTickets.map((ticket) => (
                                <TicketCard
                                    key={ticket.ticket_id}
                                    ticket={ticket}
                                />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
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
