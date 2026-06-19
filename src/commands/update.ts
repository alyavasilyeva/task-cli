import { getTasksFilePath, loadTasks, saveTasks } from "../storage.js";
import { type Task, taskSchema } from "../types.js";

export class TaskNotFoundError extends Error {
	constructor(id: number) {
		super(`Task not found: ${id}`);
		this.name = "TaskNotFoundError";
	}
}

export async function updateTask(
	id: number,
	description: string,
): Promise<Task> {
	const filePath = getTasksFilePath();
	const tasks = await loadTasks(filePath);
	const taskIndex = tasks.findIndex((task) => task.id === id);

	if (taskIndex === -1) {
		throw new TaskNotFoundError(id);
	}

	const existingTask = tasks[taskIndex];
	const updatedTask = taskSchema.parse({
		...existingTask,
		description,
		updatedAt: new Date().toISOString(),
	});

	tasks[taskIndex] = updatedTask;
	await saveTasks(filePath, tasks);

	return updatedTask;
}
