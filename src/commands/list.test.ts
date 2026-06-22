import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addTask } from "./add.js";
import { listTasks } from "./list.js";

describe("listTasks", () => {
	let tempDir: string;
	let tasksFilePath: string;

	beforeAll(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-list-test-"));
		tasksFilePath = path.join(tempDir, "tasks.json");
	});

	afterAll(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("returns an empty array when no tasks exist", async () => {
		await expect(listTasks(tasksFilePath)).resolves.toEqual([]);
	});

	it("returns all tasks from storage", async () => {
		const first = await addTask(tasksFilePath, "Buy groceries");
		const second = await addTask(tasksFilePath, "Walk the dog");

		await expect(listTasks(tasksFilePath)).resolves.toEqual([first, second]);
	});
});
