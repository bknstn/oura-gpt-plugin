# Прогресс Oura AI Connector

**Обновлено:** 2026-10-13 (Europe/Warsaw).  
**Исполнитель:** `gpt-6-luna`, reasoning `xhigh`.  
**Ревьюер:** основной агент текущего чата.  
**Текущая задача:** T2, первая документационная итерация принята; OAuth runtime и реальный сценарий ещё не реализованы.
**Следующий шаг:** по дальнейшему поручению продолжить T2 на Luna xhigh с проверки официально доступного Oura-operated MCP пути и его соответствия сценарию/критериям. Если документы не разрешают текущий API → custom MCP → ChatGPT маршрут, нужен ответ Oura на подготовленный в runbook запрос; отправка запроса требует отдельного поручения. До подтверждения допустимой архитектуры не запускать real-data тесты. Auth0 остаётся условным кандидатом и требует отдельных entitlement, scope и protocol gates.

| Задача | Состояние | Ревью |
| --- | --- | --- |
| T1 | done | принято основным агентом, 2026-10-13 |
| T2 | in_progress | первая итерация принята, 2026-10-13; внешние gates открыты |
| T3 | queued | — |
| T4 | queued | — |
| T5 | queued | — |

Состояния: `queued`, `in_progress`, `needs_review`, `blocked`, `done`. `done` выставляет только ревьюер.

## Активная точка восстановления

- 2026-10-13, старт первой итерации T2 по поручению «Продолжи по PROGRESS.md»: прочитаны `AGENTS.md`, `TASKS.md`, журнал, ADR, README и каркас; сверены Git status/log/diff. Baseline — `dfb6127`, рабочее дерево до записи старта чистое. Фактические параметры нового исполнителя: `gpt-6-luna`, `reasoning_effort=xhigh`, один исполнитель текущего чата; основной агент — планировщик/ревьюер. Ближайший шаг — документационно проверенный выбор готового intermediary и воспроизводимые настройки/linking flow. Деплой, расходы, создание внешних аккаунтов и реальные OAuth проверки в эту итерацию не входят.

- 2026-10-13, первая итерация T2 подготовлена к ревью: [ADR 0002](docs/adr/0002-auth-intermediary-and-oura-linking.md) условно выбирает Auth0 Auth for MCP для integration spike и сравнивает его со Stytch; [runbook](docs/runbooks/auth0-oura-linking.md) содержит placeholders, Auth0/Oura setup, отдельный account-link flow и неотправленный запрос в Oura. Oura scopes разделены: `daily` для T2; `heartrate` и `workout` только для соответствующих инструментов полного MVP. В [ADR 0001](docs/adr/0001-oauth-boundary.md) и README добавлены ссылки на уточнение границ.
- Текущая Oura support статья, обновлённая 2026-10-01, направляет создание новых приложений в `developer.ouraring.com`, а прежний Cloud портал оставляет для редактирования существующих приложений. Лимит 10 users на legacy Getting started странице отмечен как claim для проверки в новом портале, а не как подтверждённый текущий предел.
- В официальном Oura API and MCP Agreement (effective 2026-06-08) §4(d) ограничивает LLM-путь non-Aggregator использованием Oura-operated MCP и запрещает применять Oura API для подачи данных AI Model/AI Platform; текущий API → custom MCP → ChatGPT план выглядит затронутым. Это inference о нашем planned flow, не юридическое заключение. §2(a)(i) и, при возможной классификации Aggregator, §§2(c–d), 3(e–f) требуют внешнего уточнения. По проектному gate real-data тесты отложены до прояснения допустимого маршрута; OAuth-техническая совместимость и договорная допустимость — независимые gates.
- Проверенные официальные источники OpenAI, Auth0, Stytch и Oura перечислены в ADR 0002. Auth0 docs подтверждают настройки resource compatibility и authorization-response `iss`, но не доказывают exact ChatGPT code/token resource/audience flow, `iss` на error response, связь `sub` между clients, совместимость автоматически запрашиваемых ChatGPT OIDC scopes со strict third-party Auth0 clients, выбор CIMD token endpoint method/entitlement или Oura single-use refresh handling в Token Vault. Поэтому Auth0 остаётся кандидатом, а не проверенным провайдером.
- Первый документационный checkpoint сохранён коммитом `2f71427` (`feat(T2): document conditional Auth0 candidate`), review fixes — `cfb1eab` (`fix(T2): tighten OAuth linking gates`). Зафиксированы явные настройки Regular Web Application и callbacks, manual CIMD import с grant только `oura:daily.read`, audience/resource negative case и защита link/refresh поколениями. Дополнительно документированы Enterprise entitlement gate для CIMD `private_key_jwt` (без покупки/upgrade) и live OIDC-scope compatibility gate; `none` и scope omission не предполагаются автоматически.
- Проверки этой итерации: `git diff --check` — PASS после удаления двух trailing spaces; runtime code не менялся. `npm test` был запущен основным агентом в этой итерации и завершился PASS; исполнитель не повторял тест. Отдельные временные scripts/probes/scratch-файлы не создавались.
- Ограничения: нет Auth0 tenant, подтверждённого CIMD plan entitlement/method mapping, Oura application credentials, публичного HTTPS домена или ChatGPT development connection; нет live проверки discovery scopes/auth request, callback, resource/audience, PKCE, subject isolation, refresh rotation и downstream scope grants. Не создавались и не покупались аккаунты/планы; заявки и сообщения не отправлялись; deploy не выполнялся.
- Первая итерация прошла стадии `needs_review` и исправлений; ревьюер принял документационные артефакты после checkpoint `bf40a64`. T2 целиком не принята: критерии реального подключения/данных/refresh/isolation ещё не выполнены, `TASKS.md` не менялся. Следующую T2 итерацию запускать только по дальнейшему поручению пользователя, начиная с допустимого Oura data route.

- Исходный baseline: `56789b3`; до T1 рабочее дерево было чистым. Исполнитель — GPT 6 Luna (`gpt-6-luna`, `xhigh`), единственный автор реализации; основной агент выполняет ревью.
- ADR [0001](docs/adr/0001-oauth-boundary.md) проверен по официальным источникам OpenAI, Oura, MCP и MCP TypeScript SDK, включая текущую опубликованную MCP authorization specification `2026-07-28`. Решение T1: не принимать и не передавать Oura access token как MCP token; до user-data tools выбрать посредника, выпускающего отдельный MCP-audience token. Конкретный provider не выбран; собственная auth-система не создавалась.
- Каркас: TypeScript HTTP server с `/mcp` и `/health`, только loopback bind, проверки SDK для Host/Origin, один synthetic-only tool `get_synthetic_sleep_demo`, конфигурация только `HOST`/`PORT` без секретов. README описывает запуск и границы.
- Зафиксированы точные версии и lockfile: MCP server/client `2.3.1`, Node adapter `2.1.1`, `tsx` `4.23.15` и остальные direct dependencies в `package.json`/`package-lock.json`.
- Выполненные проверки, все успешны: `npm run build`; `npm run typecheck`; `npm test`; `npm audit --audit-level=moderate` (`found 0 vulnerabilities`). Smoke запускает локальный сервер на ephemeral loopback port, проверяет health, Host/Origin rejection (403), отказ `HOST=0.0.0.0`, legacy initialize и pinned `2026-07-28` discovery с проверкой protocol era, затем вызывает синтетический tool настоящим SDK client.
- Подтверждено только локальной проверкой и документацией. Не проведены: настройка/проверка выбранного OAuth intermediary, Oura app authorization и scopes, ChatGPT connection/callback, refresh concurrency и account isolation, HTTPS deployment, reviewer access/demo. Credentials, реальные health payloads, токены и публичный домен не использовались; reviewer path с синтетическими upstream данными требует реального подтверждения.
- Cleanup: отдельные временные скрипты, probes или scratch-файлы не создавались. `scripts/protocol-smoke.mjs` — постоянный deliverable; `dist/` и `node_modules/` — игнорируемые build/dependency артефакты.
- T1 принята по границе `TASKS.md`: документация + локальный каркас. Это не подтверждение реального OAuth/ChatGPT подключения. Первая итерация T2 запущена; T3–T5 ещё не запущены.
- При следующем возобновлении: сверить `git status --short` и `git log`, прочитать ADR 0002/runbook и поднять Luna xhigh для следующего шага T2, указанного в начале журнала. Ревью первой итерации завершено; T3–T5 остаются queued.

## Ревью первой итерации T2 — 2026-10-13

- Проверен весь diff `dfb6127..bf40a64`: ADR 0002, provider-specific runbook, уточнения ADR 0001/README и журнал. Реализация выполнена единственным исполнителем `gpt-6-luna`/`xhigh`; основной агент не менял runtime. Checkpoints: `2f71427`, `cfb1eab`, `bf40a64`. Посторонние файлы, критерии `TASKS.md`, исходный продуктовый план и зависимости не менялись.
- Основной агент независимо открыл официальные источники OpenAI, MCP, Oura, Auth0 и Stytch. Подтверждены документированные настройки Auth0 resource/issuer/CIMD и ограничения strict third-party clients, Enterprise-only `private_key_jwt`, автоматический запрос OIDC scopes со стороны ChatGPT, отдельные Oura OAuth scopes и single-use refresh. Эти источники не доказывают live совместимость выбранного пути; Auth0 принят только как кандидат для проверки.
- Luna исправила замечания ревью: актуальный портал Oura и неподтверждённый legacy user limit; три разных callbacks и настройки first-party web client; manual CIMD import/per-client grant; приоритет `audience` и negative case; session/identity binding и fencing старых callbacks/refresh после disconnect/relink; entitlement и OIDC-scope compatibility gates. Блокирующих замечаний к документационной итерации больше нет.
- Новый существенный внешний вопрос: §4(d) действующего [Oura API and MCP Agreement](https://cloud.ouraring.com/legal/api-agreement) ограничивает API → AI data route, а договорный MCP Server определён как Oura-operated. Вывод о конфликте с нашим планом явно отделён от текста источника. Подготовлен неотправленный запрос для уточнения допустимого пути/исключения и возможной Aggregator-классификации. Подтверждения от Oura нет; текущая архитектура не объявлена разрешённой или рабочей.
- Независимые проверки ревьюера: `npm test` — PASS в этой итерации (build и полный локальный protocol/security smoke); `git diff --check dfb6127..bf40a64` — PASS; inline-проверка относительных Markdown links — PASS (11 локальных целей). Runtime не менялся, повторный запуск тестов после документационных исправлений не требовался. Перед записью ревью Git status был чистым.
- Решение: **первая документационная итерация T2 принята; T2 остаётся `in_progress`, не `done`**. Нет Oura application/credentials, Auth0 tenant/entitlement, HTTPS deployment и ChatGPT development connection; real connect, 30 дней данных, denied/partial scopes, refresh и user isolation не проверены. Без разрешённого Oura data route и live gates эти критерии закрывать нельзя.
- Точный следующий шаг: на следующем поручении исследовать официально доступный Oura-operated MCP путь в рамках T2 и подготовить проверяемое решение; архитектуру/критерии молча не менять. Для внешнего уточнения уже есть текст запроса; сообщения, заявки, деплой, расходы и публикация в этой итерации не выполнялись.
- Cleanup: основной агент использовал только inline-команды, временных scripts/helper/probes/scratch-файлов не создавал; Luna подтвердила то же. Проверен список изменённых файлов и чистый Git status после implementation checkpoints. Постоянные документы, зависимости и игнорируемые build-артефакты сохранены; протокольный тест завершился со своими дочерними процессами.

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
