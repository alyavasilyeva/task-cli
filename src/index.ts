#!/usr/bin/env node

import { addTask } from "./commands/add.js";
import { TaskNotFoundError, updateTask } from "./commands/update.js";
import { getPositionalArgs } from "./parse-args.js";

function parseTaskId(idArg: string): number | null {
	const id = Number.parseInt(idArg, 10);

	if (!Number.isInteger(id) || id <= 0) {
		return null;
	}

	return id;
}

async function main(): Promise<void> {
	const [command, ...rest] = getPositionalArgs(process.argv);

	switch (command) {
		case "add": {
			const description = rest.join(" ").trim();
			if (!description) {
				console.error("Error: task description is required");
				console.error('Usage: task-cli add "Buy groceries"');
				process.exit(1);
			}

			const task = await addTask(description);
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
				const task = await updateTask(id, description);
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
		default: {
			if (!command) {
				console.error("Usage: task-cli <command> [args]");
				process.exit(1);
			}

			console.error(`Unknown command: ${command}`);
			process.exit(1);
		}
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
