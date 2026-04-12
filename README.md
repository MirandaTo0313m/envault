# envault

> A CLI tool for encrypting and syncing `.env` files across team members using asymmetric keys.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

### Initialize a vault in your project

```bash
envault init
```

This generates a keypair and creates an `envault.config.json` in your project root.

### Encrypt your `.env` file

```bash
envault encrypt --input .env --output .env.vault
```

### Decrypt on another machine

```bash
envault decrypt --input .env.vault --output .env --key ~/.envault/private.key
```

### Add a team member's public key

```bash
envault trust --key ./teammate.pub
```

Once trusted, re-encrypt to grant them access:

```bash
envault encrypt --input .env --output .env.vault
```

> **Tip:** Commit `.env.vault` and `envault.config.json` to version control. Never commit `.env` or private keys.

---

## How It Works

envault uses **RSA asymmetric encryption** to protect your secrets. Each team member holds a private key locally. The `.env` file is encrypted with a shared symmetric key, which is itself encrypted for each trusted public key — similar to how PGP works.

---

## Requirements

- Node.js >= 18
- npm or yarn

---

## License

[MIT](./LICENSE)