#!/usr/bin/env python3
"""
PDF to Markdown converter for Energesman BSF project.
Extracts text from PDFs and converts to well-formatted markdown.
"""

import sys
import re
from pathlib import Path
from typing import List
from pypdf import PdfReader


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text content from PDF file."""
    reader = PdfReader(pdf_path)
    text_parts = []

    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)

    return "\n\n".join(text_parts)


def clean_text(text: str) -> str:
    """Clean extracted text for markdown conversion."""
    # Remove excessive whitespace
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    # Remove trailing whitespace
    text = '\n'.join(line.rstrip() for line in text.split('\n'))
    return text.strip()


def wrap_line(line: str, max_width: int = 80) -> List[str]:
    """Wrap a single line to max_width characters."""
    if len(line) <= max_width:
        return [line]

    # Don't wrap markdown headers, tables, or code blocks
    if (line.startswith('#') or line.startswith('|') or
        line.startswith('```') or line.startswith('    ')):
        return [line]

    # Check if line is likely a continuation (no punctuation at start)
    words = line.split()
    if not words:
        return ['']

    wrapped_lines = []
    current_line = []
    current_length = 0

    for word in words:
        word_length = len(word)
        # +1 for space
        if current_length + word_length + 1 <= max_width:
            current_line.append(word)
            current_length += word_length + 1
        else:
            if current_line:
                wrapped_lines.append(' '.join(current_line))
            current_line = [word]
            current_length = word_length + 1

    if current_line:
        wrapped_lines.append(' '.join(current_line))

    return wrapped_lines


def wrap_text(text: str, max_width: int = 80) -> str:
    """Wrap text to max_width characters per line."""
    lines = text.split('\n')
    wrapped = []

    for line in lines:
        if not line.strip():
            wrapped.append('')
        else:
            wrapped.extend(wrap_line(line, max_width))

    return '\n'.join(wrapped)


def to_kebab_case(filename: str) -> str:
    """Convert filename to kebab-case."""
    # Remove .pdf extension
    name = filename.replace('.pdf', '')
    # Convert to lowercase
    name = name.lower()
    # Replace spaces and special chars with hyphens
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    # Remove leading/trailing hyphens
    name = name.strip('-')
    return name


def convert_pdf_to_markdown(
    pdf_path: Path,
    output_path: Path
) -> dict:
    """Convert PDF to markdown and save to file."""
    # Extract text
    raw_text = extract_text_from_pdf(pdf_path)
    cleaned_text = clean_text(raw_text)

    # Create markdown structure
    title = pdf_path.stem
    markdown = f"# {title}\n\n{cleaned_text}"

    # Wrap text to 80 characters
    wrapped_markdown = wrap_text(markdown, max_width=80)

    # Save to file
    output_path.write_text(wrapped_markdown, encoding='utf-8')

    # Return metadata
    return {
        "source_pdf": pdf_path.name,
        "output_file": output_path.name,
        "pages_processed": len(PdfReader(pdf_path).pages),
        "file_size_bytes": output_path.stat().st_size,
        "line_count": len(wrapped_markdown.split('\n'))
    }


def main():
    """Main entry point for CLI usage."""
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_md.py <pdf_file>")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])

    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)

    # Generate output filename
    output_name = to_kebab_case(pdf_path.name) + '.md'
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 \
        else pdf_path.parent / output_name

    # Convert
    result = convert_pdf_to_markdown(pdf_path, output_path)

    # Print results
    print(f"Converted: {result['source_pdf']}")
    print(f"Output: {result['output_file']}")
    print(f"Pages: {result['pages_processed']}")
    print(f"Lines: {result['line_count']}")


if __name__ == "__main__":
    main()
