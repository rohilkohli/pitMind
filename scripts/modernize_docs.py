import os
import re

DOCS_DIR = r"e:\pitMind\docs"

def make_interactive(content):
    # Split the content by H2 headers "## "
    parts = re.split(r'^(##\s+.+)$', content, flags=re.MULTILINE)
    
    if len(parts) <= 1:
        return content # No H2 headers found
        
    new_content = parts[0] # Intro text before first H2
    
    for i in range(1, len(parts), 2):
        header_text = parts[i].replace('## ', '').strip()
        section_content = parts[i+1].strip()
        
        new_content += f"""

<details>
<summary><b>{header_text}</b></summary>
<br/>

{section_content}

</details>

"""
    return new_content

def apply_modern_styling(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the title (first H1)
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1) if title_match else os.path.basename(filepath).replace('.md', '').replace('_', ' ').title()
    
    # Remove the original H1
    content = re.sub(r'^#\s+(.+)$\n+', '', content, count=1, flags=re.MULTILINE)

    # Make interactive
    interactive_content = make_interactive(content)

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
    
    footer = """

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
"""

    modern_content = header + interactive_content.strip() + footer

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(modern_content)
    print(f"Modernized & Interactive: {filepath}")

for filename in os.listdir(DOCS_DIR):
    if filename.endswith(".md"):
        apply_modern_styling(os.path.join(DOCS_DIR, filename))
