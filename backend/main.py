import json
import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(
    title="LexiLoop AI Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-5.6"
)

api_key = os.getenv(
    "OPENAI_API_KEY"
)

client = (
    OpenAI(api_key=api_key)
    if api_key
    else None
)


class LessonRequest(BaseModel):
    variant: str = "global"
    focus: str = "mixed"
    difficulty: str = "intermediate"
    weakWords: List[str] = Field(
        default_factory=list
    )


class PhraseRequest(BaseModel):
    phrase: str
    variant: str = "global"
    context: str = (
        "professional workplace or client meeting"
    )


def require_client():
    if client is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "OPENAI_API_KEY is not configured."
            )
        )

    return client


def extract_json(text: str):
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = (
            cleaned
            .replace("```json", "", 1)
            .replace("```", "", 1)
            .strip()
        )

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start == -1 or end == -1:
            raise

        return json.loads(
            cleaned[start:end + 1]
        )


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_configured": client is not None,
        "model": OPENAI_MODEL
    }


@app.post("/api/daily-lesson")
def daily_lesson(request: LessonRequest):
    ai = require_client()

    weak_words = ", ".join(
        request.weakWords[:8]
    )

    prompt = f"""
Create exactly 3 useful English vocabulary items for a
professional working adult preparing for US/UK client meetings.

English variant:
{request.variant}

Learning focus:
{request.focus}

Difficulty:
{request.difficulty}

Words the learner has struggled with:
{weak_words or "None yet"}

Prefer practical words or workplace phrases that the learner
could realistically hear in a meeting, email, presentation,
client call, or office conversation.

Avoid obscure literary vocabulary.

Return ONLY valid JSON in this exact structure:

{{
  "words": [
    {{
      "word": "string",
      "pronunciation": "string",
      "partOfSpeech": "string",
      "meaning": "simple explanation",
      "synonym": "string",
      "antonym": "string",
      "workplaceExample": "realistic professional sentence"
    }}
  ]
}}

Make the three items meaningfully different from one another.
"""

    try:
        response = ai.responses.create(
            model=OPENAI_MODEL,
            input=prompt
        )

        result = extract_json(
            response.output_text
        )

        if (
            not isinstance(result, dict)
            or "words" not in result
            or not isinstance(
                result["words"],
                list
            )
        ):
            raise ValueError(
                "Unexpected AI response."
            )

        return {
            "words": result["words"][:3]
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI generation failed: {exc}"
        )


@app.post("/api/explain")
def explain_phrase(request: PhraseRequest):
    ai = require_client()

    phrase = request.phrase.strip()

    if not phrase:
        raise HTTPException(
            status_code=400,
            detail="Phrase cannot be empty."
        )

    prompt = f"""
Explain this English word or phrase for someone who needs
to understand professional conversations quickly.

Phrase:
{phrase}

English variant:
{request.variant}

Context:
{request.context}

Return ONLY valid JSON:

{{
  "phrase": "the original phrase",
  "meaning": "simple explanation",
  "example": "natural professional example sentence"
}}

Avoid unnecessary dictionary-style complexity.
"""

    try:
        response = ai.responses.create(
            model=OPENAI_MODEL,
            input=prompt
        )

        result = extract_json(
            response.output_text
        )

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI explanation failed: {exc}"
        )