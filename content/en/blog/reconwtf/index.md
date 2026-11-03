---
title: "ReconWTF: my recon tool for bug bounty"
description: "ReconWTF is a Bash framework that automates bug bounty recon: subdomains, endpoints, JavaScript analysis, scanning and vulnerability checks with a single command. How it works and how to use it."
lead: "One command and dozens of recon tools run in a chain: subdomains, endpoints, JavaScript, ports, technologies and vulnerabilities. Why I wrote my own tool and how it works."
date: 2026-11-01T14:00:00+05:00
lastmod: 2026-11-03T13:00:00+05:00
draft: false
weight: 40
images: []
contributors: ["Anton S."]
url: "/en/blog/reconwtf/"
---

In bug bounty, whoever knows the target better wins. Most vulnerabilities aren't on the main site but on a forgotten subdomain, an old API or in a JavaScript file with a hardcoded key. To find all that you have to run dozens of tools, connect their output and not drown in the results. Doing it by hand for every program takes too long, so I wrote **[ReconWTF](https://github.com/solo10010/reconWTF)**.

> Ideas and some scenarios were inspired by six2dez's reconftw. ReconWTF is similar in spirit but works its own way and is tailored to my process.

## What it does

ReconWTF is a Bash framework that **installs the required tools and runs them in a chain**, passing the results of one stage to the next. Recon can be run in full or in parts.

**Information gathering:** subdomain IP addresses, cloud provider detection, domain information, WAF detection.

**Subdomains:**

- passive discovery — amass, certificates (ctfr), open datasets;
- active — amass, subfinder;
- brute force — puredns;
- name permutations — DNScewl + puredns.

**Endpoints:** passively from archives and GitHub (gauplus, github-endpoints), actively with the gospider crawler.

**Web probing:** live hosts (httpx, httprobe) and screenshots for a quick visual overview.

**JavaScript:** link extraction (linkfinder), **secret hunting** (SecretFinder), downloading JS and extracting variables.

**Scanning:** ports (naabu, nmap), technologies (nuclei, webanalyze), security headers.

**Vulnerability checks:** nuclei templates, nmap NSE scripts, searchsploit, fuzzing (ffuf), CORS and open redirect checks, 403 bypass.

**OSINT:** email harvesting and breach checks, GitHub and Google dorks, metadata.

## Installation

```bash
git clone https://github.com/solo10010/reconWTF
cd reconWTF
chmod +x *.sh
./reconwtf.sh --install       # installs every tool
./reconwtf.sh --check-tools   # checks that everything is in place
```

Before running, fill in `config.conf`: service API keys, threads, timeouts, ports and which tools to use. The whole process is fine-tuned through the config.

## Modes

| Flag | What it does |
|---|---|
| `-p, --passive` | passive methods only, never touches the target |
| `-o, --osint` | minimal recon via OSINT |
| `-s, --subdomain-search` | subdomains only: discovery, resolution, takeover check |
| `-a, --active` | full analysis with active checks |
| `-r, --recon-full` | full recon of the target |

## Examples

Full recon:

```bash
./reconwtf.sh -d "target.com" -a
```

OSINT only:

```bash
./reconwtf.sh -d "target.com" -o
```

With all the important parameters — company, address range, a cookie for the authenticated area, exclusions and a custom config:

```bash
./reconwtf.sh -d "target.com" -m "Target Inc" -cidr "203.0.113.0/24" \
  -c "SESSIONID=XXXX" -x out_of_scope.txt \
  --config config/config.conf --recon-full
```

## Scope matters

Bug bounty means working strictly within the program's rules. That's why ReconWTF has an **out of scope** file: everything listed there is excluded from results and not scanned.

```text
\.excluded.com   # exclude every subdomain of excluded.com
\example.com     # exclude the whole domain
```

**Only run active modes against targets you're authorized to test**: within a bug bounty program or under a testing contract. Passive mode (`-p`) and OSINT don't interact with the target directly.

## Storing results

Recon results can be pushed automatically to a **private** GitHub repository: create the repository, add an SSH key and put the details in `config.conf`. That way the recon history for every target is kept and easy to compare between runs — new subdomains and endpoints are often the most interesting part.

## What's next

ReconWTF solves "run everything in a chain", but the results still have to be read through in files. The next step was my own platform with a database, a UI, an intercepting proxy and continuous monitoring — [Qyran](/en/blog/qyran/). Another related project is **[BugBounty-Hub](https://github.com/solo10010/BugBounty-Hub)**, the collection of nuclei templates and wordlists that ReconWTF uses.
