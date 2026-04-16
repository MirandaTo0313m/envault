# `envault expire` — Key Expiry Management

The `expire` subcommand lets you attach ISO 8601 expiry dates to individual vault keys,
list which keys have expiry metadata, check for already-expired keys, and remove expiry
dates when no longer needed.

## Subcommands

### `expire set <key> <date>`

Attach an expiry date to a vault key.

```bash
envault expire set API_KEY 2025-12-31T00:00:00Z
```

Options:
- `-v, --vault <path>` — path to the vault file (default: `.env.vault`)

### `expire list`

List all keys that have an expiry date set.

```bash
envault expire list
```

### `expire check`

Print any keys whose expiry date is in the past. Useful in CI pipelines to catch
stale secrets before deployment.

```bash
envault expire check
```

Exit code is `0` regardless; pipe through your own logic if you need a failing step.

### `expire remove <key>`

Strip the expiry metadata from a key without altering its value.

```bash
envault expire remove API_KEY
```

## Storage Format

Expiry dates are stored as a `# expires=<ISO8601>` comment on the line immediately
preceding the key=value pair in the vault file, keeping the format human-readable
and compatible with standard `.env` parsers.

```
# expires=2025-12-31T00:00:00Z
API_KEY=ENC:abc123...
```
