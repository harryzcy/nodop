# nodop - **NO**tion **D**atabase **OP**erator

![Node.js CI](https://github.com/harryzcy/nodop/actions/workflows/nodejs.yml/badge.svg)
![Docker CI](https://github.com/harryzcy/nodop/actions/workflows/docker.yml/badge.svg)
![Lint Code Base](https://github.com/harryzcy/nodop/actions/workflows/linter.yml/badge.svg)

A workflow runner system for Notion databases.

WARNING: There maybe breaking changes before 1.0 release.

## Usage

Use Docker:

```shell
docker run -v PATH/TO/CONFIG/:app/conf/ -v PATH/TO/CACHE/:app/cache/ --env NOTION_KEY=<notion_key> harryzcy/nodop
```

- `PATH/TO/CONFIG/` should point to a directory holding workflow files according to [this syntax](#workflow-syntax).
- `PATH/TO/CACHE/` (optional) should point to a directory for cache

  If enabled, timestamp of the last runtime will be stored, so when Docker is restarted, it can catch up from last timestamp.

- `NOTION_KEY` should be obtained by creating your own [Notion integration](https://www.notion.so/my-integrations).

## Build

```shell
npm run build:release
npm run daemon
```

## Workflow Syntax

Please refer to [workflows doc](docs/workflows.md) or [examples](./examples/)

## Additional Configurations

The configurations below are available via environment variables.

### `CONFIG_PATH`

The path to configuration directory or file.

### `CHECK_INTERVAL`

The interval in seconds that Notion database changes will be checked.

Default: 30

### `LOG_FILE`

The path of the log file. If left empty, the log will be outputted to console.
