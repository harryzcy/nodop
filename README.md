# nodop - **NO**tion **D**atabase **OP**erator

![Node.js CI](https://github.com/harryzcy/nodop/actions/workflows/nodejs.yml/badge.svg)
![Docker CI](https://github.com/harryzcy/nodop/actions/workflows/docker.yml/badge.svg)
![Lint Code Base](https://github.com/harryzcy/nodop/actions/workflows/linter.yml/badge.svg)

A workflow runner system for Notion databases.

WARNING: There maybe breaking changes before 1.0 release.

## Usage

Use Docker:

```shell
docker run -v PATH/TO/CONFIG/:app/conf --env NOTION_KEY=<notion_key> harryzcy/nodop
```

`PATH/TO/CONFIG/` should point to a directory holding workflow files according to [this syntax](#workflow-syntax).

`NOTION_KEY` should be obtained by creating your own [Notion integration](https://www.notion.so/my-integrations).

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
