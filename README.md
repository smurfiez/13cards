# 13 Cards

Chinese Poker / Vietnamese Mậu Binh hand solver — pick 13 cards, find optimal setups, compare players, and play open-face mode.

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Solver + manual row editor (drag/tap) with live foul check |
| `payouts.html` | Payout reference by variant |
| `random.html` | Random deal + JSON test case export |
| `compare.html` | 2–4 player head-to-head scoring (1-6 method) |
| `ofc.html` | Open-face Chinese poker (one card at a time) |

## Features

- **Manual layout** — drag or tap cards into front / middle / back; foul validation in real time
- **Haptic feedback** — light vibration on card taps (iPhone / supported devices)
- **Head to head** — auto-arrange or manual layouts, row royalties, fouls, naturals, ace bonuses
- **OFC** — classic 13-deal placement with live validity and solver hint

## Install as PWA

Works offline after the first visit.

- **iPhone:** Safari → Share → **Add to Home Screen**
- **Android / Chrome:** **Install app** in the nav, or browser menu → Install

Requires HTTPS or `localhost` for the service worker.

## Local development

```bash
python3 -m http.server 8080
```

Open http://localhost:8080
