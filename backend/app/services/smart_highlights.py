import re
from typing import List, Dict, Any

class SmartHighlightsEngine:
    """
    Rule and regex-based entity and action item extractor.
    Identifies dates, times, questions, action items, important numbers, and requests
    directly from conversation text without LLM latency.
    """

    # Questions regex
    QUESTION_PATTERN = re.compile(
        r"(?:^|[.!?]\s*)([^.!?]*\b(?:can|could|would|will|is|are|do|does|did|how|what|when|where|why|who)\b[^.!?]*\?)",
        re.IGNORECASE
    )

    # Date patterns (tomorrow, next Monday, Nov 12, 12th of May, 2026-11-15, etc.)
    DATE_PATTERN = re.compile(
        r"\b(?:today|tomorrow|yesterday|tonight|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)|"
        r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?|"
        r"\d{1,2}(?:st|nd|rd|th)?\s+of\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|"
        r"\d{4}[-/]\d{1,2}[-/]\d{1,2})\b",
        re.IGNORECASE
    )

    # Time patterns (2:30 PM, 14:00, 5 o'clock, 10 am, noon, midnight)
    TIME_PATTERN = re.compile(
        r"\b(?:\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm|o'clock)|noon|midnight)\b",
        re.IGNORECASE
    )

    # Numbers (phone numbers, currency, percentages, verification codes, quantities)
    NUMBER_PATTERN = re.compile(
        r"(?:\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d+)?%|\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\bcode\s+(?:is\s+)?\d{4,8}\b|\b\d{4,10}\b)",
        re.IGNORECASE
    )

    # Action items & Requests (e.g. "I will send", "please email me", "don't forget to", "we need to")
    ACTION_PATTERN = re.compile(
        r"\b(?:i\s+will|i'll|please|we\s+need\s+to|don't\s+forget\s+to|make\s+sure\s+to|let's|remind\s+me\s+to|could\s+you|can\s+you)\s+([^.!?]+)",
        re.IGNORECASE
    )

    @classmethod
    def extract_from_text(cls, text: str) -> List[Dict[str, Any]]:
        highlights: List[Dict[str, Any]] = []
        seen = set()

        # 1. Questions
        for match in cls.QUESTION_PATTERN.finditer(text):
            q_text = match.group(1).strip()
            if q_text and q_text not in seen:
                seen.add(q_text)
                highlights.append({
                    "highlight_type": "question",
                    "text": q_text,
                    "context": "Question asked"
                })

        # 2. Dates
        for match in cls.DATE_PATTERN.finditer(text):
            d_text = match.group(0).strip()
            if d_text and d_text.lower() not in seen:
                seen.add(d_text.lower())
                highlights.append({
                    "highlight_type": "date_time",
                    "text": d_text,
                    "context": "Date mentioned"
                })

        # 3. Times
        for match in cls.TIME_PATTERN.finditer(text):
            t_text = match.group(0).strip()
            if t_text and t_text.lower() not in seen:
                seen.add(t_text.lower())
                highlights.append({
                    "highlight_type": "date_time",
                    "text": t_text,
                    "context": "Time mentioned"
                })

        # 4. Numbers / Codes / Quantities
        for match in cls.NUMBER_PATTERN.finditer(text):
            n_text = match.group(0).strip()
            # Filter out single small digits unless currency/percent
            if n_text and n_text not in seen and (len(n_text) > 2 or "%" in n_text or "$" in n_text):
                seen.add(n_text)
                highlights.append({
                    "highlight_type": "number",
                    "text": n_text,
                    "context": "Key number / quantity"
                })

        # 5. Action Items & Requests
        for match in cls.ACTION_PATTERN.finditer(text):
            action_snippet = match.group(0).strip()
            if action_snippet and action_snippet.lower() not in seen:
                seen.add(action_snippet.lower())
                highlights.append({
                    "highlight_type": "action_item",
                    "text": action_snippet,
                    "context": "Action item / Request"
                })

        return highlights
