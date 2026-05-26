import os
import re

DOCS_DIR = r"e:\pitMind\docs"

def apply_modern_styling(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the title (first H1)
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1) if title_match else os.path.basename(filepath).replace('.md', '').replace('_', ' ').title()
    
    # Remove the original H1 so we can replace it with a modern header
    content = re.sub(r'^#\s+(.+)$\n+', '', content, count=1, flags=re.MULTILINE)

    header = f"""<div align="center">

# 📖 {title}
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **{title}** module within the PitMind AI ecosystem.

---

"""

    # Add back to top links before H2s
    content = re.sub(r'\n(##\s+.+)', r'\n<br/>\n\n\1', content)

    # Wrap code blocks in details if they are very long (basic heuristic)
    # Actually, people like seeing code blocks directly. We will leave code blocks alone.
    
    # We will replace standard bullet points with slightly nicer formatting or just let markdown do its job.
    
    footer = """

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
"""

    modern_content = header + content.strip() + footer

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(modern_content)
    print(f"Modernized: {filepath}")

for filename in os.listdir(DOCS_DIR):
    if filename.endswith(".md"):
        apply_modern_styling(os.path.join(DOCS_DIR, filename))
