This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# Summary

## Purpose

This is a reference codebase organized into multiple files for AI consumption.
It is designed to be easily searchable using grep and other text-based tools.

## File Structure

This skill contains the following reference files:

| File | Contents |
|------|----------|
| `project-structure.md` | Directory tree with line counts per file |
| `files.md` | All file contents (search with `## File: <path>`) |
| `tech-stacks.md` | Languages, frameworks, and dependencies per package (search with `## Tech Stack: <path>`) |
| `summary.md` | This file - purpose and format explanation |

## Usage Guidelines

- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes

- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: graphify-out/**, .claude/skills/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

## Statistics

55 files | 4,007 lines

| Language | Files | Lines |
|----------|------:|------:|
| TypeScript (TSX) | 20 | 2,220 |
| Markdown | 8 | 470 |
| TypeScript | 7 | 375 |
| JSON | 5 | 120 |
| No Extension | 3 | 54 |
| JavaScript (CJS) | 2 | 70 |
| SVG | 1 | 1 |
| Python | 1 | 446 |
| JavaScript | 1 | 47 |
| Shell | 1 | 6 |
| Other | 6 | 198 |

**Largest files:**
- `scripts/build-proposal.py` (446 lines)
- `src/projects/ProposalForm.tsx` (348 lines)
- `src/projects/QuoteDocument.tsx` (262 lines)
- `src/projects/MyProposalsPage.tsx` (242 lines)
- `src/lib/firestore.ts` (227 lines)
- `src/projects/QuoteForm.tsx` (211 lines)
- `src/projects/ProposalDocument.tsx` (185 lines)
- `src/projects/QuotePage.tsx` (162 lines)
- `src/App.tsx` (149 lines)
- `src/projects/ProposalPage.tsx` (140 lines)