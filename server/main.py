from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import datetime
import json
import os
import glob
import asyncio
from dotenv import load_dotenv
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
)
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.core.agent import ReActAgent
from llama_index.llms.openai import OpenAI

# Load environment variables
load_dotenv()

# Get OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Initialize OpenAI with explicit API key
llm = OpenAI(
    model="gpt-4",
    api_key=openai_api_key,
    temperature=0.7
)

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
    customer_email: str
    email_subject: str
    email_body: str
    ticket_id: str

class EmailResponse(BaseModel):
    email_subject: str
    email_body: str
    receipient_email_address: str

class SaveDataRequest(BaseModel):
    data: str  # Changed from dict to str to accept stringified JSON

class FileInfo(BaseModel):
    filename: str
    path: str
    last_modified: str

# Define data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
POLICY_FILE = os.path.join(os.path.dirname(__file__), "airline_policy.rtf")

def initialize_agent():
    try:
        # Try to load existing indices
        ticket_storage_context = StorageContext.from_defaults(
            persist_dir=os.path.join(os.path.dirname(__file__), "ticket_index")
        )
        policy_storage_context = StorageContext.from_defaults(
            persist_dir=os.path.join(os.path.dirname(__file__), "policy_index")
        )
        
        ticket_index = load_index_from_storage(ticket_storage_context)
        policy_index = load_index_from_storage(policy_storage_context)
        
        print("Loaded existing indices")
    except:
        # If indices don't exist, create them
        print("Creating new indices")
        # Load ticket data
        ticket_files = [os.path.join(DATA_DIR, f) for f in os.listdir(DATA_DIR) if f.endswith('.json')]
        tickets = SimpleDirectoryReader(input_files=ticket_files).load_data()
        
        # Load policy data
        policy = SimpleDirectoryReader(input_files=[POLICY_FILE]).load_data()
        
        # Create indices
        ticket_index = VectorStoreIndex.from_documents(tickets, show_progress=True)
        policy_index = VectorStoreIndex.from_documents(policy, show_progress=True)
        
        # Persist indices
        ticket_index.storage_context.persist(
            persist_dir=os.path.join(os.path.dirname(__file__), "ticket_index")
        )
        policy_index.storage_context.persist(
            persist_dir=os.path.join(os.path.dirname(__file__), "policy_index")
        )
    
    # Create query engines
    ticket_engine = ticket_index.as_query_engine(similarity_top_k=3, llm=llm)
    policy_engine = policy_index.as_query_engine(similarity_top_k=3, llm=llm)
    
    # Create tools
    query_engine_tools = [
        QueryEngineTool(
            query_engine=ticket_engine,
            metadata=ToolMetadata(
                name="get_user_ticket",
                description="Get the user ticket from the airline system.",
            ),
        ),
        QueryEngineTool(
            query_engine=policy_engine,
            metadata=ToolMetadata(
                name="get_airline_policy",
                description="Get the airline policy from the airline system.",
            ),
        ),
    ]
    
    # Create agent
    agent = ReActAgent.from_tools(
        query_engine_tools,
        llm=llm,
        verbose=True,
        max_iterations=10,
    )
    
    return agent

# Initialize the agent
agent = initialize_agent()

@app.post("/api/generate-response", response_model=EmailResponse)
async def generate_response(request: EmailRequest):
    print("generating response")
    try:
        # Construct the prompt for the agent
        prompt = f"""Could you draft an email reply to an airline customer based on the following ticket information and our airline policy?
        
        Customer Email: {request.customer_email}
        Subject: {request.email_subject}
        Message: {request.email_body}
        
        Please provide a professional and helpful response that addresses the customer's concerns while following our airline policies.
        """
        
        # Get response from agent
        response = agent.chat(prompt)
        
        # Parse the response to extract subject and body
        # This is a simple implementation - you might want to make it more robust
        response_text = str(response)
        lines = response_text.split('\n')
        
        # Find subject and body
        subject = request.email_subject  # Default to original subject
        body = response_text
        
        # Try to extract subject if it's in the response
        for line in lines:
            if line.lower().startswith('subject:'):
                subject = line[8:].strip()
                break
        
        return EmailResponse(
            email_subject=subject,
            email_body=body,
            receipient_email_address=request.customer_email
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-email")
async def send_email(request: EmailRequest):
    # This is a placeholder for the actual email sending logic
    return {"message": "Email would be sent here", "status": "success"}

@app.post("/api/save-data")
async def save_data(request: SaveDataRequest):
    try:
        # Create data directory if it doesn't exist
        data_dir = "data"
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)

        # Generate filename with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data_{timestamp}.json"

        # Full path to save the file
        file_path = os.path.join(data_dir, filename)

        # Parse the string data to ensure it's valid JSON
        try:
            json_data = json.loads(request.data)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON data")

        # Save the data to file
        with open(file_path, 'w') as f:
            json.dump(json_data, f, indent=2)

        return {
            "status": "success",
            "message": f"Data saved successfully to {file_path}",
            "file_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/list-files")
async def list_files():
    try:
        data_dir = "data"
        if not os.path.exists(data_dir):
            return {"files": []}

        files = []
        for file_path in glob.glob(os.path.join(data_dir, "*.json")):
            stat = os.stat(file_path)
            files.append(FileInfo(
                filename=os.path.basename(file_path),
                path=file_path,
                last_modified=datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
            ))
        
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint
@app.websocket("/ws/files")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Monitor the data directory for new files
            data_dir = "data"
            existing_files = set(os.listdir(data_dir))
            await asyncio.sleep(1)  # Check every second
            current_files = set(os.listdir(data_dir))
            new_files = current_files - existing_files
            if new_files:
                for new_file in new_files:
                    await websocket.send_text(f"New file detected: {new_file}")
                existing_files = current_files
    except WebSocketDisconnect:
        print("WebSocket disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
