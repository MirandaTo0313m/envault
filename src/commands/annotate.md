# `annotate` Command

The `annotate` command lets you attach human-readable annotations to individual keys in your vault file. Annotations are stored as special comment lines directly above the key.

## Usage

```bash
envault annotate set <key> <annotation> [--vault <path>]
envault annotate remove <key> [--vault <path>]
envault annotate list [--vault <path>]
```

## Subcommands

### `set`

Attaches an annotation to the specified key.

```bash
envault annotate set DB_URL "Primary database connection string"
```

This will prepend a `#@annotation:` comment line above the key in the vault.

### `remove`

Removes the annotation from the specified key.

```bash
envault annotate remove DB_URL
```

### `list`

Lists all keys that have annotations.

```bash
envault annotate list
```

Example output:
```
DB_URL: Primary database connection string
API_KEY: Third-party API key
```

## Vault Format

Annotations are stored inline in the vault file:

```
#@annotation: Primary database connection string
DB_URL=postgres://localhost/mydb
API_KEY=abc123
```

## Options

| Flag | Description | Default |
|------|-------------|--------|
| `--vault <path>` | Path to the vault file | `.env.vault` |
