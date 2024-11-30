---
title: "КЕЙС - Оптимизайция сервера 👋"
description: "Оптимизация сервера и работы сайта в рамках запроса клиента. Админисмтративные единоразовые работы."
lead: "Оптимизация - (MySQL/MariaDB) (Apache/Nginx) (Redis, OPcache) Проблемы с очисткой кэша в DLE, Рекомендации по настройке ISPmanager"
date: 2020-11-04T09:19:42+01:00
lastmod: 2020-11-04T09:19:42+01:00
draft: false
weight: 50
images: ["say-hello-to-doks.png"]
contributors: ["Антон С."]
---

Технические характеристики сервера

```
Тариф: Cloud 2-8-1000
CPU: 2
MEM: 8
DISK: 10000
OS: Ubuntu 22.04

Panel: ISP
ПО: Redis OPcache
Сайт: http://***gramm.pro/
```

Описание проблемы:

```
Хотели бы воспользоваться услугой "Единоразовые платные работы на сервере". Нужна ваша помощь в проверке настроек сервера и установке оптимальных параметров (php, apache/nginx, mysql, Redis, OPcache) для его стабильной работы и быстродействия.  
  
Проблема в том, что при добавлении админами новостей, именно в момент сохранения новости, начинается резкий прирост количества процессов, использования CPU и ОЗУ вплоть до того, что сайт перестаёт быть доступным и помогает только "насильственная" перезагрузка.  
  
Обратились в поддержку движка DLE и получили ответ:  
"Одно обращение к серверу это один процесс. Загрузка файлов, хоть одного, хоть сразу 100 это тоже всегда одно обращение, потому как отправляет их браузер по очереди. DLE не делает никаких обращений к серверу при загрузке и не генерирует множества обращений к серверу. Более того загружает файлы на сервер не DLE, а браузер соединяется с сервером напрямую. DLE запускается только тогда когда уже все загружено и все на сервере. Поэтому от DLE этот вопрос никак не зависит, и к сожалению со стороны DLE мы вам ничем помочь не можем.  
  
В данном случае вам нужно смотреть настройки серверного ПО. Скорее всего некорректно работает либо сборщик мусора на северном ПО, либо некорректная конфигурация сервера и запускаются дочерние потоки не по мере необходимости а сразу. Вам нужно обратится в службу поддержки вашего хостинга для проверки настроек сервера.  
При сохранении новости работает PHP интерпретатор, взаимодействует с базой данных и т.д. запуская соответствующие внутренние серверные процессы.  
Помимо всего прочего добавление публикации очищает кеши которые DLE создал до этого для облегчения работы, очищаются они чтобы пользователи увидели актуальную информацию, соответственно если много посетителей в этот момент то обновление большого количества контента потребуется при этом, это влечет безусловно увеличение нагрузки, пока все данные не обновятся и она не начнет поступать из кеша а не из базы данных.  
Мы не занимаемся настройкой серверов. Универсальных значений и рекомендаций тут не существует в принципе, а эти настройки делаются очень тонко, в зависимости от объема данных в БД, посещаемости, аппаратных данных сервера и так далее, достаточно много нюансов и тонкостей. Вам нужен в данном случае системный администратор. Администрированием серверов занимаются как правило хостинг провайдеры, мы эти не занимаемся, это не наша сфера работы."  
  
На сервере установлен ISPManager.  
  
Согласен на "Административные работы".
```

Во время иследования сервера и переговоров с клиентом было выяснено что на сервере появляются большое количество процессов apache действия которые к этому приводят создание или редактирование статей с аудио.

По запросу клиент создал статью на конечной точке http://***gramm.pro/ чтобы мы могли сами воиспроизводить проблему, и передал тестовые файлы которые используются для создания статьи.

Во время воиспроизведения мы обнаружили что любое редактирование приводит к бесконечному увеличению количества apache процессов до бесконечности и зависания сервера.


Анализ логов показал узкие места в nginx и Apache. так как nginx идет первым сначало настраиваем его.

в nginx мы обнаружили большое количесво ошибок nginx связанных с worker_connections 

```
2024/09/15 12:43:32 [alert] 259727#259727: 768 worker_connections are not enough
```

Увеличили axRequestWorkers

```
MaxRequestWorkers 150 -> MaxRequestWorkers 550
```

Добавили также буферы

```
proxy_buffering on; # по умолчанию
proxy_buffer_size 4k;
proxy_buffers 32 4k; # до 132K + ядерные буфера
proxy_max_temp_file_size 0;
```

Клиент также сообщал такие подробности

```
Если взглянуть на процессы, то видим, что наплодилось более 150 процессов apache2

Ошибка 504 Gateway Time-Out. Приложил показатели сервера.
```

На стороне Apache была таже проблема с достижением лимитов, положительными оказались следующие настройки

```

было
vim /etc/apache2/mods-available/mpm_prefork.conf  
StartServers 5  
MinSpareServers 5  
MaxSpareServers 10  
MaxRequestWorkers 1024  
MaxConnectionsPerChild 0

стало

StartServers 10  
MinSpareServers 10  
MaxSpareServers 20  
ServerLimit 2000  
MaxRequestWorkers 1500  
MaxConnectionsPerChild 10000
```

Если резюмировать то при редактировании статьи через веб сервер идет большое количество коннектов. Веб сервера не успевают все обработать.

Далее так как ограничения повысили, вся нагрузка ложится на mysql

посмотрели SHOW PROCCESSLIST;

видим процессы бесконечно растут

```
| 6294 | admin                | localhost | vokal02_vokal | Query   |   46 | Waiting for table level lock | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6295 | admin                | localhost | vokal02_vokal | Query   |   29 | Waiting for table level lock | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6296 | admin                | localhost | vokal02_vokal | Query   |   26 | Waiting for table level lock | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6297 | admin                | localhost | vokal02_vokal | Query   |   22 | Waiting for table level lock | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6298 | admin                | localhost | vokal02_vokal | Query   |   32 | Waiting for table level lock | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6299 | admin                | localhost | vokal02_vokal | Query   |   19 | Waiting for table level lock | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6301 | admin                | localhost | vokal02_vokal | Query   |    4 | Opening tables               | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6303 | admin                | localhost | vokal02_vokal | Query   |   73 | executing                    | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6304 | admin                | localhost | vokal02_vokal | Sleep   |   73 |                              | NULL                                                                                                 |
| 6305 | admin                | localhost | vokal02_vokal | Query   |   73 | executing                    | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
| 6307 | admin                | localhost | vokal02_vokal | Query   |   73 | executing                    | SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t |
```

Сделали лог медленных запросов проанализирвали через percona-tools

```
# 150ms user time, 10ms system time, 28.94M rss, 34.90M vsz
# Current date: Fri Sep 20 05:31:11 2024
# Hostname: fonogramm3
# Files: /var/log/mysql/mysql-slow.log.1
# Overall: 811 total, 23 unique, 1.08 QPS, 88.99x concurrency ____________
# Time range: 2024-09-18T04:55:17 to 2024-09-18T05:07:46
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time         66652s      2s    168s     82s    159s     54s     84s
# Lock time         44917s       0    159s     55s    151s     56s     52s
# Rows sent          5.92k       0      60    7.48   36.69   11.90    2.90
# Rows examine      37.48M       0 228.27k  47.33k 222.42k  89.89k   11.95
# Query size       396.94k      16   1.15k  501.19  592.07  213.53  537.02

# Profile
# Rank Query ID                      Response time    Calls R/Call   V/M
# ==== ============================= ================ ===== ======== =====
#    1 0x8A2BFDCD9DEA61EDBD2CDFB3... 31009.2110 46.5%   282 109.9617 11.93 SELECT dle_post dle_post_extras
#    2 0x19650673119F178973630FD0... 18449.5609 27.7%   167 110.4764 21.18 SELECT dle_post dle_post_extras dle_post_extras_cats
#    3 0x445E7CAF1536030361A9EFB6...  7528.1039 11.3%    93  80.9474  8.96 SELECT dle_post dle_post_extras_cats dle_post_extras
#    4 0x2430813EE57DC6F686EE6FEA...  5733.1328  8.6%    48 119.4403 11.49 SELECT dle_post dle_post_extras
#    5 0x4990B5047475FA5BE176D77C...   934.2216  1.4%    86  10.8630  3.39 SELECT dle_post
#    9 0x651B55F97FA84879F295756D...   350.2628  0.5%    23  15.2288  6.29 SELECT dle_post dle_post_extras_cats
#   14 0xF07BF8B6438D6CE4DCF8F8EB...   149.8146  0.2%    65   2.3048  0.01 SELECT dle_post dle_post_extras_cats dle_post_extras
# MISC 0xMISC                         2497.3818  3.7%    47  53.1358   0.0 <16 ITEMS>

# Query 1: 11.75 QPS, 1.29kx concurrency, ID 0x8A2BFDCD9DEA61EDBD2CDFB3EB71656E at byte 461774
# Scores: V/M = 11.93
# Time range: 2024-09-18T05:07:22 to 2024-09-18T05:07:46
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         34     282
# Exec time     46  31009s      3s    161s    110s    151s     36s    107s
# Lock time     67  30176s      3s    159s    107s    151s     37s    107s
# Rows sent      4     281       0       1    1.00    0.99    0.06    0.99
# Rows examine   0     281       0       1    1.00    0.99    0.06    0.99
# Query size    38 150.88k     546     548  547.86  537.02       0  537.02
# String:
# Databases    vokal02_vokal
# Hosts        localhost
# Users        admin
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms
# 100ms
#    1s  ##
#  10s+  ################################################################
# Tables
#    SHOW TABLE STATUS FROM `vokal02_vokal` LIKE 'dle_post'\G
#    SHOW CREATE TABLE `vokal02_vokal`.`dle_post`\G
#    SHOW TABLE STATUS FROM `vokal02_vokal` LIKE 'dle_post_extras'\G
#    SHOW CREATE TABLE `vokal02_vokal`.`dle_post_extras`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT p.id, p.autor, p.date, p.short_story, p.full_story, p.xfields, p.title, p.descr, p.keywords, p.category, p.alt_name, p.comm_num, p.allow_comm, p.allow_main, p.approve, p.fixed, p.allow_br, p.symbol, p.tags, p.metatitle, e.news_read, e.allow_rate, e.rating, e.vote_num, e.votes, e.view_edit, e.disable_index, e.related_ids, e.access, e.editdate, e.editor, e.reason, e.user_id, e.disable_search, e.need_pass, e.allow_rss, e.allow_rss_turbo, e.allow_rss_dzen FROM dle_post p LEFT JOIN dle_post_extras e ON (p.id=e.news_id) WHERE  p.id = '35688'\G
```

Конфиг mysql

vim /etc/mysql/mysql.conf.d/mysqld.cnf

```
#
# The MySQL database server configuration file.
#
# One can use all long options that the program supports.
# Run program with --help to get a list of available options and with
# --print-defaults to see which it would actually understand and use.
#
# For explanations see
# http://dev.mysql.com/doc/mysql/en/server-system-variables.html

# Here is entries for some specific programs
# The following values assume you have at least 32M ram

[mysqld]
collation-server = utf8_general_ci
character-set-server = utf8
local-infile=0
default-authentication-plugin=mysql_native_password
innodb_file_per_table = 1
#
# * Basic Settings
#
user            = mysql
# pid-file      = /var/run/mysqld/mysqld.pid
# socket        = /var/run/mysqld/mysqld.sock
# port          = 3306
# datadir       = /var/lib/mysql


# If MySQL is running as a replication slave, this should be
# changed. Ref https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_tmpdir
# tmpdir                = /tmp
#
# Instead of skip-networking the default is now to listen only on
# localhost which is more compatible and is not less secure.
bind-address            = 127.0.0.1
mysqlx-bind-address     = 127.0.0.1
#
# * Fine Tuning
#
key_buffer_size         = 256M
max_allowed_packet      = 64M
# thread_stack          = 256K

# thread_cache_size       = -1

# This replaces the startup script and checks MyISAM tables if needed
# the first time they are touched
myisam-recover-options  = BACKUP

max_connections        = 500
wait_timeout           = 60
# table_open_cache       = 4000

#
# * Logging and Replication
#
# Both location gets rotated by the cronjob.
#
# Log all queries
# Be aware that this log type is a performance killer.
# general_log_file        = /var/log/mysql/query.log
# general_log             = 1
#
# Error log - should be very few entries.
#
log_error = /var/log/mysql/error.log

#
# Here you can see queries with especially long duration
# slow_query_log                = 1
# slow_query_log_file   = /var/log/mysql/mysql-slow.log
# long_query_time = 2
# log-queries-not-using-indexes
#
# The following can be used as easy to replay backup logs or for replication.
# note: if you are setting up a replication slave, see README.Debian about
#       other settings you may need to change.
# server-id             = 1
# log_bin                       = /var/log/mysql/mysql-bin.log
# binlog_expire_logs_seconds    = 2592000
max_binlog_size   = 200M
# binlog_do_db          = include_database_name
# binlog_ignore_db      = include_database_name

```

Поменяли на

```
[mysqld]
# Кодировка
collation-server = utf8_general_ci
character-set-server = utf8
local-infile=0
default-authentication-plugin=mysql_native_password
innodb_file_per_table = 1

# Основные настройки
user            = mysql
bind-address            = 127.0.0.1
mysqlx-bind-address     = 127.0.0.1

# Настройки InnoDB
innodb_buffer_pool_size = 4G
innodb_read_io_threads = 8
innodb_write_io_threads = 8
innodb_thread_concurrency = 16
innodb_log_file_size = 1G
innodb_log_files_in_group = 2
innodb_lock_wait_timeout = 50
innodb_flush_method = O_DIRECT
innodb_buffer_pool_instances = 4

# Настройки кешей и буферов
key_buffer_size = 64M
table_open_cache = 2000
# query_cache_type = 0
# query_cache_size = 0
sort_buffer_size = 4M
thread_cache_size = 100

# Управление соединениями
max_connections = 300
wait_timeout = 120
interactive_timeout = 120

# Логирование
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 1
log_queries_not_using_indexes = 1

# Репликация и бинарные логи
max_binlog_size   = 200M
#server-id             = 1
#log_bin                       = /var/log/mysql/mysql-bin.log
#binlog_expire_logs_seconds    = 2592000
#binlog_do_db          = include_database_name
#binlog_ignore_db      = include_database_name

```

#### **Почему это было сделано:**

- **`innodb_buffer_pool_size = 4G`**: Этот параметр определяет размер буферного пула InnoDB, который используется для кэширования данных и индексов. Увеличение его размера до 4 ГБ позволяет MySQL хранить больше данных в оперативной памяти, что снижает количество операций чтения с диска и ускоряет выполнение запросов.
    
- **`innodb_read_io_threads` и `innodb_write_io_threads` = 8** : Увеличение количества потоков ввода-вывода для чтения и записи улучшает производительность на многоядерных системах, позволяя одновременно обрабатывать больше операций ввода-вывода.
    
- **`innodb_thread_concurrency = 16`**: Этот параметр контролирует количество потоков, которые могут одновременно работать с InnoDB. Значение 16 подходит для серверов с большим количеством ядер процессора, обеспечивая эффективное использование ресурсов.
    
- **`innodb_log_file_size = 1G` и `innodb_log_files_in_group = 2`**: Увеличение размера лог-файлов InnoDB уменьшает частоту их вращения (flush) и повышает производительность записи. Это особенно полезно при высоких нагрузках на запись.
    
- **`innodb_lock_wait_timeout = 50`**: Увеличение времени ожидания блокировки позволяет транзакциям дольше ждать освобождения заблокированных ресурсов, что может снизить количество ошибок блокировок при интенсивных операциях.
    
- **`innodb_flush_method = O_DIRECT`**: Этот параметр предотвращает двойное кэширование данных в буферах ОС и InnoDB, улучшая производительность за счет более эффективного использования памяти.
    
- **`innodb_buffer_pool_instances = 4`**: Разделение буферного пула на несколько экземпляров снижает конкуренцию между потоками и улучшает многопоточную производительность.


- **`key_buffer_size = 64M`**: Поскольку вы используете InnoDB как основной движок хранения, размер кеша ключей для MyISAM таблиц ( `key_buffer_size`) был уменьшен. Это освобождает память для других важных буферов InnoDB.
    
- **`table_open_cache = 2000`**: Увеличение этого значения позволяет MySQL удерживать больше открытых таблиц в кеше, что уменьшает накладные расходы на открытие и закрытие таблиц, особенно при работе с большим количеством таблиц.
    
- **`sort_buffer_size = 4M`**: Этот буфер используется для операций сортировки. Увеличение его размера позволяет более эффективно выполнять сложные сортировки, но следует учитывать, что этот буфер выделяется на каждое соединение, поэтому слишком большое значение может привести к избыточному потреблению памяти при большом количестве одновременных соединений.
    
- **`thread_cache_size = 100`**: Увеличение этого параметра позволяет MySQL быстрее обрабатывать новые соединения за счет повторного использования существующих потоков, что снижает накладные расходы на создание новых потоков.

Управление соединениями

#### **Почему это было сделано:**

- **`max_connections = 300`**: Это значение определяет максимальное количество одновременных подключений к серверу MySQL. Установка этого параметра на 300 позволяет серверу обрабатывать большее количество параллельных запросов без избыточного потребления ресурсов. Однако важно убедиться, что сервер имеет достаточное количество оперативной памяти для поддержки такого количества соединений.
    
- **`wait_timeout` и `interactive_timeout = 120`**: Увеличение этих значений позволяет соединениям дольше оставаться активными, что полезно для долгих операций. Однако слишком большие значения могут привести к увеличению использования ресурсов, поэтому важно найти баланс между производительностью и эффективным использованием памяти.


#### **Почему это было сделано:**

- **`slow_query_log = 1`**: Включение лога медленных запросов позволяет отслеживать и анализировать запросы, которые занимают больше времени, чем заданный порог ( `long_query_time`).
    
- **`long_query_time = 1`**: Установка этого параметра на 1 секунду означает, что все запросы, выполняющиеся дольше одной секунды, будут записываться в медленный лог. Это помогает более детально отслеживать потенциальные проблемы с производительностью.
    
- **`log_queries_not_using_indexes = 1`**: Этот параметр позволяет логировать запросы, которые не используют индексы. Это полезно для выявления и оптимизации запросов, которые могут быть ускорены за счет добавления соответствующих индексов.


#### **Почему это было сделано:**

- **`max_binlog_size = 200M`**: Установка максимального размера бинарных логов позволяет контролировать размер файлов логов и предотвращать их чрезмерный рост. Это особенно важно для управления дисковым пространством и эффективного резервного копирования.
    
- **Оставшиеся параметры закомментированы** : Поскольку вы, возможно, не используете репликацию или бинарные логи в данный момент, эти параметры были закомментированы. Если в будущем понадобится настроить репликацию или включить бинарные логи, их можно будет легко активировать и настроить.

### **Почему изменения улучшили производительность:**

1. **Устранение ошибок конфигурации** : Удаление неподдерживаемых параметров `query_cache_type` и `query_cache_size` позволило MySQL успешно запускаться без ошибок, связанных с некорректными настройками.
    
2. **Оптимизация использования памяти** : Правильное распределение памяти между буферными пулами и кешами позволило более эффективно использовать доступную оперативную память, что снизило нагрузку на систему и уменьшило время выполнения запросов.
    
3. **Увеличение параллелизма** : Настройки, связанные с количеством потоков ввода-вывода и управления потоками, позволили серверу обрабатывать больше одновременных запросов, что увеличило общую пропускную способность.
    
4. **Улучшение логирования и мониторинга** : Включение и настройка медленного лога запросов позволило более эффективно отслеживать и оптимизировать проблемные запросы, что в свою очередь снижает общую нагрузку на сервер.
    
5. **Снижение блокировок таблиц** : Оптимизация настроек InnoDB, таких как размер буферного пула и методы сброса, позволила уменьшить время блокировок и повысить производительность при одновременных операциях.


### **Заключение**

Внесенные изменения в конфигурационный файл `my.cnf` были направлены на оптимизацию использования ресурсов сервера, улучшение параллельной обработки запросов. Это позволило вашему серверу MySQL работать более стабильно и эффективно, снизив нагрузку и устранив проблемы с блокировками таблиц.


После внесения и редактирования больше не генерируются бесконечные запросы из за блокировок 

```
 SHOW PROCESSLIST;
+------+-----------------+-----------+--------+---------+------+------------------------+------------------+
| Id   | User            | Host      | db     | Command | Time | State                  | Info             |
+------+-----------------+-----------+--------+---------+------+------------------------+------------------+
|    5 | event_scheduler | localhost | NULL   | Daemon  |  300 | Waiting on empty queue | NULL             |
|   79 | ispmgr          | localhost | ispmgr | Sleep   |   45 |                        | NULL             |
|   80 | ispmgr          | localhost | ispmgr | Sleep   |   45 |                        | NULL             |
|   81 | ispmgr          | localhost | ispmgr | Sleep   |  225 |                        | NULL             |
|   82 | ispmgr          | localhost | ispmgr | Sleep   |   34 |                        | NULL             |
|  390 | ispmgr          | localhost | ispmgr | Sleep   |  225 |                        | NULL             |
|  391 | ispmgr          | localhost | ispmgr | Sleep   |   45 |                        | NULL             |
| 2281 | root            | localhost | NULL   | Query   |    0 | init                   | SHOW PROCESSLIST |
+------+-----------------+-----------+--------+---------+------+------------------------+------------------+
8 rows in set, 1 warning (0.00 sec)

```


Новый анализ персоны после изменений

```
# 90ms user time, 30ms system time, 28.98M rss, 34.89M vsz
# Current date: Fri Sep 20 06:14:21 2024
# Hostname: fonogramm3
# Files: /var/log/mysql/mysql-slow.log
# Overall: 278 total, 22 unique, 0.70 QPS, 0.01x concurrency _____________
# Time range: 2024-09-20T06:03:51 to 2024-09-20T06:10:28
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time             4s    58us      1s    13ms     5ms   105ms   626us
# Lock time          740us       0    17us     2us     4us     1us     1us
# Rows sent          5.57k       0      60   20.50   59.77   23.99    6.98
# Rows examine     754.74k       0 228.27k   2.71k   1.26k  22.96k   62.76
# Query size        63.46k      32     603  233.73  563.87  127.40  212.52

# Profile
# Rank Query ID                        Response time Calls R/Call V/M   It
# ==== =============================== ============= ===== ====== ===== ==
#    1 0x19650673119F178973630FD07E...  3.1090 87.3%     3 1.0363  0.01 SELECT dle_post dle_post_extras dle_post_extras_cats
#    2 0x651B55F97FA84879F295756D0D...  0.2044  5.7%   138 0.0015  0.00 SELECT dle_post dle_post_extras_cats
#    3 0x1F18CE45F7AB14058C0B37FF1E...  0.1677  4.7%     5 0.0335  0.13 SELECT dle_post dle_post_extras_cats dle_post_extras
# MISC 0xMISC                           0.0783  2.2%   132 0.0006   0.0 <19 ITEMS>

# Query 1: 0.06 QPS, 0.06x concurrency, ID 0x19650673119F178973630FD07ECA56E4 at byte 57443
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.01
# Time range: 2024-09-20T06:07:16 to 2024-09-20T06:08:07
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1       3
# Exec time     87      3s   977ms      1s      1s      1s    89ms   945ms
# Lock time      0     5us     1us     2us     1us     1us       0     1us
# Rows sent      0      30      10      10      10      10       0      10
# Rows examine  90 684.82k 228.27k 228.27k 228.27k 228.27k       0 228.27k
# Query size     2   1.73k     590     590     590     590       0     590
# String:
# Databases    vokal02_vokal
# Hosts        localhost
# Users        admin
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms
# 100ms  ################################################################
#    1s  ################################
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `vokal02_vokal` LIKE 'dle_post'\G
#    SHOW CREATE TABLE `vokal02_vokal`.`dle_post`\G
#    SHOW TABLE STATUS FROM `vokal02_vokal` LIKE 'dle_post_extras'\G
#    SHOW CREATE TABLE `vokal02_vokal`.`dle_post_extras`\G
#    SHOW TABLE STATUS FROM `vokal02_vokal` LIKE 'dle_post_extras_cats'\G
#    SHOW CREATE TABLE `vokal02_vokal`.`dle_post_extras_cats`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.title, p.descr, p.keywords, p.category, p.alt_name, p.comm_num, p.allow_comm, p.allow_main, p.approve, p.fixed, p.symbol, p.tags, e.news_read, e.allow_rate, e.rating, e.vote_num, e.votes, e.view_edit, e.disable_index, e.editdate, e.editor, e.reason FROM dle_post p LEFT JOIN dle_post_extras e ON (p.id=e.news_id)  WHERE p.id NOT IN ( SELECT DISTINCT(dle_post_extras_cats.news_id) FROM dle_post_extras_cats WHERE cat_id IN ('3548','3541','7') ) AND approve=1 ORDER BY news_read ASC LIMIT 0,10\G

# Query 2: 0.35 QPS, 0.00x concurrency, ID 0x651B55F97FA84879F295756D0D5656F9 at byte 65406
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.00
# Time range: 2024-09-20T06:03:51 to 2024-09-20T06:10:20
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         49     138
# Exec time      5   204ms   281us    14ms     1ms     6ms     2ms   925us
# Lock time     60   446us     1us    10us     3us     4us     1us     2us
# Rows sent     91   5.07k       1      60   37.60   59.77   22.64   42.48
# Rows examine   7  56.99k       3   3.83k  422.91   2.62k  748.83  158.58
# Query size    46  29.25k     215     225  217.07  212.52    1.55  212.52
# String:
# Databases    vokal02_vokal
# Hosts        localhost
# Users        admin
# Query_time distribution
#   1us
#  10us
# 100us  ################################################################
#   1ms  #######################################################
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `vokal02_vokal` LIKE 'dle_post'\G
#    SHOW CREATE TABLE `vokal02_vokal`.`dle_post`\G
#    SHOW TABLE STATUS FROM `vokal02_vokal` LIKE 'dle_post_extras_cats'\G
#    SHOW CREATE TABLE `vokal02_vokal`.`dle_post_extras_cats`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT p.id FROM dle_post p INNER JOIN (SELECT DISTINCT(dle_post_extras_cats.news_id) FROM dle_post_extras_cats WHERE cat_id IN ('309')) c ON (p.id=c.news_id) WHERE approve=1 ORDER BY fixed desc, title ASC LIMIT 360,60\G

```

как видно запросов более 10 секунд стало значительно меньше, большая часть запросов 100us 1ms, хотя медленные запросы еще остаются.



# Отчет об оптимизации сервера

## Содержание
1. [Спецификация сервера](#спецификация-сервера)
2. [Первоначальное описание проблемы](#первоначальное-описание-проблемы)
3. [Исследование и результаты](#исследование-и-результаты)
4. [Выполненные оптимизации](#выполненные-оптимизации)
   - [Настройка Nginx](#настройка-nginx)
   - [Настройка Apache](#настройка-apache)
   - [Настройка MySQL](#настройка-mysql)
5. [Результаты и анализ](#результаты-и-анализ)
6. [Заключение](#заключение)

## Спецификация сервера

- **Тариф**: Cloud 2-8-1000
- **CPU**: 2 ядра
- **ОЗУ**: 8 ГБ
- **Диск**: 10000 ГБ
- **ОС**: Ubuntu 22.04
- **Панель управления**: ISP Manager
- **Дополнительное ПО**: Redis, OPcache
- **Сайт**: http://***gramm.pro/

## Первоначальное описание проблемы

Сервер испытывал серьезные проблемы с производительностью, особенно когда администраторы добавляли или редактировали новости. Симптомы включали:

1. Резкое увеличение количества процессов
2. Высокое использование CPU и ОЗУ
3. Недоступность сайта
4. Необходимость принудительной перезагрузки для восстановления функциональности

Проблемы были наиболее выражены при сохранении новостей, особенно содержащих аудио контент.

## Исследование и результаты

### Процессы Apache
- Большое количество процессов Apache (более 150) создавалось во время создания или редактирования статей.
- Эти процессы вызывали истощение ресурсов.

### Анализ MySQL
- `SHOW PROCESSLIST` показал постоянно увеличивающееся количество процессов MySQL.
- Многие процессы находились в состоянии "Waiting for table level lock".
- Один и тот же запрос выполнялся многократно одновременно:
  ```sql
  SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.t ...
  ```

### Анализ медленных запросов
Первоначальный анализ с использованием Percona Toolkit показал:
- 811 запросов всего, 23 уникальных
- 1.08 QPS (запросов в секунду)
- 88.99x конкурентность
- Запрос с наивысшим рейтингом (46.5% времени отклика):
  ```sql
  SELECT p.id, p.autor, p.date, p.short_story, CHAR_LENGTH(p.full_story) as full_story, p.xfields, p.title, p.descr, p.keywords, p.category, p.alt_name, p.comm_num, p.allow_comm, p.allow_main, p.approve, p.fixed, p.allow_br, p.symbol, p.tags, p.metatitle, e.news_read, e.allow_rate, e.rating, e.vote_num, e.votes, e.view_edit, e.disable_index, e.related_ids, e.access, e.editdate, e.editor, e.reason, e.user_id, e.disable_search, e.need_pass, e.allow_rss, e.allow_rss_turbo, e.allow_rss_dzen FROM dle_post p LEFT JOIN dle_post_extras e ON (p.id=e.news_id) WHERE p.id = '35688'
  ```

## Выполненные оптимизации

### Настройка Nginx
- Увеличено `worker_connections` для решения ошибки "768 worker_connections are not enough".
- Добавлены настройки буферизации:
  ```nginx
  proxy_buffering on;
  proxy_buffer_size 4k;
  proxy_buffers 32 4k;
  proxy_max_temp_file_size 0;
  ```

### Настройка Apache
Изменен файл `/etc/apache2/mods-available/mpm_prefork.conf`:

```apache
StartServers 10
MinSpareServers 10
MaxSpareServers 20
ServerLimit 2000
MaxRequestWorkers 1500
MaxConnectionsPerChild 10000
```

### Настройка MySQL
Обновлен файл `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Настройки InnoDB
innodb_buffer_pool_size = 4G
innodb_read_io_threads = 8
innodb_write_io_threads = 8
innodb_thread_concurrency = 16
innodb_log_file_size = 1G
innodb_log_files_in_group = 2
innodb_lock_wait_timeout = 50
innodb_flush_method = O_DIRECT
innodb_buffer_pool_instances = 4

# Настройки кеша и буферов
key_buffer_size = 64M
table_open_cache = 2000
sort_buffer_size = 4M
thread_cache_size = 100

# Управление соединениями
max_connections = 300
wait_timeout = 120
interactive_timeout = 120

# Логирование
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 1
log_queries_not_using_indexes = 1

# Бинарное логирование
max_binlog_size = 200M
```

## Результаты и анализ

После внедрения оптимизаций:

1. Проблема с бесконечной генерацией запросов из-за блокировок таблиц была решена.
2. Вывод `SHOW PROCESSLIST` показал значительное сокращение количества одновременных процессов:
   ```
   +------+-----------------+-----------+--------+---------+------+------------------------+------------------+
   | Id   | User            | Host      | db     | Command | Time | State                  | Info             |
   +------+-----------------+-----------+--------+---------+------+------------------------+------------------+
   |    5 | event_scheduler | localhost | NULL   | Daemon  |  300 | Waiting on empty queue | NULL             |
   |   79 | ispmgr          | localhost | ispmgr | Sleep   |   45 |                        | NULL             |
   |   80 | ispmgr          | localhost | ispmgr | Sleep   |   45 |                        | NULL             |
   |   81 | ispmgr          | localhost | ispmgr | Sleep   |  225 |                        | NULL             |
   |   82 | ispmgr          | localhost | ispmgr | Sleep   |   34 |                        | NULL             |
   |  390 | ispmgr          | localhost | ispmgr | Sleep   |  225 |                        | NULL             |
   |  391 | ispmgr          | localhost | ispmgr | Sleep   |   45 |                        | NULL             |
   | 2281 | root            | localhost | NULL   | Query   |    0 | init                   | SHOW PROCESSLIST |
   +------+-----------------+-----------+--------+---------+------+------------------------+------------------+
   ```

3. Новый анализ Percona Toolkit показал:
   - Уменьшение общего количества запросов (278 против 811 ранее)
   - Снижение QPS (0.70 против 1.08 ранее)
   - Значительное снижение конкурентности (0.01x против 88.99x ранее)
   - Большинство запросов теперь выполняются в диапазоне от 100мкс до 1мс

## Заключение

Внедренные оптимизации значительно улучшили производительность и стабильность сервера:

1. **Управление ресурсами**: Улучшено распределение памяти и ресурсов CPU между Nginx, Apache и MySQL.
2. **Обработка параллельных запросов**: Повышена способность обрабатывать одновременные запросы без перегрузки сервера.
3. **Оптимизация базы данных**: Настройки MySQL улучшили производительность запросов и уменьшили время блокировок.
4. **Мониторинг**: Улучшены возможности отслеживания проблемных запросов для дальнейшей оптимизации.

Рекомендуется продолжать мониторинг производительности сервера и при необходимости выполнять дальнейшие оптимизации.