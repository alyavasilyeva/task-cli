import { loadTasks, saveTasks } from "../storage.js";
import { promptCheckbox } from "../tty-checkbox.js";
import { type Task, taskSchema } from "../types.js";

export function formatTaskLabel(task: Task): string {
	return `${task.id}. ${task.description} [${task.status}]`;
}

export function applyTaskSelection(
	tasks: readonly Task[],
	selectedIds: readonly number[],
): Task[] {
	const selected = new Set(selectedIds);
	const now = new Date().toISOString();

	return tasks.map((task) => {
		const status = selected.has(task.id)
			? "done"
			: task.status === "done"
				? "todo"
				: task.status;

		if (status === task.status) {
			return task;
		}

		return taskSchema.parse({
			...task,
			status,
			updatedAt: now,
		});
	});
}

export function printTasks(tasks: readonly Task[]): void {
	if (tasks.length === 0) {
		console.log("No tasks found.");
		return;
	}

	for (const task of tasks) {
		console.log(formatTaskLabel(task));
	}
}

type PromptCheckbox = typeof promptCheckbox;

export async function listTasksInteractive(
	filePath: string,
	options: {
		isInteractive?: boolean;
		promptCheckbox?: PromptCheckbox;
	} = {},
): Promise<void> {
	const tasks = await loadTasks(filePath);

	if (tasks.length === 0) {
		console.log("No tasks found.");
		return;
	}

	const isInteractive = options.isInteractive ?? process.stdin.isTTY;

	if (!isInteractive) {
		printTasks(tasks);
		return;
	}

	const prompt = options.promptCheckbox ?? promptCheckbox;

	let selectedIds: number[];
	try {
		selectedIds = await prompt(
			"Tasks (↑↓ navigate, space mark, enter save)",
			tasks.map((task) => ({
				label: formatTaskLabel(task),
				value: task.id,
				checked: task.status === "done",
			})),
		);
	} catch {
		return;
	}

	const updatedTasks = applyTaskSelection(tasks, selectedIds);
	await saveTasks(filePath, updatedTasks);
}
