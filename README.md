# task-cli

A small command-line task manager. Tasks are stored in a `tasks.json` file in the current working directory, so each project folder can have its own task list.

Part of https://roadmap.sh/projects/task-tracker

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) 11+

## Install

From the project directory:

```bash
pnpm install
pnpm build
pnpm add -g .
```

After a global install, run `task-cli` from any directory. Make sure pnpm’s global bin directory is on your `PATH` (run `pnpm setup` if needed).

To run locally without installing globally, use `pnpm start` and pass the subcommand directly — do not prefix with `task-cli`, and do not use `--` (pnpm forwards it literally to the script):

```bash
pnpm start list done
pnpm start add "Buy groceries"
```

Alternatively:

```bash
node dist/index.js list done
```

## Usage

```text
task-cli <command> [args]
```

Run `task-cli` (or `pnpm start` with no arguments) to print help.

### Commands

| Command | Description |
| --- | --- |
| `add "<description>"` | Create a new task (status starts as `todo`) |
| `update <id> "<description>"` | Change a task’s description |
| `delete <id>` | Remove a task |
| `list [status]` | List all tasks, or filter by status |
| `mark-done <id>` | Mark a task as done |
| `mark-in-progress <id>` | Mark a task as in progress |

Task IDs are positive integers assigned in order when tasks are created.

### Examples

Global install:

```bash
task-cli add "Buy groceries"
task-cli add "Walk the dog"

task-cli list
task-cli list todo
task-cli list in-progress
task-cli list done

task-cli update 1 "Buy groceries and milk"
task-cli mark-in-progress 1
task-cli mark-done 1
task-cli delete 2
```

Local development (same commands, via `pnpm start`):

```bash
pnpm start add "Buy groceries"
pnpm start list done
pnpm start mark-done 1
```

### Output

```text
$ task-cli list
1. Buy groceries [todo]
2. Walk the dog [in-progress]
```

## Data storage

Tasks are read from and written to `./tasks.json` relative to the directory you run the command in. If the file does not exist yet, it is created on the first write.

Each task has this shape:

```json
{
  "id": 1,
  "description": "Buy groceries",
  "status": "todo",
  "createdAt": "2026-06-09T12:00:00.000Z",
  "updatedAt": "2026-06-09T12:00:00.000Z"
}
```

Valid statuses: `todo`, `in-progress`, `done`.

## Development

```bash
pnpm install      # install dependencies
pnpm typecheck    # TypeScript check
pnpm test         # run tests (Vitest)
pnpm build        # compile to dist/
pnpm check        # lint with Biome
pnpm format       # format with Biome
```

