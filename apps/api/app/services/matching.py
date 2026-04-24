import hashlib
import math
import re

DIM = 128
WORD_RE = re.compile(r"[a-zA-Z0-9+#]+")


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in WORD_RE.findall(text or "")]


def _token_bucket(token: str) -> int:
    digest = hashlib.sha256(token.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") % DIM


def embed_text(text: str) -> list[float]:
    vec = [0.0] * DIM
    for tok in tokenize(text):
        vec[_token_bucket(tok)] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    return sum(x * y for x, y in zip(a, b))


def normalize_score(sim: float) -> float:
    return round(max(0.0, min(1.0, (sim + 1) / 2)) * 100, 2)


def extract_overlap(user_skills: list[str], tags: list[str], description: str) -> list[str]:
    cand = {s.lower() for s in user_skills}
    text_tokens = set(tokenize(" ".join(tags) + " " + description))
    return sorted([s for s in cand if s in text_tokens])[:5]


def snippets(description: str, terms: list[str]) -> list[str]:
    if not terms:
        return []
    words = description.split()
    result = []
    for term in terms[:3]:
        for i, w in enumerate(words):
            if term.lower() in w.lower():
                lo, hi = max(0, i - 6), min(len(words), i + 7)
                snip = " ".join(words[lo:hi])
                snip = re.sub(
                    rf"(?i)({re.escape(term)})",
                    r"<mark>\1</mark>",
                    snip,
                )
                result.append(snip)
                break
    return result[:3]


def user_profile_text(profile, resume_text: str = "") -> str:
    base = " ".join(profile.skills_json or []) + " " + (profile.interests_text or "") + " " + " ".join(profile.locations_json or [])
    if resume_text:
        return resume_text + " " + base
    return base


def opportunity_text(opp) -> str:
    return f"{opp.title} {opp.org} {opp.description} {' '.join(opp.tags_json or [])} {opp.location}"
