import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadTasks } from "../storage.js";
import { addTask } from "./add.js";

describe("addTask", () => {
	describe("creating a task", () => {
		let tempDir: string;
		let tasksFilePath: string;

		beforeAll(async () => {
			tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-add-test-"));
			tasksFilePath = path.join(tempDir, "tasks.json");
		});

		afterAll(async () => {
			await rm(tempDir, { recursive: true, force: true });
		});

		it("creates a task with todo status and persists it", async () => {
			const task = await addTask(tasksFilePath, "Buy groceries");

			expect(task).toMatchObject({
				id: 1,
				description: "Buy groceries",
				status: "todo",
			});
			expect(task.createdAt).toBe(task.updatedAt);
			await expect(loadTasks(tasksFilePath)).resolves.toEqual([task]);
		});
	});

	describe("creating multiple tasks", () => {
		let tempDir: string;
		let tasksFilePath: string;

		beforeAll(async () => {
			tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-add-test-"));
			tasksFilePath = path.join(tempDir, "tasks.json");
		});

		afterAll(async () => {
			await rm(tempDir, { recursive: true, force: true });
		});

		it("assigns incrementing ids", async () => {
			const first = await addTask(tasksFilePath, "Buy groceries");
			const second = await addTask(tasksFilePath, "Walk the dog");

			expect(first.id).toBe(1);
			expect(second.id).toBe(2);
			await expect(loadTasks(tasksFilePath)).resolves.toEqual([first, second]);
		});
	});
});
