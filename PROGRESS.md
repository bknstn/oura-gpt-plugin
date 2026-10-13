# Прогресс Oura AI Connector

**Обновлено:** 2026-10-13 (Europe/Warsaw).  
**Исполнитель:** `gpt-6-luna`, reasoning `xhigh`.  
**Ревьюер:** основной агент текущего чата.  
**Текущая задача:** T1 принята; следующая — T2 (ещё не запущена).
**Следующий шаг:** по следующему поручению «продолжи по PROGRESS.md» поручить Luna xhigh первую итерацию T2: выбрать минимальный готовый OAuth intermediary по контракту ADR, подготовить схему account linking и конфигурацию Oura application/callback. До получения необходимых внешних доступов не объявлять реальный connect/Oura-сценарий проверенным.

| Задача | Состояние | Ревью |
| --- | --- | --- |
| T1 | done | принято основным агентом, 2026-10-13 |
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
- T1 принята по границе `TASKS.md`: документация + локальный каркас. Это не подтверждение реального OAuth/ChatGPT подключения. T2–T5 ещё не запущены.
- При возобновлении: сверить `git status --short` и `git log`, прочитать ADR, поднять исполнителя `gpt-6-luna`/`xhigh` для T2. Ближайший независимый шаг — сравнить готовые auth-варианты с MCP контрактом и подготовить конкретную конфигурацию/linking flow; затем указать необходимые Oura application settings, provider, callback/domain и способ внесения secrets вне чата/Git.

## Ревью T1 — 2026-10-13

- Проверен implementation diff `56789b3..9df9a47`: MCP transport/server, loopback/Host/Origin guards, синтетический output, конфигурация и логирование, package/lockfile, README и ADR. Исходный продуктовый план не изменён. Замечаний, блокирующих приёмку T1, нет.
- Основной агент независимо сверил MCP authorization/token boundary по официальным OpenAI/Oura/MCP источникам; документация ADR явно отделяет установленные требования от непроведённых реальных проверок.
- По промежуточному ревью Luna уточнила актуальную версию MCP `2026-07-28`, добавила проверки Host/Origin и публичного bind, заменила protocol auto/fallback на pinned modern negotiation, исправила advisory в dev-зависимости `tsx`.
- Независимая проверка ревьюера: `npm test` — PASS (TypeScript build, health, Host/Origin 403, loopback-only bind, legacy initialize, pinned `2026-07-28` discovery, synthetic tool list/call); `git diff --check 56789b3..9df9a47` — clean. Typecheck и audit (0 vulnerabilities) дополнительно подтверждены checkpoint-результатами исполнителя.
- Решение: **T1 → done**. Все критерии T1 выполнены; внешние OAuth/Oura/ChatGPT/reviewer/deployment проверки остаются частью следующих задач.
- Cleanup ревьюера: временные scripts/helper/scratch-файлы не создавались; протокольный тест завершился и закрыл свои дочерние процессы. Постоянные тест, код, зависимости и build-артефакты сохранены.

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
