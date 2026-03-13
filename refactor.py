import os
import shutil
from pathlib import Path

# Mapping of original files to their new categories and clean names
FILE_MAP = {
    "Architecture - Opus 4.6 .md": ("architecture", "system_architecture_opus_4_6.md"),
    "BYOkb Open Source API sharing system - Opus 4.6 non-Thinking.md": ("ace_system", "byokb_api_sharing_non_thinking.md"),
    "BYOkb Open Source API sharing system - Opus 4.6 Thinking.md": ("ace_system", "byokb_api_sharing_thinking.md"),
    "magB_Concept_Opus 4.6_Thinking.md": ("concepts", "universal_blueprint_machine_thinking.md"),
    "magB_Concept_Opus 4.6.md": ("concepts", "universal_blueprint_machine.md"),
    "magB_Database Architecture - Opus 4.6 non-Thinking .md": ("architecture", "database_architecture_non_thinking.md"),
    "magB_Database Architecture - Opus 4.6 Thinking .md": ("architecture", "database_architecture_thinking.md"),
    "magB_MISSING ELEMENTS v0_- Opus 4.6 non-Thinking .md": ("planning", "missing_elements_v0_non_thinking.md"),
    "magB_MISSING ELEMENTS v0_- Opus 4.6 THINKING.md": ("planning", "missing_elements_v0_thinking.md"),
    "magB_Observability- Opus 4.6 non-Thinking .md": ("observability", "observability_non_thinking.md"),
    "magB_Observability- Opus 4.6 Thinking .md": ("observability", "observability_thinking.md"),
    "page-2026-03-12-23-32-29.md": ("arena_eval", "arena_comparison_page.md"),
    "Proposal_without missing elements_schema_architecture_v0_.md": ("planning", "proposal_schema_architecture_v0.md")
}

def generate_intelligence_layer(category, original_filename, clean_filename):
    return f"""---
type: {category}
source_file: "{original_filename}"
description: "Original project documentation refactored with an intelligence layer for automated LLM accessibility."
llm_accessibility:
  - This document contains 100% of its original source material below the '--- ORIGINAL CONTENT ---' marker.
  - Recommended usage: Use this document to understand the {category} aspects of the magB/ACE/Universal Blueprint Machine system.
---

<llm_context>
# Document Intelligence Layer
**Context:** This document is part of the refactored `.seedocs` repository, detailing the architecture, concepts, and planning for the Universal Blueprint Machine (magB) and AI Contribution Engine (ACE).
**Category:** `{category}`
**Original File:** `{original_filename}`
**AI Assistant Directives:** 
1. When querying this document, treat the original content as the definitive ground truth.
2. Use the provided schemas, code blocks, and diagrams directly for implementation and analysis.
3. This intelligence layer ensures context window efficiency by explicitly stating the document's boundaries and purpose.
</llm_context>

--- ORIGINAL CONTENT ---

"""

def main():
    original_dir = Path(".seedocs/original")
    refactored_dir = Path(".seedocs/refactored")
    
    # Create refactored base directory
    refactored_dir.mkdir(parents=True, exist_ok=True)
    
    # Also create a global _llm_context index
    index_dir = refactored_dir / "_llm_context"
    index_dir.mkdir(parents=True, exist_ok=True)
    
    global_index = ["# Global Knowledge Graph & Taxonomy\\n"]
    global_index.append("This file maps the refactored documentation architecture for LLM navigation.\\n")
    
    for orig_file, (category, clean_name) in FILE_MAP.items():
        orig_path = original_dir / orig_file
        if not orig_path.exists():
            print(f"Warning: {orig_file} not found in {original_dir}")
            continue
            
        cat_dir = refactored_dir / category
        cat_dir.mkdir(parents=True, exist_ok=True)
        
        dest_path = cat_dir / clean_name
        
        # Read original content
        with open(orig_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Write intelligence layer + original content
        intel_layer = generate_intelligence_layer(category, orig_file, clean_name)
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(intel_layer + content)
            
        print(f"Refactored: {orig_file} -> {category}/{clean_name}")
        
        # Add to global index
        global_index.append(f"- **{category}/{clean_name}** (Source: `{orig_file}`)")

    # Write global index
    with open(index_dir / "taxonomy_graph.md", "w", encoding="utf-8") as f:
        f.write("\\n".join(global_index))
        f.write("\\n\\n<llm_context>\\nThis taxonomy file serves as an entry point for LLMs to traverse the refactored document space efficiently.\\n</llm_context>")
        
    print("Refactoring complete.")

if __name__ == "__main__":
    main()
