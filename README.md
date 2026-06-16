<div align="center">
  <img width="120x" height="auto" src="assets/logo.png" />
  
  <svg xmlns="http://www.w3.org/2000/svg" fill="transparent"></svg>

  <p>
    <a href="https://tentaclepay.com/"><img alt="Website" src="https://img.shields.io/badge/website-tentaclepay.com-F12378?labelColor=black&style=for-the-badge" /></a>
    <a href="https://docs.tentaclepay.com/"><img alt="Docs" src="https://img.shields.io/badge/docs-read%20the%20docs-blue?style=for-the-badge" /></a>
    <a href="https://x.com/tentaclepay"><img alt="X" src="https://img.shields.io/badge/tentaclepay-black?style=for-the-badge&logo=x" /></a>
  </p>
</div>

## Tentacle Pay Wallet (`tpay`)

Tentacle Pay Wallet lets your agents spend in control — built for autonomous agents on Sui. Inspired by [pay.sh](https://pay.sh).

## Features

- **Made for agents** — Your agent holds it and pays on its own. No human in the loop.
- **Rules it can't break** — Set the limits. The wallet enforces them on every spend.
<!--- **Pay across chains** — Pay in Sui — it settles on the destination chain. Built right in.-->

## How it works

Without Tentacle Pay Wallet, agents hit paywalled APIs and stall:

```sh
$ curl https://api.weather.ai/forecast
HTTP/1.1 402 Payment Required
{
  "error": "payment_required",
  "accepts": [{
    "amount": "10000",
    "token": "USDC"
  }]
}
```

With `tpay`, the wallet handles payment automatically and the request goes through:

```sh
$ tpay curl https://api.weather.ai/forecast
HTTP/1.1 200 OK
{
  "location": "Tokyo, Japan",
  "temperature": "26°C",
  "forecast": "Humid & warm"
}
```

## Install

```sh
curl -fsSL https://tentaclepay.com/install | bash
```

This installs the prebuilt binary for your platform — macOS (Apple Silicon & Intel) and Linux (x64 & arm64) — into `~/.tpay/bin` and adds it to your `PATH`. To pin a version, pass `--version`:

```sh
curl -fsSL https://tentaclepay.com/install | bash -s -- --version 0.1.0
```

## Usage

Set up your first wallet. This generates a key, stores it in your OS keychain, and makes it the active wallet:

```sh
tpay setup
```

Then let your agent pay for any x402-protected request. `tpay curl` is a drop-in for `curl` — it forwards every flag, and when a server replies `402 Payment Required` it settles the payment and retries the request automatically:

```sh
tpay curl https://api.weather.ai/forecast
```

### Commands

| Command | Description |
| --- | --- |
| `tpay setup` | Create your first wallet and initialize tpay |
| `tpay curl <args…>` | Run curl, settling any x402 payment automatically |
| `tpay account` | Show the active wallet's balances |
| `tpay account list` | List all wallets (alias: `ls`) |
| `tpay account new <label>` | Create a new wallet |
| `tpay account import <label> --secret-key <key>` | Import a wallet from a secret key |
| `tpay account export <label>` | Reveal a wallet's secret key |
| `tpay account balance [label]` | Show a wallet's balances |
| `tpay account default <label>` | Set the active (default) wallet |
| `tpay account remove <label>` | Delete a wallet (alias: `rm`) |

Pass `-a, --account <label>` to any command to use a specific wallet instead of the active one. Balance commands also accept `-n, --network <mainnet|testnet>` (default: `mainnet`).

Run `tpay <command> --help` for full details on any command.

## Links

- Website: https://tentaclepay.com
- Docs: https://docs.tentaclepay.com
- X: https://x.com/tentaclepay
