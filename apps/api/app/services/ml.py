import os
import json
import urllib.request
from bs4 import BeautifulSoup
from google import genai
import asyncio
from app.core.settings import settings

async def scrape_opportunity(url: str) -> dict:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        # Use asyncio.to_thread for blocking network call
        def fetch():
            with urllib.request.urlopen(req, timeout=10) as response:
                return response.read()
        html = await asyncio.to_thread(fetch)
            
        soup = BeautifulSoup(html, 'html.parser')
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator=' ', strip=True)
        text = text[:15000]
        
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""
        Extract job opportunity details from the text below.
        Return ONLY valid JSON matching this exact schema, with no other text or explanation:
        {{
            "title": "Job Title",
            "org": "Company Name",
            "description": "Short description of the role (3-4 sentences)",
            "location": "City, State or Remote",
            "tags": ["tag1", "tag2", "tag3"],
            "deadline_date": "YYYY-MM-DD" or null
        }}
        
        Text:
        {text}
        """
        
        def call_gemini():
            return client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
        response = await asyncio.to_thread(call_gemini)
        
        data = json.loads(response.text)
        data["url"] = url
        return data

    except Exception as e:
        raise Exception(f"Failed to scrape: {str(e)}")

async def match_resume(profile_text: str, opportunity_text: str) -> dict:
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""
        Analyze the match between this candidate profile and the job opportunity.
        Return ONLY valid JSON matching this exact schema:
        {{
            "match_score": <Integer from 1-100 indicating fit>,
            "explanation": {{
                "overlap_skills": ["List", "of", "matching", "skills"],
                "snippets": ["HTML snippets explaining the match. Use <mark> to highlight important keywords."]
            }}
        }}
        
        Candidate Profile:
        {profile_text}
        
        Opportunity:
        {opportunity_text}
        """
        
        def call_gemini():
            return client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
        response = await asyncio.to_thread(call_gemini)
        return json.loads(response.text)
    except Exception as e:
        raise Exception(f"Failed to match: {str(e)}")

async def generate_cover_letter(profile_text: str, opportunity_text: str) -> dict:
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""
        Draft a 3-paragraph cover letter for the following candidate applying to the following job opportunity.
        Return ONLY valid JSON matching this schema:
        {{
            "cover_letter": "The full text of the cover letter"
        }}
        
        Candidate Profile:
        {profile_text}
        
        Opportunity:
        {opportunity_text}
        """
        def call_gemini():
            return client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
        response = await asyncio.to_thread(call_gemini)
        return json.loads(response.text)
    except Exception as e:
        raise Exception(f"Failed to generate cover letter: {str(e)}")

async def generate_interview_prep(profile_text: str, opportunity_text: str) -> dict:
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""
        Generate a set of 3 custom-tailored interview questions and suggested speaking points for this candidate applying to this job.
        Return ONLY valid JSON matching this schema:
        {{
            "questions": [
                {{
                    "question": "The interview question",
                    "talking_points": ["Point 1", "Point 2"]
                }}
            ]
        }}
        
        Candidate Profile:
        {profile_text}
        
        Opportunity:
        {opportunity_text}
        """
        def call_gemini():
            return client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
        response = await asyncio.to_thread(call_gemini)
        return json.loads(response.text)
    except Exception as e:
        raise Exception(f"Failed to generate interview prep: {str(e)}")

async def parse_resume(resume_text: str) -> dict:
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""
        Extract structured profile information from this resume text.
        Return ONLY valid JSON matching this exact schema:
        {{
            "skills": ["list", "of", "technical", "skills"],
            "interests": "A 1-2 sentence summary of the candidate's interests and career goals",
            "locations": ["Preferred location 1", "Preferred location 2"],
            "grad_year": <4-digit graduation year as integer, or null if not found>
        }}

        Rules:
        - skills: extract specific technical skills, tools, languages, and frameworks (max 20)
        - interests: infer from their experience and projects, keep it concise
        - locations: infer from their current location or stated preferences, or return []
        - grad_year: look for graduation date or expected graduation

        Resume:
        {resume_text[:8000]}
        """
        def call_gemini():
            return client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
        response = await asyncio.to_thread(call_gemini)
        return json.loads(response.text)
    except Exception as e:
        raise Exception(f"Failed to parse resume: {str(e)}")


async def extract_tags(description: str) -> list[str]:
    try:
        if not description or len(description) < 10:
            return []
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""
        Extract exactly 3 to 5 relevant technical or role-based tags from the following job description.
        Return ONLY valid JSON matching this schema:
        {{
            "tags": ["tag1", "tag2", "tag3"]
        }}
        
        Job Description:
        {description}
        """
        def call_gemini():
            return client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
        response = await asyncio.to_thread(call_gemini)
        return json.loads(response.text).get("tags", [])
    except Exception:
        return []
