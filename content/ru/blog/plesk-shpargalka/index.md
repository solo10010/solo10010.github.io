---
title: "Plesk на хостинге: шпаргалка администратора"
description: "Команды, которые я годами использовал при поддержке серверов Plesk на shared-хостинге: диагностика и repair, базы данных, бэкапы, почтовая очередь и спам, логи и место на диске, зависшие задачи, PHP и файрвол."
lead: "Годы на поддержке хостинга — это сотни серверов с Plesk и одни и те же проблемы: кончилось место, забилась почтовая очередь, завис бэкап, сайт отдаёт 503. Собрал команды из своих заметок в одну шпаргалку."
date: 2026-11-02T23:00:00+05:00
lastmod: 2026-11-02T23:00:00+05:00
draft: false
weight: 40
images: []
contributors: ["Антон С."]
url: "/blog/plesk-shpargalka/"
---

На первой и второй линии поддержки хостинга Plesk — это ежедневная работа. В моём Obsidian раздел по Plesk вырос до полусотни заметок: от «почему не уходит почта» до подключения LUN больше 2 ТБ. Здесь — выжимка команд, которые реально пригождались чаще всего. Все примеры обезличены: `example.com`, `user@example.com`, `ID` — подставьте свои.

![Карта разделов шпаргалки: диагностика, базы данных, бэкапы, почта, место на диске, задачи, PHP, безопасность](map.svg)

> Всё ниже выполняется от root по SSH. Перед массовыми операциями — удалением писем, файлов, бэкапов — сначала посмотрите, что попадёт под команду, и только потом удаляйте.

## Диагностика и repair

Первое, что стоит запустить при «что-то сломалось, непонятно что»:

```bash
plesk version                    # версия и ОС
plesk repair all -n              # проверка без изменений — что найдёт
plesk repair all -y              # проверить и исправить всё
plesk repair web example.com -y  # только веб-конфигурация одного домена
plesk repair mail -y             # только почта
plesk repair db -y               # целостность БД самого Plesk
```

`plesk repair` — универсальное лекарство от рассинхронизации: когда конфиги на диске не совпадают с тем, что Plesk хранит у себя. Режим `-n` полезен, чтобы сначала увидеть масштаб.

Пересобрать конфиги веб-сервера для всех доменов:

```bash
plesk sbin httpdmng --reconfigure-all
```

Статус служб:

```bash
plesk sbin pleskrc nginx status
systemctl status sw-engine sw-cp-server psa
```

## Базы данных

Подключиться к MySQL под администратором Plesk без ввода пароля:

```bash
plesk db
plesk db -e "SHOW DATABASES;"
```

Дамп всех пользовательских баз по отдельным файлам:

```bash
mkdir -p /root/db-dump
for db in $(plesk db -Ne "SHOW DATABASES;" | grep -vE '^(information_schema|performance_schema|mysql|sys|psa|apsc|horde|roundcubemail|phpmyadmin_.*)$'); do
  plesk db dump "$db" > "/root/db-dump/${db}.sql"
done
```

Самые большие базы и таблицы — частая причина нехватки места:

```bash
plesk db -e "SELECT table_schema, ROUND(SUM(data_length+index_length)/1024/1024) AS mb
FROM information_schema.tables GROUP BY table_schema ORDER BY mb DESC LIMIT 10;"
```

Если MySQL не стартует, первым делом смотрите лог и свободное место: переполненный диск — самая частая причина, следом идут повреждённые таблицы InnoDB.

## Бэкапы и миграции

Резервные копии Plesk пишет журналы в `/var/log/plesk/PMM/`. Со временем там накапливаются гигабайты:

```bash
du -sh /var/log/plesk/PMM/
# посмотреть, что старше 30 дней
find /var/log/plesk/PMM/ -maxdepth 1 -name 'backup*' -type d -ctime +30
# и только потом удалить
find /var/log/plesk/PMM/ -maxdepth 1 -name 'backup*' -type d -ctime +30 -exec rm -rf {} +
```

Локальные бэкапы лежат в `/var/lib/psa/dumps/` — проверьте, не хранятся ли там копии, которые давно ушли во внешнее хранилище.

Для переноса сайтов между серверами — **Plesk Migrator**: он сам переносит домены, почту и базы. Для переноса почтовых ящиков с других серверов я написал отдельный инструмент — [imapsync-manager](/blog/imapsync-manager/).

## Почта: очередь и спам

Классический тикет: «почта не уходит» или «сервер в чёрных списках». Почти всегда причина — взломанный ящик или скрипт сайта, который рассылает спам.

### Postfix

```bash
postqueue -p | tail -1                    # размер очереди
postqueue -p | grep -c '^[A-F0-9]'        # число писем
# топ отправителей в очереди
postqueue -p | grep -Eo '^[A-F0-9]+.*' | awk '{print $NF}' | sort | uniq -c | sort -nr | head
postcat -q ID                             # содержимое конкретного письма
postsuper -d ID                           # удалить одно письмо
postqueue -f                              # попытаться отправить всё сейчас
```

Удалить из очереди всё от одного отправителя:

```bash
postqueue -p | awk '/^[A-F0-9]/ && $NF=="spammer@example.com" {print $1}' | tr -d '*!' | postsuper -d -
```

`postsuper -d ALL` очищает очередь целиком — вместе с легитимными письмами. Использовать только когда понятно, что в очереди один спам.

### Exim

```bash
exim -bpc                       # размер очереди
exim -bp | exiqsumm | sort -nr | head   # сводка по доменам
exiqgrep -f spammer@example.com -i | xargs exim -Mrm   # удалить письма отправителя
exiqgrep -zi | xargs exim -Mrm  # удалить «замороженные»
```

### Найти источник

- **ящик взломан** — смените пароль и проверьте логи авторизации: много успешных входов с разных стран за короткое время;
- **спамит скрипт сайта** — в заголовках письма будет путь к PHP-файлу (`X-PHP-Script` / `X-PHP-Originating-Script`), дальше — поиск веб-шелла. Как разбираться со взломанным сайтом, я описывал в [памятке по инцидентам](/blog/ir-pamyatka-vzlom-saita/);
- после чистки проверьте IP сервера в DNSBL и подайте заявки на исключение.

## Место на диске

Сначала — где именно закончилось:

```bash
df -h
df -i                         # иноды тоже могут кончиться
du -xh --max-depth=1 / | sort -h | tail
```

Логи сайтов — частый виновник:

```bash
du -h /var/www/vhosts/system/*/logs/* | sort -h | tail -20
truncate -s 0 /var/www/vhosts/system/example.com/logs/access_log
```

`truncate` обнуляет файл, не удаляя его, — процесс, который пишет в лог, продолжит работать. Если удалить лог через `rm`, а веб-сервер держит его открытым, место **не освободится**, пока процесс не перезапустить. Найти такие файлы:

```bash
lsof +L1 | grep deleted
```

Чтобы проблема не вернулась — настройте ротацию логов в параметрах домена в Plesk.

## Зависшие задачи

Если в панели «висит» задача — бэкап, установка обновлений, применение настроек:

```bash
ps aux | grep -E 'task-async|pmmcli|backup' | grep -v grep
pkill -f task-async-executor
systemctl restart sw-engine sw-cp-server
```

Заблокированный процесс установки обновлений:

```bash
ps aux | grep -E 'autoinstaller|yum|dnf|apt' | grep -v grep
```

Не убивайте установщик посреди работы без необходимости — сначала дайте ему время и посмотрите лог `/var/log/plesk/install/`.

## PHP и сайты

```bash
plesk bin php_handler --list                         # какие версии PHP установлены
plesk bin domain --info example.com                  # параметры домена, в т.ч. PHP
plesk bin site --update-php-settings example.com -settings settings.ini
```

Типичные проблемы:

- **503 / 502** — смотрите лог PHP-FPM и лимиты пула (`pm.max_children`); часто сайт просто упирается в число процессов;
- **белый экран** — включите показ ошибок временно или смотрите `error_log` в `/var/www/vhosts/system/example.com/logs/`;
- **нужна своя версия PHP** — Plesk позволяет зарегистрировать собственный обработчик через `php_handler --add`;
- **производительность Apache** — для сайтов на Apache помогает mod_lsapi вместо обычного CGI/FPM.

## Безопасность

Если на сервере стоит CSF:

```bash
csf -g 203.0.113.10     # найти IP во всех правилах
csf -d 203.0.113.10     # заблокировать
csf -dr 203.0.113.10    # снять блокировку
csf -a 198.51.100.5     # добавить в белый список
csf -r                  # перезагрузить правила
```

Fail2Ban, встроенный в Plesk:

```bash
fail2ban-client status
fail2ban-client status plesk-panel
fail2ban-client set plesk-panel unbanip 203.0.113.10
```

Минимум, который я включал на каждом сервере: Fail2Ban для панели, SSH и почты; ModSecurity с актуальными правилами; доступ к панели только по HTTPS; актуальные версии PHP у клиентов. Подробнее о защите хостинга от ботов — в отдельной [статье](/blog/zashchita-hostinga-ot-botov/).

## Чек-лист при «сервер тормозит»

1. `uptime`, `top` — нагрузка и кто её создаёт.
2. `df -h`, `df -i` — место и иноды.
3. Почтовая очередь — не идёт ли спам-рассылка.
4. `ss -s` и топ IP в логах — нет ли атаки или агрессивного бота.
5. Лимиты PHP-FPM у самых тяжёлых сайтов.
6. Медленные запросы MySQL.

Большинство тикетов закрывается на одном из этих шести шагов.
