import { TicketsData, Category } from "../types/ticket"
import ticketsData from "./tickets.json"
import { toast } from "sonner"

let lastFiles: string[] = []
let currentTickets: TicketsData = ticketsData as TicketsData

export function loadTickets(): TicketsData {
    return currentTickets
}

export function getTicketById(id: string) {
    const tickets = loadTickets().tickets
    return tickets.find((ticket) => ticket.ticket_id === id)
}

export function getTicketsByStatus(status: string) {
    const tickets = loadTickets().tickets
    return tickets.filter((ticket) => ticket.status === status)
}

export function getTicketsByPriority(priority: string) {
    const tickets = loadTickets().tickets
    return tickets.filter((ticket) => ticket.priority === priority)
}

export function getTicketsByCategory(category: string) {
    const tickets = loadTickets().tickets
    return tickets.filter((ticket) => ticket.category === category)
}

export function searchTickets(query: string) {
    const tickets = loadTickets().tickets
    const lowerQuery = query.toLowerCase()
    return tickets.filter(
        (ticket) =>
            ticket.ticket_title.toLowerCase().includes(lowerQuery) ||
            ticket.ticket_summary.toLowerCase().includes(lowerQuery) ||
            ticket.customer_email_address.toLowerCase().includes(lowerQuery)
    )
}

// Function to check for new files in server/data folder
export async function checkForNewFiles() {
    try {
        const baseUrl = "http://localhost:3000"
        const response = await fetch(`${baseUrl}/api/files`)
        if (!response.ok) {
            throw new Error("Failed to fetch files")
        }
        const currentFiles = await response.json()
        const newFiles = currentFiles.filter(
            (file: string) => !lastFiles.includes(file)
        )

        if (newFiles.length > 0) {
            // Load new ticket data
            for (const file of newFiles) {
                const fileResponse = await fetch(`${baseUrl}/api/files/${file}`)
                if (fileResponse.ok) {
                    const newTicket = await fileResponse.json()
                    // Add new ticket to current tickets
                    currentTickets.tickets.push({
                        customer_email_address: newTicket.customer_email,
                        ticket_title: newTicket.ticket_title,
                        ticket_summary: newTicket.ticket_summary,
                        email_subject: newTicket.email_subject,
                        email_body: newTicket.email_body,
                        sender_timestamp: newTicket.sender_timestamp,
                        priority: newTicket.priority.toUpperCase(),
                        ticket_id: newTicket.ticket_id.toString(),
                        status: "OPEN",
                        category: "OTHER" as Category,
                        filename: file,
                    })
                }
            }

            toast.success(
                `New ticket data file(s) detected: ${newFiles.join(", ")}`
            )
        }

        lastFiles = currentFiles
        return currentFiles
    } catch (error) {
        console.error("Error checking for new files:", error)
        return []
    }
}
