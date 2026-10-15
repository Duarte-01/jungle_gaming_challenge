"""Expose bounded CI diagnostics without depending on authenticated log downloads."""
import os
import sys
from pathlib import Path

log = Path(sys.argv[1])
if not log.exists():
    raise SystemExit(0)
lines = log.read_text(errors="replace").splitlines()
excerpt = lines if len(lines) <= 200 else lines[:100] + ["… output truncated …"] + lines[-100:]
# Keep log content inside the code block, including possible literal backticks.
body = "\n".join(excerpt).replace("```", "''' ")
with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as summary:
    summary.write("## Failed validation diagnostics\n\n```text\n" + body + "\n```\n")
