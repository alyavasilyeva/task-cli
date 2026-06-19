import {
	getNextTaskId,
	getTasksFilePath,
	loadTasks,
	saveTasks,
} from "../storage.js";
import { type Task, taskSchema } from "../types.js";

export async function addTask(description: string): Promise<Task> {
	const filePath = getTasksFilePath();
	const tasks = await loadTasks(filePath);
	const now = new Date().toISOString();

	const task = taskSchema.parse({
		id: getNextTaskId(tasks),
		description,
		status: "todo",
		createdAt: now,
		updatedAt: now,
	});

	tasks.push(task);
	await saveTasks(filePath, tasks);

	return task;
}
