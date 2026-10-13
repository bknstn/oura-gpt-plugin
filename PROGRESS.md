# Прогресс Oura AI Connector

**Обновлено:** 2026-10-13 (Europe/Warsaw).  
**Исполнитель:** `gpt-6-luna`, reasoning `xhigh`.  
**Ревьюер:** основной агент текущего чата.  
**Текущая задача:** T1 — архитектура и каркас.
**Следующий шаг:** ревьюер проверяет T1 и фиксирует решение. До отдельного поручения T2–T5 не запускать.

| Задача | Состояние | Ревью |
| --- | --- | --- |
| T1 | needs_review | ожидается |
| T2 | queued | — |
| T3 | queued | — |
| T4 | queued | — |
| T5 | queued | — |

Состояния: `queued`, `in_progress`, `needs_review`, `blocked`, `done`. `done` выставляет только ревьюер.

## Активная точка восстановления

- Исходный baseline: `56789b3`; до T1 рабочее дерево было чистым. Исполнитель — GPT 6 Luna (`gpt-6-luna`, `xhigh`), единственный автор реализации; основной агент выполняет ревью.
- ADR [0001](docs/adr/0001-oauth-boundary.md) проверен по официальным источникам OpenAI, Oura, MCP и MCP TypeScript SDK, включая текущую опубликованную MCP authorization specification `2026-07-28`. Решение T1: не принимать и не передавать Oura access token как MCP token; до user-data tools выбрать посредника, выпускающего отдельный MCP-audience token. Конкретный provider не выбран; собственная auth-система не создавалась.
- Каркас: TypeScript HTTP server с `/mcp` и `/health`, только loopback bind, проверки SDK для Host/Origin, один synthetic-only tool `get_synthetic_sleep_demo`, конфигурация только `HOST`/`PORT` без секретов. README описывает запуск и границы.
- Зафиксированы точные версии и lockfile: MCP server/client `2.3.1`, Node adapter `2.1.1`, `tsx` `4.23.15` и остальные direct dependencies в `package.json`/`package-lock.json`.
- Выполненные проверки, все успешны: `npm run build`; `npm run typecheck`; `npm test`; `npm audit --audit-level=moderate` (`found 0 vulnerabilities`). Smoke запускает локальный сервер на ephemeral loopback port, проверяет health, Host/Origin rejection (403), отказ `HOST=0.0.0.0`, legacy initialize и pinned `2026-07-28` discovery с проверкой protocol era, затем вызывает синтетический tool настоящим SDK client.
- Подтверждено только локальной проверкой и документацией. Не проведены: настройка/проверка выбранного OAuth intermediary, Oura app authorization и scopes, ChatGPT connection/callback, refresh concurrency и account isolation, HTTPS deployment, reviewer access/demo. Credentials, реальные health payloads, токены и публичный домен не использовались; reviewer path с синтетическими upstream данными требует реального подтверждения.
- Cleanup: отдельные временные скрипты, probes или scratch-файлы не создавались. `scripts/protocol-smoke.mjs` — постоянный deliverable; `dist/` и `node_modules/` — игнорируемые build/dependency артефакты.
- Точный следующий шаг: ревьюеру проверить T1 diff и критерии в `TASKS.md`, затем внести решение отдельным checkpoint. В этом поручении T1 не отмечать `done`, T2–T5 не начинать.

## Журнал T1

- Сверены OpenAI требования к MCP OAuth/reviewer access, Oura PKCE/scopes/single-use refresh tokens, текущий MCP token audience и запрет token passthrough. Источники, даты и границы доказательств приведены в ADR.
- Зафиксировано, что Oura docs не подтверждают поддержку MCP resource/audience/discovery; это неизвестность, а не вывод о невозможности. Будущему refresh нужны атомарная ротация и single-flight/concurrency control.
- Добавлен local-only TypeScript MCP scaffold, pinned SDK/client dependencies, lockfile, `.env.example`, README и meaningful protocol smoke. Smoke-tool возвращает только явно синтетическую запись, не Oura fixture.
- npm первоначально сообщил advisory в старой транзитивной цепочке `tsx@4.16.5`/`esbuild`; `tsx` обновлён до `4.23.15`, повторный audit — 0 vulnerabilities.
- Последние implementation checkpoints перед передачей: `074ea66` (обновление `tsx`), `08e9971` (границы Host/Origin/bind и protocol-era smoke). Предшествующие ADR/scaffold checkpoints перечислены в `git log`.

## История подготовки очереди

### 2026-10-13 — подготовка задач

- Исходный план разделён на пять последовательных задач с критериями приёмки; оригинал `oura-ai-connector-mvp.md` сохранён.
- Зафиксированы исполнитель Luna xhigh, независимое ревью и checkpoint после небольших законченных шагов.
- Перед началом T1 прочитаны `AGENTS.md`, `TASKS.md`, `PROGRESS.md` и исходный план; baseline commit — `56789b3`.
