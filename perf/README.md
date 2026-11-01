# Load testing (Apache JMeter)

The full write-up of the 1 Nov 2026 test is in `load-test-report.html`.

## Files

| File | What it is |
|---|---|
| `pages.json` | Every same-origin file each page requests in a real browser. Update it when pages change. |
| `build-jmx.mjs` | Builds `idt-load-test.jmx` from `pages.json`. Run `node perf/build-jmx.mjs`. |
| `idt-load-test.jmx` | The JMeter plan. Each user visits Home, Products, Product (ZDM-E5) and Contact, with a browser cache and a 3–6 s pause between pages. |
| `static-server.mjs` | A local test target that serves files like IIS 10 does by default. `--max-conn 200` returns 503 above 200 connections, like SmarterASP's ASP.NET Basic plan. |
| `results/` | JMeter HTML dashboards from the test runs. Local only, not committed. |

Third-party hosts (Google Fonts, cdnjs, jsDelivr, Google Apps Script) are deliberately not in the plan. Load testing them would hit systems IDT does not own.

## Running

You need Java 17+ and [Apache JMeter 5.6.3](https://jmeter.apache.org/download_jmeter.cgi). Use JMeter's non-GUI mode for load; the GUI is only for editing.

```bash
node perf/static-server.mjs --port 8080
jmeter -n -t perf/idt-load-test.jmx -Jhost=127.0.0.1 -Jport=8080 -Jusers=1000 -Jrampup=10 -l results.jtl -e -o report/
```

| Property | Default | Meaning |
|---|---|---|
| `host`, `port`, `protocol` | `localhost`, `8080`, `http` | Target site |
| `users` | `10` | Virtual visitors |
| `rampup` | `10` | Seconds over which they all start |
| `thinkmin`, `thinkmax` | `3000`, `6000` | Pause between pages (ms) |
| `loops` | `1` | Visits per user |
| `connecttimeout`, `responsetimeout` | `10000`, `30000` | Timeouts (ms) |

For more than about 1,000 users, give JMeter memory, for example `set HEAP=-Xms2g -Xmx8g`. Above that, one PC running both JMeter and the server becomes the bottleneck.

## Testing the live site

1. Get written permission from SmarterASP.NET support first. An unannounced load test looks like an attack.
2. Run against the public address (through Cloudflare if it is in front) from a cloud load service that accepts `.jmx` files, such as BlazeMeter or Azure Load Testing. A home connection cannot generate the traffic of 5,000 real visitors.
3. Step up: 100, 500, 1,000, then 5,000 users, and stop if errors pass 1%.

```bash
jmeter -n -t perf/idt-load-test.jmx -Jprotocol=https -Jport=443 -Jhost=www.your-domain.com -Jusers=100 -Jrampup=60 -l live.jtl -e -o live-report/
```

## Hosting settings

`web.config` in the repository root holds the IIS settings this test assumes: gzip, cache lifetimes (1 hour for pages and code, 7 days for `assets/`), and MIME types for `.webp`, `.json`, `.mjs`, `.glb` and `.woff2`. Upload it with the site. GitHub Pages ignores it.
