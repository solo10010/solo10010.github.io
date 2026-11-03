---
title: "Protecting hosting from bots: CrowdSec, BitNinja and Imunify360 in practice"
description: "Hands-on experience with three server protection tools for hosting: how CrowdSec, BitNinja and Imunify360 work, how to use them in day-to-day support, how to block aggressive bots and which pitfalls to expect."
lead: "Three tools I've worked with on hosting servers: where each one shines, how to use them in everyday support and which pitfalls wait during rollout."
date: 2026-11-01T13:00:00+05:00
lastmod: 2026-11-03T13:00:00+05:00
draft: false
weight: 40
images: []
contributors: ["Anton S."]
url: "/en/blog/hosting-bot-protection/"
---

On shared hosting, bots are background noise: vulnerability scanners, admin panel brute force, aggressive crawlers that take sites down with load. Protection has to work at the level of the whole server, not an individual site. I've worked with three tools — **CrowdSec**, **BitNinja** and **Imunify360**. This isn't a comparative benchmark but practical notes: how each one works, how to live with it in support and where the pitfalls are.

> Customer domains, license keys and internal addresses are omitted.

## CrowdSec — fail2ban on steroids

**How it works.** The agent parses logs (SSH, web server, panels), detects attack behavior using scenarios and makes blocking decisions. The blocking itself is done by **bouncers** — separate components for the firewall, the web server or a cloud WAF. The key feature is the **community blocklist**: participants share attacker IPs, so you block them before they even reach you.

**Installation** with the iptables bouncer:

```bash
curl -s https://packagecloud.io/install/repositories/crowdsec/crowdsec/script.deb.sh | sudo bash
apt install crowdsec crowdsec-firewall-bouncer-iptables
systemctl restart crowdsec
cscli bouncers list
```

**Useful commands:**

```bash
cscli decisions list                 # who is blocked right now
cscli decisions delete --ip 1.2.3.4  # unblock
cscli alerts list                    # what fired
cscli collections list               # which scenario collections are installed
```

**Where it shines:** free, lightweight, easy to install on any Linux server, including infrastructure machines without a panel. A great replacement for fail2ban.

## BitNinja — centralized protection with a console

**How it works.** An agent on the server plus a cloud console that manages all servers at once. Inside there are several modules: a firewall with allow and deny lists, a WAF (running as a reverse proxy in front of the web server), antivirus, brute force protection, a captcha for suspicious IPs.

**The main convenience** is centralization: an allow or deny entry for an IP or an entire country is added in the console and **applied to every server immediately**.

**Typical support tasks:**

1. **"The customer sees a captcha / the site is unavailable."** Take the customer's IP, find it in the console's incidents and remove it from the challenge list. If the IP keeps getting blocked, look at which WAF rule fires and **disable that rule for that specific site only** — not the whole WAF and not for the whole server. Order matters in site rules: a rule higher in the list is applied first.

2. **"The antivirus deleted site files."** False positives on CMS files happen. Files are restored from quarantine in the anti-malware section, and once restored they're automatically added to exceptions.

3. **"Is the WAF working?"** A quick check is an LFI-like request:

```text
https://example.com/?test=/etc/passwd
```

The request should be blocked. If the page opens as usual, the WAF isn't in front of the web server — check the module status:

```bash
bitninjacli --module=WAFManager --status
```

**Installation pitfalls:**

- BitNinja **conflicts with Imunify360** — Imunify has to be removed before installing;
- it needs `redis` and `ipset`;
- if the server runs CSF, check the `FASTSTART` setting — it affects how CSF interacts with BitNinja's rules.

## Imunify360 — protection for servers with a panel

**How it works.** A suite for servers with control panels (Plesk, cPanel): a firewall, a ModSecurity-based WAF, antivirus, DoS protection and proactive PHP defense. It integrates into the panel's interface.

**Configuration** lives in `/etc/sysconfig/imunify360/imunify360.config`, but the recommended way to change it is the CLI:

```bash
imunify360-agent config update '{"MALWARE_SCAN_INTENSITY": {"cpu": 5}}'
```

**Blocking aggressive bots.** A useful feature is blocking an IP when a specific ModSecurity rule keeps firing for it. For example, for rules that trigger on aggressive crawlers:

```bash
imunify360-agent config update \
  '{"MOD_SEC_BLOCK_BY_CUSTOM_RULE":{"<RULE_ID>":{"check_period":120,"max_incidents":3}}}'
```

That is, if the rule fires 3 times within 120 seconds for one IP, the IP goes to the gray list. Rule IDs come from the incident log. This lets you precisely shut out bots that don't attack but generate load.

**DoS protection** is configured through connection limits: an overall limit per IP and separate per-port limits. Thresholds should match real traffic, or visitors behind a shared NAT get blocked.

**A support tip:** when contacting the vendor, attach the output of

```bash
imunify360-agent doctor
```

right away — it saves a couple of rounds of back-and-forth.

## Which one to choose

| | CrowdSec | BitNinja | Imunify360 |
|---|---|---|---|
| Model | open source + community blocklist | agent + cloud console | suite for panels |
| Management | CLI on each server | one console for all servers | panel UI and CLI |
| WAF | via bouncers | built-in reverse proxy | ModSecurity |
| Antivirus | no | yes | yes |
| Best fit | any Linux servers, infrastructure | a fleet of hosting servers | servers with Plesk/cPanel |

My conclusions:

- **Don't install several all-in-one suites on one server** — they fight over the firewall and web traffic.
- **For infrastructure servers** (monitoring, SIEM, internal services) a firewall plus CrowdSec is enough.
- **For a fleet of hosting servers** centralized management becomes decisive: lists and rules applied to every server at once save hours in support.
- **Every WAF produces false positives** on customer sites. You need a clear procedure: how to unblock an IP quickly and how to disable a rule for one site without weakening protection for the rest.
- **Send events from all these systems to the SIEM** — then you see not only "who got blocked" but what attacks the whole fleet is facing. More on that in [SIEM noise](/en/blog/siem-alert-noise/).
