"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Ticket } from "@/lib/types/ticket"

export default function NewTicketPage() {
    const router = useRouter()
    const [formData, setFormData] = useState<Partial<Ticket>>({
        status: "OPEN",
        priority: "MEDIUM",
        category: "TECHNICAL_ISSUE",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // In a real application, you would send this to your API
        const newTicket: Ticket = {
            ticket_id: `TKT-${Date.now()}`,
            customer_email_address: formData.customer_email_address || "",
            ticket_title: formData.ticket_title || "",
            ticket_summary: formData.ticket_summary || "",
            email_subject: formData.ticket_title || "",
            email_body: formData.ticket_summary || "",
            sender_timestamp: new Date().toISOString(),
            status: formData.status || "OPEN",
            priority: formData.priority || "MEDIUM",
            category: formData.category || "TECHNICAL_ISSUE",
        }

        // Here you would typically make an API call to create the ticket
        console.log("Creating new ticket:", newTicket)

        // Redirect to the new ticket page
        router.push(`/tickets/${newTicket.ticket_id}`)
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
                        New Ticket
                    </h1>
                </div>
                <Card className="border-[#FF5252]/20">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-[#2C1810]">
                            Create New Ticket
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="customer_email"
                                    className="text-[#2C1810]"
                                >
                                    Customer Email
                                </Label>
                                <Input
                                    id="customer_email"
                                    type="email"
                                    placeholder="customer@example.com"
                                    value={formData.customer_email_address}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_email_address:
                                                e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="title"
                                    className="text-[#2C1810]"
                                >
                                    Ticket Title
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Brief description of the issue"
                                    value={formData.ticket_title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            ticket_title: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="summary"
                                    className="text-[#2C1810]"
                                >
                                    Ticket Summary
                                </Label>
                                <Textarea
                                    id="summary"
                                    placeholder="Detailed description of the issue"
                                    value={formData.ticket_summary}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            ticket_summary: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="status"
                                        className="text-[#2C1810]"
                                    >
                                        Status
                                    </Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                status: value as Ticket["status"],
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OPEN">
                                                Open
                                            </SelectItem>
                                            <SelectItem value="PENDING">
                                                Pending
                                            </SelectItem>
                                            <SelectItem value="CLOSED">
                                                Closed
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="priority"
                                        className="text-[#2C1810]"
                                    >
                                        Priority
                                    </Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                priority:
                                                    value as Ticket["priority"],
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HIGH">
                                                High
                                            </SelectItem>
                                            <SelectItem value="MEDIUM">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="LOW">
                                                Low
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="category"
                                        className="text-[#2C1810]"
                                    >
                                        Category
                                    </Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                category:
                                                    value as Ticket["category"],
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FLIGHT_CANCELLATION">
                                                Flight Cancellation
                                            </SelectItem>
                                            <SelectItem value="REFUND_REQUEST">
                                                Refund Request
                                            </SelectItem>
                                            <SelectItem value="TECHNICAL_ISSUE">
                                                Technical Issue
                                            </SelectItem>
                                            <SelectItem value="LOST_LUGGAGE">
                                                Lost Luggage
                                            </SelectItem>
                                            <SelectItem value="SPECIAL_ASSISTANCE">
                                                Special Assistance
                                            </SelectItem>
                                            <SelectItem value="UPGRADE_REQUEST">
                                                Upgrade Request
                                            </SelectItem>
                                            <SelectItem value="COMPENSATION_REQUEST">
                                                Compensation Request
                                            </SelectItem>
                                            <SelectItem value="PET_TRAVEL">
                                                Pet Travel
                                            </SelectItem>
                                            <SelectItem value="PROFILE_UPDATE">
                                                Profile Update
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/tickets")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#FF5252] hover:bg-[#FF5252]/90"
                                >
                                    Create Ticket
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
