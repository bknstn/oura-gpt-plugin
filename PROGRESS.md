# Прогресс Oura AI Connector

**Обновлено:** 2026-10-13 (Europe/Warsaw).  
**Исполнитель:** `gpt-6-luna`, reasoning `xhigh`.  
**Ревьюер:** основной агент текущего чата.  
**Текущая задача:** T1.  
**Следующий шаг:** собрать локальный loopback-only TypeScript MCP-каркас с актуальным SDK, health endpoint и синтетическим протокольным smoke; затем обновить точку восстановления до `needs_review`. Реализация T2–T5 в этом поручении пока не запускается.

| Задача | Состояние | Ревью |
| --- | --- | --- |
| T1 | in_progress | — |
| T2 | queued | — |
| T3 | queued | — |
| T4 | queued | — |
| T5 | queued | — |

Состояния: `queued`, `in_progress`, `needs_review`, `blocked`, `done`. `done` выставляет ревьюер. Состояние после внезапного прерывания уточняется по Git и diff.

## Активная точка восстановления

- Репозиторий первоначально содержал только незакоммиченный `oura-ai-connector-mvp.md`, реализации нет.
- Пользователь подтвердил: подготовить очередь и начать первую задачу на Luna xhigh с ревью основного агента.
- Созданы постоянные `AGENTS.md`, `TASKS.md`, `PROGRESS.md`; исходный план сохранён без изменений.
- ADR 0001 проверен по текущей опубликованной MCP auth specification `2026-07-28` и актуальным официальным OpenAI/Oura docs: прямой Oura OAuth отклонён из-за требования MCP audience-bound token и запрета token passthrough.
- Внешние OAuth/ChatGPT/deploy проверки ещё не выполнялись. Credentials, домен, auth-provider и reviewer account в репозитории не представлены.
- Временные файлы на этапе планирования не создавались.

### Текущая итерация T1 — документация и архитектурное решение

- Состояние: `in_progress`.
- Исполнитель: GPT 6 Luna (`gpt-6-luna`), reasoning effort `xhigh`.
- Перед стартом: прочитаны `AGENTS.md`, `TASKS.md`, `PROGRESS.md`, исходный план; `git status --short` чистый; HEAD `56789b3`; незакоммиченного diff нет.
- Выбранный следующий шаг: сверить актуальные официальные документы OpenAI, Oura и MCP по OAuth, PKCE/discovery, resource/audience, token passthrough, scopes и reviewer access; затем записать ADR со ссылками и датой проверки.
- Документальная проверка завершена: прямой Oura bearer в MCP несовместим с обязательной audience boundary и запретом token passthrough; Oura PKCE/refresh/scopes подтверждены. ADR добавлен в `docs/adr/0001-oauth-boundary.md`.
- Проверки кода ещё не запускались; локальный skeleton не создан.
- Известные ограничения: доступов к Oura application, ChatGPT reviewer flow, домену и credentials нет; реальные OAuth/ChatGPT проверки впереди.
- SDK API и версии проверены по официальной документации/release/source: `@modelcontextprotocol/server` и `client` 2.3.1, Node adapter 2.1.1; SDK требует Node.js >=20, локально доступен Node v22.22.2.
- Реализован первый вариант loopback-only skeleton (`src/server.ts`), health endpoint, явно синтетический MCP tool, protocol smoke, README, `package.json` с точными прямыми версиями и `tsconfig.json`.
- `npm install` прошёл через разрешённый сетевой запуск; создан `package-lock.json`, установлено 25 пакетов. Отчёт npm: 2 moderate advisories, подробности ещё не проверены.
- Build/typecheck/protocol smoke ещё не запускались.
- Точный следующий шаг: исследовать advisory, затем выполнить build, typecheck и протокольный smoke, исправить обнаруженные проблемы.

### Проверка актуальной редакции MCP authorization

- По ссылке `/specification/latest/basic/authorization` подтверждена опубликованная редакция `2026-07-28`; в ADR заменены ссылки на прежнюю редакцию.
- Уточнено: CIMD/pre-registration предпочтительны, DCR deprecated для backward compatibility; учитывается issuer `iss` и exact issuer validation.
- Остаток: выбрать/проверить реального authorization intermediary и ChatGPT callback позже, в T2; provider пока не выбран.
- Зависимости установлены, lockfile создан; npm сообщил о 2 moderate advisories.
- Следующий шаг: проверить report advisories и выполнить build/typecheck/smoke.

### Журнал T1 — архитектурное решение по OAuth

- Проверены первичные официальные источники OpenAI, Oura, MCP и MCP TypeScript SDK; ссылки и дата внесены в ADR.
- Решение для ревью: не использовать direct OAuth из исходного плана; до инструментов пользовательских данных требуется выбранный authorization intermediary, выпускающий MCP-audience token отдельно от upstream Oura credentials. Поставщик ещё не выбран.
- Зафиксированы будущие Oura scopes `daily`, `heartrate`, `workout`, reviewer demo с sample data, single-use refresh-token rotation, и внешние проверки, требующие credentials/домена/ChatGPT.
- Проверки реализации пока не запускались. Следующий шаг — локальный skeleton без auth и Oura API.

## Журнал итераций и ревью

### 2026-10-13 — Подготовка очереди

- Разбивка исходного плана на пять последовательных задач с критериями приёмки.
- Зафиксированы исполнитель Luna xhigh, независимое ревью и checkpoint после каждого небольшого шага.
- Проверки: прочитан исходный план; подтверждено, что репозиторий ещё не имеет коммитов. Программных проверок пока нет.
- Дальше: сохранить baseline в Git и поручить T1 Luna. Ссылки на коммиты брать из `git log`; журнал входит в сам checkpoint-коммит и не требует самоссылки на его hash.
