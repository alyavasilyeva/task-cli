#!/usr/bin/env node

import { addTask } from "./commands/add.js";
import { getPositionalArgs } from "./parse-args.js";

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
