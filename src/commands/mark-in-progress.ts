import { loadTasks, saveTasks } from "../storage.js";
import type { Task } from "../types.js";
import { TaskNotFoundError } from "./update.js";

export async function markInProgress(
	filePath: string,
	id: number,
): Promise<Task> {
	const tasks = await loadTasks(filePath);
	const taskIndex = tasks.findIndex((task) => task.id === id);
	if (taskIndex === -1) {
		throw new TaskNotFoundError(id);
	}
	const task = tasks[taskIndex];
	task.status = "in-progress";
	await saveTasks(filePath, tasks);
	return task;
}
