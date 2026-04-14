from __future__ import annotations

import argparse
import json
import re
import urllib.error
import urllib.request
from html import unescape
from pathlib import Path


GREENHOUSE_SOURCES: list[tuple[str, str]] = [
    ("Stripe", "stripe"),
    ("Figma", "figma"),
    ("Coinbase", "coinbase"),
    ("Datadog", "datadog"),
    ("Lyft", "lyft"),
    ("Reddit", "reddit"),
    ("Dropbox", "dropbox"),
    ("Asana", "asana"),
    ("Brex", "brex"),
    ("Samsara", "samsara"),
    ("Scale AI", "scaleai"),
    ("Affirm", "affirm"),
    ("Airtable", "airtable"),
    ("MongoDB", "mongodb"),
    ("Instacart", "instacart"),
    ("Duolingo", "duolingo"),
    ("Robinhood", "robinhood"),
    ("Nuro", "nuro"),
    ("Verkada", "verkada"),
    ("Anduril", "andurilindustries"),
    ("Applied Intuition", "appliedintuition"),
    ("Cockroach Labs", "cockroachlabs"),
    ("Sigma Computing", "sigmacomputing"),
]

LEVER_SOURCES: list[tuple[str, str]] = [
    ("Netflix", "netflix"),
    ("Canva", "canva"),
    ("Notion", "notion"),
    ("Rippling", "rippling"),
    ("Postman", "postman"),
    ("Roblox", "roblox"),
    ("Plaid", "plaid"),
]

INTERNSHIP_PATTERN = re.compile(r"\b(intern|internship|co-?op|student|new grad|early career)\b", re.IGNORECASE)
INTERNSHIP_TITLE_PATTERN = re.compile(r"\b(intern|internship|co-?op|student|new grad|early career|university)\b", re.IGNORECASE)
WHITESPACE_PATTERN = re.compile(r"\s+")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")
ROLE_PATTERN = re.compile(
    r"\b(software|engineer|engineering|developer|computer science|data science|machine learning|analytics|backend|frontend|full stack|devops|security|cloud|sre|product design|designer|ux|ui|web|mobile|firmware|embedded|ios|android|computer vision|perception|systems test|research)\b",
    re.IGNORECASE,
)
DISALLOWED_TITLE_PATTERN = re.compile(
    r"\b(manager|recruiter|recruiting|talent|account executive|account development|sales development|business development|sales|marketing|operations|coordinator|customer support|finance|legal|hr|people operations|industrial engineer|mechanical engineering|manufacturing)\b",
    re.IGNORECASE,
)

US_CA_HINTS = [
    "united states",
    "usa",
    "u.s.",
    "us",
    "canada",
    "ca",
    "new york",
    "san francisco",
    "seattle",
    "boston",
    "austin",
    "toronto",
    "vancouver",
    "montreal",
    "remote - us",
    "remote us",
    "remote - canada",
    "remote canada",
]

TITLE_TAG_PATTERNS: list[tuple[str, str]] = [
    ("backend", r"\bbackend\b|\bapi engineer\b|\bapi developer\b"),
    ("frontend", r"\bfrontend\b|\bfront end\b|\bweb engineer\b|\bweb developer\b"),
    ("full-stack", r"\bfull stack\b|\bfull-stack\b"),
    ("data-science", r"\bdata science\b|\bdata scientist\b|\bdata analyst\b"),
    ("analytics", r"\banalyst\b|\banalytics\b"),
    ("machine-learning", r"\bmachine learning\b|\bml engineer\b|\bml internship\b"),
    ("ai", r"\bai\b|\bartificial intelligence\b"),
    ("robotics", r"\brobotics\b|\bself-driving\b|\bautonomous\b"),
    ("research", r"\bresearch\b"),
    ("security", r"\bsecurity\b|\bcybersecurity\b"),
    ("mobile", r"\bios\b|\bandroid\b|\bmobile\b"),
    ("firmware", r"\bfirmware\b|\bembedded\b"),
    ("computer-vision", r"\bcomputer vision\b|\bperception\b"),
    ("ios", r"\bios\b"),
    ("design", r"\bproduct design\b|\bdesigner\b|\bdesign intern\b"),
    ("ux", r"\bux\b|\buser experience\b|\bui\b"),
]

BODY_TECH_PATTERNS: list[tuple[str, str]] = [
    ("python", r"\bpython\b"),
    ("java", r"\bjava\b"),
    ("javascript", r"\bjavascript\b"),
    ("typescript", r"\btypescript\b|\bts\b"),
    ("react", r"\breact\b|\bnext\.js\b|\bnextjs\b"),
    ("node", r"\bnode\b|\bnode\.js\b"),
    ("sql", r"\bsql\b|\bpostgres\b|\bpostgresql\b|\bmysql\b"),
    ("pandas", r"\bpandas\b"),
    ("numpy", r"\bnumpy\b"),
    ("analytics", r"\banalytics\b|\bdashboard\b|\bbi\b"),
    ("machine-learning", r"\bmachine learning\b|\bml engineer\b|\bml internship\b"),
    ("ai", r"\bartificial intelligence\b|\bgenerative ai\b|\bllm\b|\bfoundation model\b"),
    ("data-science", r"\bdata science\b|\bdata scientist\b"),
    ("robotics", r"\brobotics\b|\bself-driving\b|\bautonomous\b"),
    ("simulation", r"\bsimulation\b"),
    ("docker", r"\bdocker\b|\bkubernetes\b|\bk8s\b"),
    ("cloud", r"\baws\b|\bazure\b|\bgcp\b|\bcloud\b"),
    ("figma", r"\bfigma\b"),
]


def _fetch_json(url: str) -> dict | list:
    req = urllib.request.Request(url, headers={"User-Agent": "InternAtlasDataLoader/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _strip_html(text: str) -> str:
    text = unescape(text or "")
    text = HTML_TAG_PATTERN.sub(" ", text)
    text = WHITESPACE_PATTERN.sub(" ", text).strip()
    return text


def _to_tags(*values: str) -> list[str]:
    out: list[str] = []
    for value in values:
        if not value:
            continue
        for part in re.split(r"[,/|]", value):
            cleaned = part.strip().lower()
            if cleaned and cleaned not in out:
                out.append(cleaned)
    return out[:8]


def _extract_skill_tags(title: str, description: str) -> list[str]:
    title_text = title.lower()
    summary = description[:250].lower()
    tags: list[str] = []

    for tag, pattern in TITLE_TAG_PATTERNS:
        if re.search(pattern, title_text, re.IGNORECASE) and tag not in tags:
            tags.append(tag)

    role_family = "general"
    if "design" in tags or "ux" in tags:
        role_family = "design"
    elif "data-science" in tags or "analytics" in tags or "machine-learning" in tags:
        role_family = "data"
    elif "frontend" in tags:
        role_family = "frontend"
    elif "backend" in tags or "full-stack" in tags:
        role_family = "engineering"

    for tag, pattern in BODY_TECH_PATTERNS:
        if re.search(pattern, summary, re.IGNORECASE) and tag not in tags:
            if role_family == "design" and tag in {"data-science", "analytics", "machine-learning", "backend", "frontend"}:
                continue
            if role_family == "engineering" and tag in {"design", "ux"}:
                continue
            if role_family == "data" and tag in {"design", "ux", "frontend"}:
                continue
            tags.append(tag)

    if not tags:
        title_lower = title.lower()
        fallback_map = [
            ("software", ["backend"]),
            ("engineer", ["backend"]),
            ("developer", ["backend"]),
            ("data", ["data-science", "analytics"]),
            ("frontend", ["frontend"]),
            ("design", ["design", "ux"]),
        ]
        for needle, fallback_tags in fallback_map:
            if needle in title_lower:
                for tag in fallback_tags:
                    if tag not in tags:
                        tags.append(tag)

    return tags[:6]


def _looks_like_internship(title: str, description: str, tags: list[str]) -> bool:
    title_text = title or ""
    if INTERNSHIP_TITLE_PATTERN.search(title_text):
        return True

    desc_text = (description or "")[:400]
    haystack = " ".join([title_text, desc_text, " ".join(tags)])
    return bool(INTERNSHIP_PATTERN.search(haystack))


def _looks_like_cs_adjacent_role(title: str, description: str) -> bool:
    title_text = title or ""
    if DISALLOWED_TITLE_PATTERN.search(title_text):
        return False

    return bool(ROLE_PATTERN.search(title_text))


def _is_us_or_canada(location: str, description: str, tags: list[str]) -> bool:
    haystack = " ".join([location or "", description or "", " ".join(tags)]).lower()
    return any(hint in haystack for hint in US_CA_HINTS)


def _greenhouse_rows(org: str, board_token: str) -> list[dict]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"
    payload = _fetch_json(url)
    rows: list[dict] = []
    for job in payload.get("jobs", []):
        title = (job.get("title") or "").strip()
        description = _strip_html(job.get("content") or "")
        location = (job.get("location") or {}).get("name", "").strip() or "Remote"
        tags = _extract_skill_tags(title, description)
        if not _looks_like_internship(title, description, tags):
            continue
        if not _looks_like_cs_adjacent_role(title, description):
            continue

        rows.append(
            {
                "title": title,
                "org": org,
                "description": description[:2000],
                "location": location,
                "tags": tags,
                "deadline": None,
                "url": job.get("absolute_url"),
            }
        )
    return rows


def _lever_rows(org: str, site: str) -> list[dict]:
    url = f"https://api.lever.co/v0/postings/{site}?mode=json"
    payload = _fetch_json(url)
    rows: list[dict] = []
    for job in payload:
        title = (job.get("text") or "").strip()
        description = (job.get("descriptionPlain") or "").strip()
        categories = job.get("categories") or {}
        location = (categories.get("location") or "").strip() or "Remote"
        tags = _extract_skill_tags(title, description)
        if not _looks_like_internship(title, description, tags):
            continue
        if not _looks_like_cs_adjacent_role(title, description):
            continue

        rows.append(
            {
                "title": title,
                "org": org,
                "description": description[:2000],
                "location": location,
                "tags": tags,
                "deadline": None,
                "url": job.get("hostedUrl"),
            }
        )
    return rows


def collect_rows() -> list[dict]:
    all_rows: list[dict] = []

    for org, board_token in GREENHOUSE_SOURCES:
        try:
            all_rows.extend(_greenhouse_rows(org, board_token))
        except urllib.error.HTTPError as exc:
            print(f"[warn] Greenhouse {org} ({board_token}) skipped: HTTP {exc.code}")
        except Exception as exc:  # pragma: no cover - defensive logging path
            print(f"[warn] Greenhouse {org} ({board_token}) skipped: {exc}")

    for org, site in LEVER_SOURCES:
        try:
            all_rows.extend(_lever_rows(org, site))
        except urllib.error.HTTPError as exc:
            print(f"[warn] Lever {org} ({site}) skipped: HTTP {exc.code}")
        except Exception as exc:  # pragma: no cover - defensive logging path
            print(f"[warn] Lever {org} ({site}) skipped: {exc}")

    deduped: dict[str, dict] = {}
    for row in all_rows:
        url = (row.get("url") or "").strip()
        if not url:
            continue
        deduped[url] = row

    rows = sorted(deduped.values(), key=lambda r: (r.get("org", ""), r.get("title", "")))
    us_ca = [
        r
        for r in rows
        if _is_us_or_canada(r.get("location", ""), r.get("description", ""), r.get("tags", []))
    ]
    other = [
        r
        for r in rows
        if not _is_us_or_canada(r.get("location", ""), r.get("description", ""), r.get("tags", []))
    ]
    # Prefer US/Canada records first, then use other regions only as fallback.
    return us_ca + other


def default_output_path() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "data" / "seed_opportunities.json"
        if candidate.exists():
            return candidate
    return Path.cwd() / "data" / "seed_opportunities.json"


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch real internship postings into seed JSON.")
    parser.add_argument("--min", type=int, default=50, help="Minimum number of postings desired.")
    parser.add_argument("--max", type=int, default=100, help="Maximum postings to write.")
    parser.add_argument("--output", type=Path, default=default_output_path(), help="Output JSON path.")
    args = parser.parse_args()

    if args.min < 1 or args.max < 1 or args.min > args.max:
        raise SystemExit("Invalid bounds: ensure 1 <= min <= max")

    rows = collect_rows()
    trimmed = rows[: args.max]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(trimmed, indent=2), encoding="utf-8")

    print(f"Fetched {len(rows)} internship postings.")
    print(f"Wrote {len(trimmed)} postings to {args.output}")
    if len(trimmed) < args.min:
        print(f"[warn] Requested at least {args.min}, but only found {len(trimmed)}.")


if __name__ == "__main__":
    main()
