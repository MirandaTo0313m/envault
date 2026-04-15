# `envault compare` — Vault Comparison Command

Compare two `.env` or vault files side-by-side and report key-level differences.

## Usage

```bash
envault compare <fileA> <fileB> [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--json` | Output the result as a JSON object |
| `-q, --quiet` | Suppress file headers and summary line |

## Output Categories

- **Only in A** (`-`): Keys present in `fileA` but missing from `fileB`
- **Only in B** (`+`): Keys present in `fileB` but missing from `fileA`
- **Different** (`~`): Keys present in both files but with differing values
- **Same**: Keys with identical values in both files (count shown in summary)

## Examples

```bash
# Compare a local .env with a vault file
envault compare .env .env.vault

# Output as JSON for scripting
envault compare .env.staging .env.production --json

# Quiet mode (no headers/summary)
envault compare .env .env.vault --quiet
```

## JSON Output Shape

```json
{
  "onlyInA": ["KEY_MISSING_IN_B"],
  "onlyInB": ["KEY_MISSING_IN_A"],
  "different": ["KEY_WITH_DIFF_VALUE"],
  "same": ["SHARED_KEY"]
}
```
