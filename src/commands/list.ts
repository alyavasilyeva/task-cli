import { loadTasks } from "~/storage.js";
import type { Task } from "~/types.js";

export async function listTasks(filePath: string): Promise<Task[]> {
	return loadTasks(filePath);
}
