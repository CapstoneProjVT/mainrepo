# InternAtlas

InternAtlas is a capstone app with a Next.js frontend, FastAPI backend, and Postgres + pgvector.

## Docker quick start

```bash
cp .env.example .env
make dev
```

In another terminal:

```bash
make seed
```

## Preview mode (no Docker)

Preview mode is designed for previews where Docker is unavailable.

```bash
cp .env.example .env
make preview
```

This starts:
- API on `http://0.0.0.0:8000` (sqlite by default)
- Web on `http://0.0.0.0:3000`

## Tests

```bash
make test
```

## URLs
- Web: http://localhost:3000
- API: http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs

## Notes
- Vector backend defaults to `auto` (pgvector if available, JSON fallback in app code).
- First registered user is admin.

## Manual Acceptance Checklist (v2)
- [ ] `make dev` works cleanly; web + api + db all stay running.
- [ ] Signup -> edit profile -> opportunities list shows results -> open detail -> see explanation -> save -> unsave -> rate.
- [ ] Application tracker -> create -> insights shows updated stats.
- [ ] Insights -> export CSV downloads correctly.
- [ ] No 404s for buttons/links. No placeholder features.
- [ ] UI looks modern and consistent in light + dark.

## Machine Learning Features
This repository utilizes the Google Gemini ML API to provide 5 major AI-driven capabilities:
1. **Web Scraping & Information Extraction**: Scrapes job postings dynamically and parses them into structured JSON (Title, Org, Location, Description, Tags).
2. **AI Resume Match Scoring**: Compares a user's profile against an opportunity, giving a 1-100 fit score and explanation snippets with highlighted keywords.
3. **Automated Cover Letter Generation**: Instantly drafts a personalized, 3-paragraph cover letter tailored to both the candidate and the specific role.
4. **Interview Prep Generator**: Provides 3 custom-tailored interview questions and suggested speaking points based on the candidate's background and job requirements.
5. **AI Opportunity Categorization**: Automatically extracts 3-5 relevant technical tags from any newly saved or scraped opportunity.

Ensure `GEMINI_API_KEY` is set in your `.env` for these features to function.
test commit
