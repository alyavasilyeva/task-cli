import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadTasks } from "../storage.js";
import { addTask } from "./add.js";
import { TaskNotFoundError, updateTask } from "./update.js";

describe("updateTask", () => {
	let tempDir: string;
	let tasksFilePath: string;

	beforeAll(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-update-test-"));
		tasksFilePath = path.join(tempDir, "tasks.json");
	});

	afterAll(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("updates the description of an existing task", async () => {
		const created = await addTask(tasksFilePath, "Buy groceries");

		const updated = await updateTask(
			tasksFilePath,
			created.id,
			"Buy organic groceries",
		);

		expect(updated).toMatchObject({
			id: created.id,
			description: "Buy organic groceries",
			status: "todo",
			createdAt: created.createdAt,
		});
		expect(updated.updatedAt).not.toBe(created.updatedAt);
		await expect(loadTasks(tasksFilePath)).resolves.toEqual([updated]);
	});

	it("throws when the task does not exist", async () => {
		await expect(
			updateTask(tasksFilePath, 99, "Missing task"),
		).rejects.toBeInstanceOf(TaskNotFoundError);
	});
});
