#!/usr/bin/env python3
"""
Self-contained MarkItDown CLI wrapper for ToMarkdown Desktop.
"""
import sys
import os

try:
    from markitdown import MarkItDown
except ImportError:
    # Try importing from local pipx venv if running uncompiled
    venv_path = os.path.expanduser("~/.local/pipx/venvs/markitdown/lib/python3.14/site-packages")
    if os.path.exists(venv_path):
        sys.path.insert(0, venv_path)
    from markitdown import MarkItDown

def main():
    if len(sys.argv) < 2:
        print("Usage: markitdown <input_file> [-o <output_file>]")
        sys.exit(1)

    if "--version" in sys.argv or "-v" in sys.argv:
        print("0.1.0")
        sys.exit(0)

    if "--help" in sys.argv or "-h" in sys.argv:
        print("MarkItDown CLI for ToMarkdown Desktop\nUsage: markitdown <input_file> [-o <output_file>]")
        sys.exit(0)

    input_file = None
    output_file = None

    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg in ("-o", "--output"):
            if i + 1 < len(sys.argv):
                output_file = sys.argv[i + 1]
                i += 2
                continue
            else:
                print("Error: -o requires an output path", file=sys.stderr)
                sys.exit(1)
        elif not arg.startswith("-"):
            if input_file is None:
                input_file = arg
        i += 1

    if not input_file:
        print("Error: No input file specified", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(input_file):
        print(f"Error: Input file does not exist: {input_file}", file=sys.stderr)
        sys.exit(1)

    try:
        md = MarkItDown()
        result = md.convert(input_file)
        markdown_text = result.text_content

        if output_file:
            os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(markdown_text)
        else:
            print(markdown_text)

        sys.exit(0)
    except Exception as e:
        print(f"Conversion error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
