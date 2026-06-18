import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { type Task, taskSchema } from "./types.js";

const TASKS_FILENAME = "tasks.json";

export function getTasksFilePath(cwd = process.cwd()): string {
	return path.join(cwd, TASKS_FILENAME);
}

export async function loadTasks(filePath: string): Promise<Task[]> {
	try {
		await access(filePath);
	} catch {
		return [];
	}

	const content = await readFile(filePath, "utf-8");
	const parsed: unknown = JSON.parse(content);

	return z.array(taskSchema).parse(parsed);
}

export async function saveTasks(
	filePath: string,
	tasks: readonly Task[],
): Promise<void> {
	await writeFile(filePath, `${JSON.stringify(tasks, null, 2)}\n`, "utf-8");
}
