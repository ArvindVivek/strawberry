"use client"

import { ArrowLeft, Clock, Mail, Send } from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getTicketById } from "@/lib/data/loadTickets"
import { Ticket } from "@/lib/types/ticket"
import { notFound } from "next/navigation"

interface GeneratedResponse {
    email_subject: string
    email_body: string
    receipient_email_address: string
}

export default function TicketPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const ticket = getTicketById(id)

    const [showOriginalEmail, setShowOriginalEmail] = useState(false)
    const [generatedResponse, setGeneratedResponse] =
        useState<GeneratedResponse | null>(null)
    const [responseText, setResponseText] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)

    if (!ticket) {
        notFound()
    }

    const customerName = ticket.customer_email_address
        .split("@")[0]
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")

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

    const handleGenerateResponse = async () => {
        try {
            setIsGenerating(true)
            const response = await fetch("/api/generate-response", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_email: ticket.customer_email_address,
                    email_subject: ticket.email_subject,
                    email_body: ticket.email_body,
                    ticket_id: id,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(
                    errorData.detail || "Failed to generate response"
                )
            }

            const data = await response.json()
            setGeneratedResponse(data)
            setResponseText(data.email_body)
        } catch (error) {
            console.error("Error generating response:", error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to generate response"
            )
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSendResponse = async () => {
        if (!generatedResponse) return

        try {
            const response = await fetch("/api/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...generatedResponse,
                    email_body: responseText,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to send email")
            }

            toast.success("Email sent successfully")
            setGeneratedResponse(null)
            setResponseText("")
        } catch (error) {
            console.error("Error sending email:", error)
            toast.error("Failed to send email")
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mb-6 flex items-center gap-2">
                    <Link href="/tickets">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-[#2C1810]">
                        {ticket.ticket_title}
                    </h1>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_300px]">
                    <div className="space-y-6">
                        <Card className="border-[#FF5252]/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                    Ticket Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="rounded-lg bg-[#FFE5E5]/20 p-4">
                                        <h3 className="mb-2 text-sm font-medium text-[#FF5252]">
                                            Summary
                                        </h3>
                                        <p className="text-[#2C1810]">
                                            {ticket.ticket_summary}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={
                                                statusColors[ticket.status]
                                            }
                                        >
                                            {ticket.status}
                                        </Badge>
                                        <Badge
                                            className={
                                                priorityColors[ticket.priority]
                                            }
                                        >
                                            {ticket.priority}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="text-[#2C1810]"
                                        >
                                            {ticket.category}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                            setShowOriginalEmail(
                                                !showOriginalEmail
                                            )
                                        }
                                    >
                                        {showOriginalEmail
                                            ? "Hide Original Email"
                                            : "View Original Email"}
                                    </Button>
                                    {showOriginalEmail && (
                                        <div className="space-y-4 rounded-lg border border-[#FF5252]/20 p-4">
                                            <div className="rounded-lg bg-[#FFE5E5]/20 p-4">
                                                <h4 className="mb-2 text-sm font-medium text-[#FF8A80]">
                                                    Subject
                                                </h4>
                                                <p className="text-[#2C1810]">
                                                    {ticket.email_subject}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-[#FFE5E5]/20 p-4">
                                                <h4 className="mb-2 text-sm font-medium text-[#FFB74D]">
                                                    Body
                                                </h4>
                                                <p className="whitespace-pre-wrap text-[#2C1810]">
                                                    {ticket.email_body}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-[#2C1810]">
                                    Response
                                </h2>
                                <Button
                                    onClick={handleGenerateResponse}
                                    disabled={isGenerating}
                                    className="bg-[#FF5252] hover:bg-[#FF5252]/90"
                                >
                                    {isGenerating
                                        ? "Generating..."
                                        : "Generate Response"}
                                </Button>
                            </div>

                            {generatedResponse && (
                                <div className="space-y-4">
                                    <div className="bg-[#FFE5E5] p-4 rounded-lg">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#2C1810]">
                                                Subject
                                            </label>
                                            <p className="text-[#2C1810]">
                                                {
                                                    generatedResponse.email_subject
                                                }
                                            </p>
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            <label className="text-sm font-medium text-[#2C1810]">
                                                Body
                                            </label>
                                            <Textarea
                                                value={responseText}
                                                onChange={(e) =>
                                                    setResponseText(
                                                        e.target.value
                                                    )
                                                }
                                                className="min-h-[200px] bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSendResponse}
                                            className="bg-[#FF5252] hover:bg-[#FF5252]/90"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Response
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-[#FF5252]/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                    Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
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
                                        <div>
                                            <p className="font-medium text-[#2C1810]">
                                                {customerName}
                                            </p>
                                            <p className="text-sm text-[#2C1810]">
                                                {ticket.customer_email_address}
                                            </p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-[#2C1810]">
                                            <Clock className="h-4 w-4 text-[#FF5252]" />
                                            <span>
                                                Created:{" "}
                                                {new Date(
                                                    ticket.sender_timestamp
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
