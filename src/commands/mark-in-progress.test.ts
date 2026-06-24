import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TaskNotFoundError } from "~/errors.js";
import { addTask } from "./add.js";
import { markInProgress } from "./mark-in-progress.js";

describe("markInProgress", () => {
	let tempDir: string;
	let tasksFilePath: string;

	beforeAll(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-update-test-"));
		tasksFilePath = path.join(tempDir, "tasks.json");
	});

	afterAll(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("throws an error if the task is not found", async () => {
		await expect(markInProgress(tasksFilePath, 1)).rejects.toThrow(
			TaskNotFoundError,
		);
	});

	it("marks a task as in progress", async () => {
		const task = await addTask(tasksFilePath, "Test task");
		expect(task.status).toBe("todo");
		const updatedTask = await markInProgress(tasksFilePath, task.id);
		expect(updatedTask.status).toBe("in-progress");
	});
});
