import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TaskNotFoundError } from "~/errors.js";
import { loadTasks } from "~/storage.js";
import { addTask } from "./add.js";
import { deleteTask } from "./delete.js";

describe("deleteTask", () => {
	let tempDir: string;
	let tasksFilePath: string;

	beforeAll(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-delete-test-"));
		tasksFilePath = path.join(tempDir, "tasks.json");
	});

	afterAll(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("removes the task from storage", async () => {
		const first = await addTask(tasksFilePath, "Buy groceries");
		await addTask(tasksFilePath, "Walk the dog");

		const deleted = await deleteTask(tasksFilePath, first.id);

		expect(deleted).toEqual(first);
		await expect(loadTasks(tasksFilePath)).resolves.toEqual([
			expect.objectContaining({ id: 2, description: "Walk the dog" }),
		]);
	});

	it("throws when the task does not exist", async () => {
		await expect(deleteTask(tasksFilePath, 99)).rejects.toBeInstanceOf(
			TaskNotFoundError,
		);
	});
});
