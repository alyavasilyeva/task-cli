#!/usr/bin/env node

import { addTask } from "./commands/add.js";
import { deleteTask } from "./commands/delete.js";
import { listTasks } from "./commands/list.js";
import { markDone } from "./commands/mark-done.js";
import { markInProgress } from "./commands/mark-in-progress.js";
import { TaskNotFoundError, updateTask } from "./commands/update.js";
import { getPositionalArgs } from "./parse-args.js";
import { getTasksFilePath } from "./storage.js";

function parseTaskId(idArg: string): number | null {
	const id = Number.parseInt(idArg, 10);

	if (!Number.isInteger(id) || id <= 0) {
		return null;
	}

	return id;
}

async function main(): Promise<void> {
	const [command, ...rest] = getPositionalArgs(process.argv);
	const tasksFilePath = getTasksFilePath();

	switch (command) {
		case "add": {
			const description = rest.join(" ").trim();
			if (!description) {
				console.error("Error: task description is required");
				console.error('Usage: task-cli add "Buy groceries"');
				process.exit(1);
			}

			const task = await addTask(tasksFilePath, description);
			console.log(`Task created: ${task.id}`);
			break;
		}
		case "update": {
			const [idArg, ...descriptionParts] = rest;
			const description = descriptionParts.join(" ").trim();

			if (!idArg || !description) {
				console.error("Error: task id and description are required");
				console.error('Usage: task-cli update <id> "new description"');
				process.exit(1);
			}

			const id = parseTaskId(idArg);
			if (id === null) {
				console.error("Error: task id must be a positive integer");
				process.exit(1);
			}

			try {
				const task = await updateTask(tasksFilePath, id, description);
				console.log(`Task updated: ${task.id}`);
			} catch (error) {
				if (error instanceof TaskNotFoundError) {
					console.error(`Error: ${error.message}`);
					process.exit(1);
				}

				throw error;
			}

			break;
		}
		case "delete": {
			const [idArg] = rest;

			if (!idArg) {
				console.error("Error: task id is required");
				console.error("Usage: task-cli delete <id>");
				process.exit(1);
			}

			const id = parseTaskId(idArg);
			if (id === null) {
				console.error("Error: task id must be a positive integer");
				process.exit(1);
			}

			try {
				const task = await deleteTask(tasksFilePath, id);
				console.log(`Task deleted: ${task.id}`);
			} catch (error) {
				if (error instanceof TaskNotFoundError) {
					console.error(`Error: ${error.message}`);
					process.exit(1);
				}

				throw error;
			}

			break;
		}
		case "list": {
			let tasks = await listTasks(tasksFilePath);
			const [status] = rest;

			if (status) {
				if (
					status !== "todo" &&
					status !== "in-progress" &&
					status !== "done"
				) {
					console.error("Error: invalid status");
					console.error("Usage: task-cli list [done|in-progress|todo]");
					process.exit(1);
				}
			}

			if (status) {
				tasks = tasks.filter((task) => task.status === status);
			}

			if (tasks.length === 0) {
				console.log("No tasks found.");
				break;
			}

			for (const task of tasks) {
				console.log(`${task.id}. ${task.description} [${task.status}]`);
			}

			break;
		}
		case "mark-done": {
			const [idArg] = rest;

			if (!idArg) {
				console.error("Error: task id is required");
				console.error("Usage: task-cli mark-done <id>");
				process.exit(1);
			}

			const id = parseTaskId(idArg);
			if (id === null) {
				console.error("Error: task id must be a positive integer");
				process.exit(1);
			}

			try {
				const task = await markDone(tasksFilePath, id);
				console.log(`Task marked as done: ${task.id}`);
			} catch (error) {
				if (error instanceof TaskNotFoundError) {
					console.error(`Error: ${error.message}`);
					process.exit(1);
				}

				throw error;
			}

			break;
		}
		case "mark-in-progress": {
			const [idArg] = rest;

			if (!idArg) {
				console.error("Error: task id is required");
				console.error("Usage: task-cli mark-in-progress <id>");
				process.exit(1);
			}

			const id = parseTaskId(idArg);
			if (id === null) {
				console.error("Error: task id must be a positive integer");
				process.exit(1);
			}

			try {
				const task = await markInProgress(tasksFilePath, id);
				console.log(`Task marked as in progress: ${task.id}`);
			} catch (error) {
				if (error instanceof TaskNotFoundError) {
					console.error(`Error: ${error.message}`);
					process.exit(1);
				}

				throw error;
			}

			break;
		}
		default: {
			console.log(`Usage: task-cli <command> [args]
Commands:
  add <description>:              Add a new task
  update <id> <description>:      Update a task
  delete <id>:                    Delete a task
  list [done|in-progress|todo]:   List tasks by status
  mark-done <id>:                 Mark a task as done
  mark-in-progress <id>:          Mark a task as in progress
`);
			process.exit(0);
		}
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
