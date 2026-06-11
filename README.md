<div align="center">
  <img width="120x" height="auto" src="assets/logo.png" />
  
  <svg xmlns="http://www.w3.org/2000/svg" fill="transparent"></svg>

  <p>
    <a href="https://tentaclepay.com/"><img alt="Website" src="https://img.shields.io/badge/website-tentaclepay.com-F12378?labelColor=black&style=for-the-badge" /></a>
    <a href="https://docs.tentaclepay.com/"><img alt="Docs" src="https://img.shields.io/badge/docs-read%20the%20docs-blue?style=for-the-badge" /></a>
    <a href="https://x.com/tentaclepay"><img alt="X" src="https://img.shields.io/badge/tentaclepay-black?style=for-the-badge&logo=x" /></a>
  </p>
</div>

## Tentacle Wallet `tpay`

Tentacle Wallet lets your agents spend in control — built for autonomous agents on Sui. Inspired by [pay.sh](https://pay.sh).

## Features

- **Made for agents** — Your agent holds it and pays on its own. No human in the loop.
- **Rules it can't break** — Set the limits. The wallet enforces them on every spend.
- **Pay across chains** — Pay in Sui — it settles on the destination chain. Built right in.

## How it works

Without Tentacle Wallet, agents hit paywalled APIs and stall:

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

## Links

- Website: https://tentaclepay.com
- Docs: https://docs.tentaclepay.com
- X: https://x.com/tentaclepay
