import { TaskNotFoundError } from "~/errors.js";
import { loadTasks, saveTasks } from "~/storage.js";
import { type Task, taskSchema } from "~/types.js";

export async function updateTask(
	filePath: string,
	id: number,
	description: string,
): Promise<Task> {
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
