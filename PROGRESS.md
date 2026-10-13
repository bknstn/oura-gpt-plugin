# Прогресс Oura AI Connector

**Обновлено:** 2026-10-13 (Europe/Warsaw).  
**Исполнитель:** `gpt-6-luna`, reasoning `xhigh`.  
**Ревьюер:** основной агент текущего чата.  
**Текущая задача:** T2, первая итерация: выбор OAuth intermediary и подготовка account linking.
**Следующий шаг:** основной агент ревьюит ADR 0002, runbook и официальные источники, затем сохраняет решение. Исполнитель не начинает следующую T2-итерацию до дальнейшего поручения. Реальный connect/Oura-сценарий не проверен; перед использованием реальных данных нужно разрешить контрактный вопрос Oura и пройти OAuth gates.

| Задача | Состояние | Ревью |
| --- | --- | --- |
| T1 | done | принято основным агентом, 2026-10-13 |
| T2 | needs_review | первая документационная итерация, provider candidate + linking runbook |
| T3 | queued | — |
| T4 | queued | — |
| T5 | queued | — |

Состояния: `queued`, `in_progress`, `needs_review`, `blocked`, `done`. `done` выставляет только ревьюер.

## Активная точка восстановления

- 2026-10-13, старт первой итерации T2 по поручению «Продолжи по PROGRESS.md»: прочитаны `AGENTS.md`, `TASKS.md`, журнал, ADR, README и каркас; сверены Git status/log/diff. Baseline — `dfb6127`, рабочее дерево до записи старта чистое. Фактические параметры нового исполнителя: `gpt-6-luna`, `reasoning_effort=xhigh`, один исполнитель текущего чата; основной агент — планировщик/ревьюер. Ближайший шаг — документационно проверенный выбор готового intermediary и воспроизводимые настройки/linking flow. Деплой, расходы, создание внешних аккаунтов и реальные OAuth проверки в эту итерацию не входят.

- 2026-10-13, первая итерация T2 подготовлена к ревью: [ADR 0002](docs/adr/0002-auth-intermediary-and-oura-linking.md) условно выбирает Auth0 Auth for MCP для integration spike и сравнивает его со Stytch; [runbook](docs/runbooks/auth0-oura-linking.md) содержит placeholders, Auth0/Oura setup, отдельный account-link flow и несентированный запрос в Oura. Oura scopes разделены: `daily` для T2; `heartrate` и `workout` только для соответствующих инструментов полного MVP. В [ADR 0001](docs/adr/0001-oauth-boundary.md) и README добавлены ссылки на уточнение границ.
- Текущая Oura support статья, обновлённая 2026-10-01, направляет создание новых приложений в `developer.ouraring.com`, а прежний Cloud портал оставляет для редактирования существующих приложений. Лимит 10 users на legacy Getting started странице отмечен как claim для проверки в новом портале, а не как подтверждённый текущий предел.
- В официальном Oura API and MCP Agreement (effective 2026-06-08) §4(d) ограничивает LLM-путь non-Aggregator использованием Oura-operated MCP и запрещает применять Oura API для подачи данных AI Model/AI Platform; текущий API → custom MCP → ChatGPT план выглядит затронутым. Это inference о нашем planned flow, не юридическое заключение. §2(a)(i) и, при возможной классификации Aggregator, §§2(c–d), 3(e–f) требуют внешнего уточнения. По проектному gate real-data тесты отложены до прояснения допустимого маршрута; OAuth-техническая совместимость и договорная допустимость — независимые gates.
- Проверенные официальные источники OpenAI, Auth0, Stytch и Oura перечислены в ADR 0002. Auth0 docs подтверждают настройки resource compatibility и authorization-response `iss`, но не доказывают exact ChatGPT code/token resource/audience flow, `iss` на error response, связь `sub` между clients или Oura single-use refresh handling в Token Vault. Поэтому Auth0 остаётся кандидатом, а не проверенным провайдером.
- Первый документационный checkpoint сохранён коммитом `2f71427` (`feat(T2): document conditional Auth0 candidate`). После независимого review добавлены: явные настройки Regular Web Application и третьего callback для account linking; пошаговый manual CIMD import с grant только `oura:daily.read`; проверка приоритета Auth0 `audience` над `resource` с negative case; session/identity binding и link-generation/token-version guards для устаревших callbacks и refreshes.
- Проверки этой итерации: `git diff --check` — PASS после удаления двух trailing spaces; runtime code не менялся. `npm test` был запущен основным агентом в этой итерации и завершился PASS; исполнитель не повторял тест. Отдельные временные scripts/probes/scratch-файлы не создавались.
- Ограничения: нет Auth0 tenant, Oura application credentials, публичного HTTPS домена или ChatGPT development connection; нет live проверки callback, resource/audience, PKCE, subject isolation, refresh rotation и downstream scope grants. Заявки и сообщения не отправлялись; аккаунты и deploy не создавались.
- Статус первой итерации — `needs_review`; T2 не принята и критерии `TASKS.md` не менялись. Точный следующий шаг: основной агент повторно ревьюит текущие документы и источники, затем фиксирует решение отдельным коммитом; следующую T2 итерацию запускать только по дальнейшему поручению пользователя.

- Исходный baseline: `56789b3`; до T1 рабочее дерево было чистым. Исполнитель — GPT 6 Luna (`gpt-6-luna`, `xhigh`), единственный автор реализации; основной агент выполняет ревью.
- ADR [0001](docs/adr/0001-oauth-boundary.md) проверен по официальным источникам OpenAI, Oura, MCP и MCP TypeScript SDK, включая текущую опубликованную MCP authorization specification `2026-07-28`. Решение T1: не принимать и не передавать Oura access token как MCP token; до user-data tools выбрать посредника, выпускающего отдельный MCP-audience token. Конкретный provider не выбран; собственная auth-система не создавалась.
- Каркас: TypeScript HTTP server с `/mcp` и `/health`, только loopback bind, проверки SDK для Host/Origin, один synthetic-only tool `get_synthetic_sleep_demo`, конфигурация только `HOST`/`PORT` без секретов. README описывает запуск и границы.
- Зафиксированы точные версии и lockfile: MCP server/client `2.3.1`, Node adapter `2.1.1`, `tsx` `4.23.15` и остальные direct dependencies в `package.json`/`package-lock.json`.
- Выполненные проверки, все успешны: `npm run build`; `npm run typecheck`; `npm test`; `npm audit --audit-level=moderate` (`found 0 vulnerabilities`). Smoke запускает локальный сервер на ephemeral loopback port, проверяет health, Host/Origin rejection (403), отказ `HOST=0.0.0.0`, legacy initialize и pinned `2026-07-28` discovery с проверкой protocol era, затем вызывает синтетический tool настоящим SDK client.
- Подтверждено только локальной проверкой и документацией. Не проведены: настройка/проверка выбранного OAuth intermediary, Oura app authorization и scopes, ChatGPT connection/callback, refresh concurrency и account isolation, HTTPS deployment, reviewer access/demo. Credentials, реальные health payloads, токены и публичный домен не использовались; reviewer path с синтетическими upstream данными требует реального подтверждения.
- Cleanup: отдельные временные скрипты, probes или scratch-файлы не создавались. `scripts/protocol-smoke.mjs` — постоянный deliverable; `dist/` и `node_modules/` — игнорируемые build/dependency артефакты.
- T1 принята по границе `TASKS.md`: документация + локальный каркас. Это не подтверждение реального OAuth/ChatGPT подключения. Первая итерация T2 запущена; T3–T5 ещё не запущены.
- При следующем возобновлении: сверить `git status --short` и `git log`; сначала завершить ревью T2 первой итерации `needs_review`. После ревью следующую итерацию T2 запускать только по дальнейшему поручению пользователя; T3–T5 остаются queued.

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
