from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Ticket(BaseModel):
    ticket_id: str
    customer_email_address: str
    ticket_title: str
    ticket_summary: str
    email_subject: str
    email_body: str
    sender_timestamp: str
    status: str
    priority: str
    category: str

class GeneratedResponse(BaseModel):
    email_subject: str
    email_body: str
    receipient_email_address: str

class EmailRequest(BaseModel):
    email_subject: str
    email_body: str
    receipient_email_address: str

@app.post("/api/generate-response", response_model=GeneratedResponse)
async def generate_response(ticket: Ticket):
    try:
        # Mock response generation
        response = GeneratedResponse(
            email_subject=f"Re: {ticket.email_subject}",
            email_body=f"""Dear Customer,

Thank you for reaching out regarding your {ticket.category.lower().replace('_', ' ')}.

We understand that you're experiencing the following issue:
{ticket.ticket_summary}

Our team is working on resolving this matter. We will get back to you with an update soon.

Best regards,
Customer Support Team""",
            receipient_email_address=ticket.customer_email_address
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-email")
async def send_email(email_request: EmailRequest):
    try:
        # Mock email sending
        print(f"Mock email sent to {email_request.receipient_email_address}")
        print(f"Subject: {email_request.email_subject}")
        print(f"Body: {email_request.email_body}")
        
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
