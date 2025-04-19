export type Priority = "HIGH" | "MEDIUM" | "LOW"
export type Status = "OPEN" | "PENDING" | "CLOSED"
export type Category =
    | "FLIGHT_CANCELLATION"
    | "REFUND_REQUEST"
    | "TECHNICAL_ISSUE"
    | "LOST_LUGGAGE"
    | "SPECIAL_ASSISTANCE"
    | "UPGRADE_REQUEST"
    | "COMPENSATION_REQUEST"
    | "PET_TRAVEL"
    | "PROFILE_UPDATE"

export interface Ticket {
    customer_email_address: string
    ticket_title: string
    ticket_summary: string
    email_subject: string
    email_body: string
    sender_timestamp: string
    priority: Priority
    ticket_id: string
    status: Status
    category: Category
}

export interface TicketsData {
    tickets: Ticket[]
}
