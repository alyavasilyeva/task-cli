import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getTasksFilePath, loadTasks, saveTasks } from "./storage.js";
import { createTask } from "./test/create-task.js";
import type { Task } from "./types.js";

faker.seed(42);

const firstTask = createTask();

describe("getTasksFilePath", () => {
	it("joins the tasks filename with the provided directory", () => {
		expect(getTasksFilePath("/tmp/project")).toBe(
			path.join("/tmp/project", "tasks.json"),
		);
	});
});

describe("loadTasks", () => {
	let tempDir: string;

	beforeAll(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-storage-test-"));
	});

	afterAll(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("returns an empty array when the tasks file does not exist", async () => {
		const filePath = path.join(tempDir, "missing-tasks.json");

		await expect(loadTasks(filePath)).resolves.toEqual([]);
	});

	it("returns parsed tasks from a valid tasks file", async () => {
		const filePath = path.join(tempDir, "valid-tasks.json");
		await writeFile(filePath, JSON.stringify([firstTask]), "utf-8");

		await expect(loadTasks(filePath)).resolves.toEqual([firstTask]);
	});

	it("throws when the tasks file contains invalid data", async () => {
		const filePath = path.join(tempDir, "invalid-tasks.json");
		await writeFile(
			filePath,
			JSON.stringify([{ id: "not-a-uuid", description: "" }]),
			"utf-8",
		);

		await expect(loadTasks(filePath)).rejects.toThrow();
	});
});

describe("saveTasks", () => {
	let tempDir: string;

	beforeAll(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-storage-test-"));
	});

	afterAll(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("writes tasks as formatted JSON with a trailing newline", async () => {
		const filePath = path.join(tempDir, "saved-tasks.json");

		await saveTasks(filePath, [firstTask]);

		await expect(loadTasks(filePath)).resolves.toEqual([firstTask]);
	});

	it("persists multiple tasks that can be loaded back", async () => {
		const filePath = path.join(tempDir, "multiple-tasks.json");
		const secondTask: Task = createTask({ status: "in-progress" });

		await saveTasks(filePath, [firstTask, secondTask]);

		await expect(loadTasks(filePath)).resolves.toEqual([firstTask, secondTask]);
	});
});
