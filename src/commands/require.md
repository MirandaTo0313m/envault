# `envault require`

Validate that all keys listed in a requirements file exist and have non-empty values in the vault.

## Usage

```bash
envault require <requireFile> [--vault <path>]
```

## Arguments

| Argument      | Description                              |
|---------------|------------------------------------------|
| `requireFile` | Path to a file listing required env keys |

## Options

| Option            | Default       | Description              |
|-------------------|---------------|--------------------------|
| `--vault <path>`  | `.env.vault`  | Path to the vault file   |

## Require File Format

One key per line. Lines starting with `#` are treated as comments.

```
# Required environment variables
API_KEY
DB_URL
SECRET_TOKEN
```

## Output

```
  OK        API_KEY
  MISSING   DB_URL
  EMPTY     SECRET_TOKEN

Some required keys are missing or empty.
```

Exits with code `0` if all keys are present and non-empty, `1` otherwise.

## Example

```bash
envault require .env.required
```
