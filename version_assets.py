"""Keep browser cache keys in step with the static CSS and JavaScript sources."""

from hashlib import sha256
from pathlib import Path
import re

root = Path(__file__).resolve().parent
page = (root / "index.html").read_text()
for asset in ("styles.css", "site.js"):
    version = sha256((root / asset).read_bytes()).hexdigest()[:12]
    page, count = re.subn(
        rf'(["\']){re.escape(asset)}(?:\?v=[a-f0-9]+)?(["\'])',
        rf'\g<1>{asset}?v={version}\g<2>',
        page,
    )
    if count != 1:
        raise ValueError(f"Expected one reference to {asset}; found {count}")
for filename in ("index.html", "presentation-style.html"):
    (root / filename).write_text(page)
