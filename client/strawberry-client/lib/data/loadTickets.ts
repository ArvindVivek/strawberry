import { TicketsData } from "../types/ticket"
import ticketsData from "./tickets.json"

export function loadTickets(): TicketsData {
    return ticketsData as TicketsData
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
