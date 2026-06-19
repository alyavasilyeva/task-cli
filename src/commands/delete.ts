import { getTasksFilePath, loadTasks, saveTasks } from "../storage.js";
import type { Task } from "../types.js";
import { TaskNotFoundError } from "./update.js";

export async function deleteTask(id: number): Promise<Task> {
	const filePath = getTasksFilePath();
	const tasks = await loadTasks(filePath);
	const taskIndex = tasks.findIndex((task) => task.id === id);

	if (taskIndex === -1) {
		throw new TaskNotFoundError(id);
	}

	const [deletedTask] = tasks.splice(taskIndex, 1);
	await saveTasks(filePath, tasks);

	return deletedTask;
}
