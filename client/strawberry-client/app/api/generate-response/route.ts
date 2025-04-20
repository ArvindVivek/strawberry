import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { customer_email, email_subject, email_body, ticket_id } = body

        if (!customer_email || !email_subject || !email_body || !ticket_id) {
            return NextResponse.json(
                { detail: "Missing required fields" },
                { status: 400 }
            )
        }

        // Simulate loading delay (6-8 seconds)
        const delay = Math.floor(Math.random() * 2000) + 6000 // Random delay between 6-8 seconds
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Generate a mock response
        const mockResponse = {
            email_subject: `Re: ${email_subject}`,
            email_body: `Dear ${
                customer_email.split("@")[0]
            },\n\nThank you for reaching out regarding "${email_subject}". We understand your concern and would like to help resolve this matter.\n\nBased on the information provided, we can see that you're experiencing an issue with your recent booking. Our team has reviewed your case and we would like to offer the following solution:\n\n1. We can process a full refund for your booking\n2. Alternatively, we can rebook your flight at no additional cost\n3. We can also provide a travel credit for future use\n\nPlease let us know which option you prefer, and we'll process it immediately.\n\nBest regards,\nCustomer Support Team`,
            receipient_email_address: customer_email,
        }

        return NextResponse.json(mockResponse)
    } catch (error) {
        console.error("Error in generate-response route:", error)
        return NextResponse.json(
            { detail: "Internal server error" },
            { status: 500 }
        )
    }
}
