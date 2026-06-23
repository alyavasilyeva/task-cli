import { loadTasks, saveTasks } from "../storage.js";
import { promptCheckbox } from "../tty-checkbox.js";
import { promptSelect } from "../tty-select.js";
import { type Task, type TaskStatus, taskSchema } from "../types.js";

export type ListAction = "delete" | "done" | "in-progress" | "cancel";

export function formatTaskLabel(task: Task): string {
	return `${task.id}. ${task.description} [${task.status}]`;
}

export function applyListAction(
	tasks: readonly Task[],
	selectedIds: readonly number[],
	action: ListAction,
): Task[] | null {
	if (action === "cancel") {
		return null;
	}

	const selected = new Set(selectedIds);
	const now = new Date().toISOString();

	if (action === "delete") {
		return tasks.filter((task) => !selected.has(task.id));
	}

	const nextStatus: TaskStatus = action === "done" ? "done" : "in-progress";

	return tasks.map((task) => {
		if (!selected.has(task.id) || task.status === nextStatus) {
			return task;
		}

		return taskSchema.parse({
			...task,
			status: nextStatus,
			updatedAt: now,
		});
	});
}

export function getAffectedTasks(
	tasks: readonly Task[],
	selectedIds: readonly number[],
	action: ListAction,
): Task[] {
	if (action === "cancel") {
		return [];
	}

	const selected = new Set(selectedIds);

	if (action === "delete") {
		return tasks.filter((task) => selected.has(task.id));
	}

	const nextStatus: TaskStatus = action === "done" ? "done" : "in-progress";
	return tasks.filter(
		(task) => selected.has(task.id) && task.status !== nextStatus,
	);
}

export function printListActionResult(
	tasks: readonly Task[],
	selectedIds: readonly number[],
	action: ListAction,
): void {
	const affected = getAffectedTasks(tasks, selectedIds, action);
	if (affected.length === 0) {
		return;
	}

	const labels = affected.map(formatTaskLabel).join(", ");

	switch (action) {
		case "delete":
			console.log(`Tasks deleted: ${labels}`);
			break;
		case "done":
			console.log(`Tasks marked as done: ${labels}`);
			break;
		case "in-progress":
			console.log(`Tasks marked as in progress: ${labels}`);
			break;
	}
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

const LIST_ACTION_CHOICES: { label: string; value: ListAction }[] = [
	{ label: "Delete selected tasks", value: "delete" },
	{ label: "Mark selected as done", value: "done" },
	{ label: "Mark selected as in progress", value: "in-progress" },
	{ label: "Cancel", value: "cancel" },
];

type PromptCheckbox = typeof promptCheckbox;
type PromptSelect = typeof promptSelect;

export async function listTasksInteractive(
	filePath: string,
	options: {
		isInteractive?: boolean;
		promptCheckbox?: PromptCheckbox;
		promptSelect?: PromptSelect;
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

	const checkbox = options.promptCheckbox ?? promptCheckbox;
	const select = options.promptSelect ?? promptSelect;

	let selectedIds: number[];
	try {
		selectedIds = await checkbox(
			"Select tasks (↑↓ navigate, space select, enter confirm)",
			tasks.map((task) => ({
				label: formatTaskLabel(task),
				value: task.id,
				checked: false,
			})),
		);
	} catch {
		return;
	}

	if (selectedIds.length === 0) {
		console.log("No tasks selected.");
		return;
	}

	let action: ListAction;
	try {
		action = await select("Choose an action", LIST_ACTION_CHOICES);
	} catch {
		return;
	}

	const updatedTasks = applyListAction(tasks, selectedIds, action);
	if (updatedTasks === null) {
		return;
	}

	await saveTasks(filePath, updatedTasks);
	printListActionResult(tasks, selectedIds, action);
}
