#!pip install uv
#!pip install python-dotenv
#!uv pip install --system -qU llama-index==0.11.6 llama-index-llms-openai llama-index-readers-file llama-index-embeddings-openai llama-index-llms-openai-like "openinference-instrumentation-llama-index>=2"

import os
#from os import environ
from dotenv import load_dotenv
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
    PromptTemplate,
)

from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.core.agent import ReActAgent
from llama_index.llms.openai import OpenAI
from llama_index.core.tools import FunctionTool
from llama_index.core.llms import ChatMessage




load_dotenv()

#OPENAI_API_KEY = environ["OPENAI_API_KEY"]
os.environ["OPENAI_API_KEY"] = "KEY"

llm = OpenAI(model="gpt-4o-mini")

DEFAULT_DIR = "/Users/arvind/Downloads/"

def get_ticket(ticket_id="ticket_c09dafbf"):
    filename = DEFAULT_DIR + ticket_id + ".json"
    ticket = SimpleDirectoryReader(
        input_files=[filename],
        ).load_data()
    return ticket      
      
def get_airline_policy():
    filename = DEFAULT_DIR + "airline_policy.rtf"
    policy = SimpleDirectoryReader(
            input_files=[filename],
            ).load_data()
    return policy


def search_web_tool(query=""):
    llm = OpenAI(
        model="gpt-4o-mini",
        built_in_tools=[{"type": "web_search_preview"}]
    )
    resp = llm.chat([ChatMessage(role="user", content=query)])
    return resp


try:
    ticket_storage_context = StorageContext.from_defaults(
        persist_dir= DEFAULT_DIR + "ticket_index"
    )
    policy_storage_context = StorageContext.from_defaults(
        persist_dir= DEFAULT_DIR + "policy_index"
    )
    
    ticket_index = load_index_from_storage(ticket_storage_context)
    policy_index = load_index_from_storage(policy_storage_context)

    index_loaded = True
except:
    index_loaded = False

# load data
if not index_loaded:
    ticket = get_ticket()
    policy = get_airline_policy()
    ticket_index = VectorStoreIndex.from_documents(ticket, show_progress=True)
    policy_index = VectorStoreIndex.from_documents(ticket, show_progress=True)
    ticket_index.storage_context.persist(persist_dir= DEFAULT_DIR + "ticket_index")
    policy_index.storage_context.persist(persist_dir= DEFAULT_DIR + "policy_index")

ticket_engine = ticket_index.as_query_engine(similarity_top_k=3, llm=llm)
policy_engine = policy_index.as_query_engine(similarity_top_k=3, llm=llm)

query_engine_tools = [
    #search_web_tool,
    QueryEngineTool(
        query_engine=ticket_engine,
        metadata=ToolMetadata(
            name="get_user_ticket",
            description=(
                "get the user ticket from the airline system. "
            ),
        ),
    ),
    QueryEngineTool(
        query_engine=policy_engine,
        metadata=ToolMetadata(
            name="get_airline_policy",
            description=(
                "get the airline policy from the airline system. "
            ),
        ),
    ),
]

agent = ReActAgent.from_tools(
    query_engine_tools,
    llm=llm,
    verbose=True,
    max_iterations=10,
)

response = agent.chat("Could you draft an email reply to thean airline customer based on the ticket the customer filed and our airline policy? You can also search the web for additional context. Please finish your chain-of-thought in at most 10 steps.")
print(str(response))