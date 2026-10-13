# Прогресс Oura AI Connector

**Обновлено:** 2026-10-13 (Europe/Warsaw).  
**Исполнитель:** `gpt-6-luna`, reasoning `xhigh`.  
**Ревьюер:** основной агент текущего чата.  
**Текущая задача:** T1.  
**Следующий шаг:** Luna проверяет официальные OpenAI/Oura/MCP auth requirements, сохраняет ADR, затем собирает локальный MCP-каркас. Реализация T2–T5 в этом поручении пока не запускается.

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
- Начальная проверка документации: [OpenAI MCP auth](https://developers.openai.com/plugins/build/auth). Прямой Oura OAuth из исходного плана пока не подтверждён; T1 должна проверить весь контракт, включая MCP token passthrough/resource/audience.
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
- Точный следующий шаг: проверить актуальный TypeScript SDK v2 API и зафиксировать точные зависимости, затем добавить loopback-only HTTP MCP skeleton, health endpoint, синтетический protocol smoke, README и команды dev/build/typecheck/test.

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
