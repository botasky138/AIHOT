# MAFi public-source draft

This branch is a sanitized source snapshot of local implementation b2cb345. It does not carry the local customization commit history.

Personal annotations, output reports, runtime caches, credentials and one-off diagnostic scripts are excluded. Historical links to local-only artifacts are marked as not uploaded. Preview helpers now require PREVIEW_DATABASE_URL from the environment/local configuration instead of embedding local database credentials. The database name must contain a preview segment or end in _test / _ci; the normal application DATABASE_URL is not used as a fallback. This requirement supersedes the older helper commands in the historical local-run notes.

Known follow-ups before merge:

- Homepage hot strip still uses public ordering; /hot is personalized.
- Reaction writes and returned source aggregates need a single transactional snapshot under concurrency.
- Reaction rate-limit bucket retention needs bounding/expiry; keep the API port behind the trusted web proxy.
- Migration 0090 was previously rewritten locally. Existing installations need an upgrade rehearsal; applied files are skipped by name.
- Full UI/browser acceptance remains separate from unit/API checks.
