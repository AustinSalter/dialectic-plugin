#!/usr/bin/env python3
"""Export a Claude Code session JSONL to readable markdown.

Usage: export-session.py <session.jsonl> [output.md]

Keeps: user text turns, assistant text (verbatim), one-line tool-use
summaries. Skips: attachments, titles, tool_results, harness bookkeeping.
"""
import json
import sys
from pathlib import Path


def text_of(content):
    if isinstance(content, str):
        return content, []
    texts, tools = [], []
    if isinstance(content, list):
        for block in content:
            if not isinstance(block, dict):
                continue
            if block.get("type") == "text":
                texts.append(block.get("text", ""))
            elif block.get("type") == "tool_use":
                tools.append(block.get("name", "?"))
            elif block.get("type") == "tool_result":
                return None, []  # tool-result carrier turn, not a human turn
    return "\n".join(t for t in texts if t.strip()), tools


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: export-session.py <session.jsonl> [output.md]")
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(src.stem + ".md")

    lines, models = [], set()
    with src.open() as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                entry = json.loads(raw)
            except json.JSONDecodeError:
                continue
            kind = entry.get("type")
            if kind not in ("user", "assistant"):
                continue
            msg = entry.get("message") or {}
            if msg.get("model"):
                models.add(msg["model"])
            text, tools = text_of(msg.get("content"))
            if text is None:
                continue
            ts = (entry.get("timestamp") or "")[:19]
            if kind == "user" and text.strip():
                lines.append(f"## User — {ts}\n\n{text.strip()}\n")
            elif kind == "assistant" and (text.strip() or tools):
                body = text.strip()
                if tools:
                    body += ("\n\n" if body else "") + "> tools: " + ", ".join(f"`{t}`" for t in tools)
                lines.append(f"## Assistant — {ts}\n\n{body}\n")

    header = f"# Session export: {src.name}\n\nModels: {', '.join(sorted(models)) or 'unknown'}\n"
    out.write_text(header + "\n" + "\n".join(lines))
    print(out)


if __name__ == "__main__":
    main()
