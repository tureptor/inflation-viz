# cpih_json_exporter

Automatically fetches ONS MM23 dataset csv then parses it and generates a hierarchical JSON with CPIH indices and weights.

## Prereqs:
Install [uv](https://docs.astral.sh/uv/getting-started/installation/)

## Usage:

```
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
uv run main.py
```

## Development

`uvx ruff check`  
`uvx ruff format .`