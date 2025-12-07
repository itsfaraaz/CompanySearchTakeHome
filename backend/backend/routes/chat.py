import json
import os
from typing import AsyncGenerator, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import or_

from backend.db.database import Company, SessionLocal


router = APIRouter()

# Initialize OpenAI client for OpenRouter
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

SYSTEM_PROMPT = """You are a startup search assistant with access to a database of B2B SaaS startups from 2021-2022.

When users ask about startups:
1. Use the search_startups function to query the database with relevant keywords
2. Analyze the results against the user's specific needs
3. Return your findings as a markdown table with columns: Company Name, Description, Website, Location, Justification

For explicit searches like "fintech startups in New York", use keywords like ["fintech", "finance"] and city="New York".

For higher-order queries like "suggest additions to my portfolio", think about related industries and technologies.

Always explain why each startup matches the user's query in the Justification column.

IMPORTANT FORMATTING RULES:
- Use proper markdown with blank lines between paragraphs
- Do NOT write commentary between tool calls - just make the tool calls silently
- After all searches are complete, provide ONE final summary with the markdown table
- Keep your response concise and well-formatted"""

# Tool definition for OpenAI function calling
SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_startups",
        "description": "Search the startup database using keywords and optional city filter",
        "parameters": {
            "type": "object",
            "properties": {
                "keywords": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Search terms to match against company names, descriptions, and website text"
                },
                "city": {
                    "type": "string",
                    "description": "Optional city name to filter results"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results (default 10)",
                    "default": 10
                }
            },
            "required": ["keywords"]
        }
    }
}


def search_startups(keywords: list[str], city: str | None = None, limit: int = 10) -> list[dict]:
    """Execute the startup search against the database."""
    db = SessionLocal()
    try:
        query = db.query(Company)
        
        if keywords:
            keyword_conditions = []
            for kw in keywords:
                pattern = f"%{kw}%"
                keyword_conditions.append(
                    or_(
                        Company.company_name.ilike(pattern),
                        Company.description.ilike(pattern),
                        Company.website_text.ilike(pattern)
                    )
                )
            query = query.filter(or_(*keyword_conditions))
        
        if city:
            query = query.filter(Company.city.ilike(f"%{city}%"))
        
        results = query.limit(limit).all()
        
        return [
            {
                "company_name": r.company_name,
                "description": (r.description or "")[:300],  # Truncate for context
                "website_url": r.website_url or "",
                "city": r.city or "",
            }
            for r in results
        ]
    finally:
        db.close()


class MessagePart(BaseModel):
    type: str
    text: Optional[str] = None


class Message(BaseModel):
    id: Optional[str] = None
    role: str
    parts: list[MessagePart]


class ChatRequest(BaseModel):
    messages: list[Message]


def extract_text(message: Message) -> str:
    """Extract text content from message parts."""
    return " ".join(
        part.text for part in message.parts 
        if part.type == "text" and part.text
    )


async def run_agent(messages: list[dict]) -> AsyncGenerator[str, None]:
    """Run the agent with tool calling loop, streaming the response."""
    
    # Build messages for OpenAI
    openai_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages:
        openai_messages.append({"role": msg["role"], "content": msg["content"]})
    
    while True:
        # Call the model
        response = await client.chat.completions.create(
            model="anthropic/claude-sonnet-4.5",
            messages=openai_messages,
            tools=[SEARCH_TOOL],
            stream=True,
        )
        
        # Collect the streamed response
        collected_content = ""
        tool_calls = []
                
        async for chunk in response:
            delta = chunk.choices[0].delta if chunk.choices else None
            if not delta:
                continue
            
            # Handle text content
            if delta.content:
                collected_content += delta.content
                yield delta.content
            
            # Handle tool calls
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    if tc.index is not None:
                        # New or continuing tool call
                        while len(tool_calls) <= tc.index:
                            tool_calls.append({"id": "", "name": "", "arguments": ""})
                        
                        if tc.id:
                            tool_calls[tc.index]["id"] = tc.id
                        if tc.function:
                            if tc.function.name:
                                tool_calls[tc.index]["name"] = tc.function.name
                            if tc.function.arguments:
                                tool_calls[tc.index]["arguments"] += tc.function.arguments
            
            # Check if done
            if chunk.choices[0].finish_reason:
                break
        
        # If there are tool calls, execute them
        if tool_calls and tool_calls[0].get("name"):
            # Add assistant message with tool calls
            openai_messages.append({
                "role": "assistant",
                "content": collected_content or None,
                "tool_calls": [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {
                            "name": tc["name"],
                            "arguments": tc["arguments"]
                        }
                    }
                    for tc in tool_calls if tc.get("name")
                ]
            })
            
            # Execute each tool call
            for tc in tool_calls:
                if not tc.get("name"):
                    continue
                    
                # Parse arguments and execute
                args = json.loads(tc["arguments"])
                keywords = args.get("keywords", [])
                
                # Stream a status message with search emoji
                yield f"\n\n🔍 *Searching database for: {', '.join(keywords)}...*\n\n"
                
                # Execute the search
                results = search_startups(
                    keywords=keywords,
                    city=args.get("city"),
                    limit=args.get("limit", 10)
                )
                
                # Add tool result to messages
                openai_messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(results)
                })
            
            # Continue the loop to get the final response
            continue
        
        # No tool calls, we're done
        break


@router.post("/chat")
async def chat(request: ChatRequest):
    """Stream chat responses from the AI agent."""
    messages = [
        {"role": m.role, "content": extract_text(m)}
        for m in request.messages
    ]
    
    return StreamingResponse(
        run_agent(messages),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
