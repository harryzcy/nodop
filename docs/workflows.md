# Workflows

Workflows is a set of YAML files, each consisting one or multiple rules that operate on Notion data sources. A workflow file ends with a `.yaml` or `.yml` extension.

## Syntax

The workflows syntax mimics that of GitHub Actions.

### `name`

The name of the workflow.

### `on`

The triggers of the workflow.

It can contain a single event

```yaml
on: create
```

or It can contain multiple events

```yaml
on: [create, update]
```

Currently, only `create` and `update` events are supported.

### `target`

The data sources IDs that this workflow targets. Each ID used by Notion is an 32-digit hex number.

It may be one data source:

```yaml
target: <data_source_id>
```

or multiple data sources:

```yaml
target:
  - <data_source_id_1>
  - <data_source_id_2>
```

### `jobs`

The actual actions that should run on pages inside of targeted data sources.

### `jobs.<job_id>`

The unique identifier for a job.

### `jobs.<job_id>.name`

Name of the job.

### `jobs.<job_id>.if`

The conditions under which the job will be run.

### `jobs.<job_id>.steps`

The steps that performs on matched Notion page.

### `jobs.<job_id>.steps[*].name`

The name of the current step.

### `jobs.<job_id>.steps[*].if`

The if condition for the current step. If the condition is not satisfied, the job will be aborted and the remaining steps will not be executed.

### `jobs.<job_id>.steps[*].lang`

(Optional) Language for `run`, should be either `bash` or `builtin` (default).

### `jobs.<job_id>.steps[*].run`

The expressions to execute on the matched Notion page. For expressions syntax, refer to [here](./expressions.md)
