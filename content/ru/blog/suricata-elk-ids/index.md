---
title: "Suricata + ELK: свой сетевой IDS с дашбордами"
description: "Как поднять сетевой IDS на Suricata: установка, выбор интерфейса, наборы правил через suricata-update, визуализация в Kibana, просмотр алертов в EveBox, безопасная публикация интерфейсов и интеграция с Wazuh."
lead: "Сетевой IDS на open source: Suricata слушает трафик, suricata-update держит правила свежими, Kibana и EveBox показывают алерты, а Wazuh связывает сетевые события с событиями хостов."
date: 2026-11-01T12:00:00+05:00
lastmod: 2026-11-01T12:00:00+05:00
draft: false
weight: 40
images: []
contributors: ["Антон С."]
url: "/blog/suricata-elk-ids/"
---

Логи хостов показывают не всё: сканирование портов, эксплуатация уязвимостей в сетевых сервисах, вредоносный трафик и подозрительные TLS-соединения видны только в сети. Для этого нужен сетевой IDS. Мой выбор — **Suricata**: open source, многопоточная, понимает десятки протоколов и пишет события в удобный JSON (`eve.json`).

## Схема

```text
трафик (зеркало порта / сам сервер)
        │
        ▼
    Suricata ──► eve.json ──► Logstash/Filebeat ──► Elasticsearch ──► Kibana
                    │                                                 EveBox
                    └──► агент Wazuh ──► SIEM (корреляция с хостами)
```

Suricata можно поставить прямо на защищаемый сервер или на отдельную машину, куда приходит копия трафика (SPAN-порт коммутатора или TAP).

## Установка

На Ubuntu Suricata есть в штатных репозиториях (для свежей версии — PPA OISF):

```bash
apt update
apt install suricata
suricata --build-info | head
```

## Настройка

Основной конфиг — `/etc/suricata/suricata.yaml`. Минимум, который нужно поменять:

**Домашняя сеть** — чтобы правила понимали, что «своё», а что «внешнее»:

```yaml
vars:
  address-groups:
    HOME_NET: "[10.0.0.0/8,172.16.0.0/12,192.168.0.0/16]"
```

**Интерфейс для захвата** в режиме `af-packet`:

```yaml
af-packet:
  - interface: eth0
    cluster-id: 99
    cluster-type: cluster_flow
```

Проверка конфигурации и запуск:

```bash
suricata -T -c /etc/suricata/suricata.yaml -v
systemctl enable --now suricata
```

## Правила: suricata-update

Без правил Suricata почти ничего не детектирует. Современный способ управлять ими — `suricata-update`. По умолчанию он скачивает бесплатный набор **Emerging Threats Open**, применяет фильтры и собирает всё в один файл `/var/lib/suricata/rules/suricata.rules`:

```bash
suricata-update
```

В конфиге Suricata укажите этот путь:

```yaml
default-rule-path: /var/lib/suricata/rules
rule-files:
  - suricata.rules
```

Дополнительные источники правил:

```bash
suricata-update update-sources     # обновить индекс источников
suricata-update list-sources       # посмотреть, что доступно
suricata-update enable-source oisf/trafficid
suricata-update enable-source sslbl/ssl-fp-blacklist
suricata-update
```

Среди источников есть бесплатные (ET Open, OISF Traffic ID, списки abuse.ch) и коммерческие (ET Pro и другие) — для них нужен ключ подписки.

Тонкая настройка — файлами `enable.conf`, `disable.conf`, `drop.conf` и `modify.conf` в `/etc/suricata/`: отключить шумные правила, перевести нужные в режим блокировки (для IPS), поменять параметры. Обновление правил стоит повесить на cron с последующим `suricatasc -c reload-rules`.

**Проверка, что детект работает:**

```bash
curl http://testmynids.org/uid/index.html
grep -i "GPL ATTACK_RESPONSE" /var/log/suricata/fast.log
```

## Визуализация: ELK и EveBox

Suricata пишет события в `/var/log/suricata/eve.json`. Дальше их нужно куда-то отправить.

**Elasticsearch + Kibana.** Logstash или Filebeat (у Filebeat есть готовый модуль Suricata) отправляют `eve.json` в Elasticsearch, а в Kibana строятся дашборды:

- карта алертов по странам (GeoIP);
- топ-10 сработавших правил;
- количество алертов по наборам правил;
- топ исходных и целевых IP и портов;
- таблица с деталями каждого алерта.

Готовые дашборды для Suricata есть в модуле Filebeat и в открытых репозиториях — их можно импортировать через *Stack Management → Saved Objects* и доработать под себя.

**EveBox** — лёгкий веб-интерфейс именно для алертов Suricata: удобно разбирать события по одному, помечать просмотренные и смотреть связанные потоки. Хорошо дополняет Kibana.

Elasticsearch требователен к памяти: на небольшой машине ограничьте heap в `jvm.options` (например, `-Xms1g -Xmx1g`) и настройте ротацию индексов, иначе диск закончится быстрее, чем вы ожидаете.

## Не выставляйте Kibana в интернет

Kibana и EveBox слушают локальные порты (`5601`, `5636`). Публиковать их стоит только через обратный прокси с TLS и ограничением доступа:

```nginx
server {
    listen 443 ssl;
    server_name ids.example.com;

    # ssl_certificate ... ; ssl_certificate_key ... ;

    allow 10.0.0.0/8;     # VPN / офис
    deny  all;

    location / {
        proxy_pass http://127.0.0.1:5601;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Плюс встроенная аутентификация Elastic или хотя бы basic auth на прокси. IDS с открытой наружу панелью — это подарок атакующему: по ней видно, что вы детектируете, а что нет.

## Интеграция с Wazuh

Если у вас уже есть SIEM на Wazuh, `eve.json` удобно читать агентом Wazuh:

```xml
<localfile>
  <log_format>json</log_format>
  <location>/var/log/suricata/eve.json</location>
</localfile>
```

Сетевые алерты попадают в ту же панель, что и события хостов, и их можно коррелировать: например, сетевое правило сработало на эксплуатацию веб-уязвимости, а на том же сервере через минуту появился новый PHP-файл. Как устроен сам SIEM, я описывал в статье [«SOC на Wazuh с нуля»](/blog/soc-wazuh-s-nulya/).

## Итоги

- Suricata закрывает слепую зону логов хостов — сетевые атаки и подозрительный трафик.
- Правила — через `suricata-update` по расписанию, шум — через `disable.conf`.
- Kibana — для трендов и дашбордов, EveBox — для разбора алертов по одному.
- Интерфейсы IDS — только за прокси с TLS и ограничением доступа.
- Максимальная польза — в связке с SIEM, где сетевые события коррелируются с событиями хостов.
- Мой вывод после тестов: для периметра компании практичнее хороший NGFW — мы протестировали решения почти всех вендоров, и больше всего мне понравился Palo Alto Networks. Suricata отлично подходит для лабораторий, исследований и как дополнительный сетевой датчик.
