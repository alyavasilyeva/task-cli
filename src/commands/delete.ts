import { TaskNotFoundError } from "~/errors.js";
import { loadTasks, saveTasks } from "~/storage.js";
import type { Task } from "~/types.js";

export async function deleteTask(filePath: string, id: number): Promise<Task> {
	const tasks = await loadTasks(filePath);
	const taskIndex = tasks.findIndex((task) => task.id === id);

	if (taskIndex === -1) {
		throw new TaskNotFoundError(id);
	}

	const [deletedTask] = tasks.splice(taskIndex, 1);
	await saveTasks(filePath, tasks);

	return deletedTask;
}
