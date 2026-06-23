import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTask } from "../test/create-task.js";
import { addTask } from "./add.js";
import {
	applyTaskSelection,
	formatTaskLabel,
	listTasksInteractive,
	printTasks,
} from "./list.js";

describe("formatTaskLabel", () => {
	it("includes id, description, and status", () => {
		const task = createTask({
			id: 1,
			description: "Buy groceries",
			status: "todo",
		});

		expect(formatTaskLabel(task)).toBe("1. Buy groceries [todo]");
	});
});

describe("applyTaskSelection", () => {
	it("marks selected tasks as done and unselected done tasks as todo", () => {
		const todoTask = createTask({ id: 1, status: "todo" });
		const doneTask = createTask({ id: 2, status: "done" });
		const inProgressTask = createTask({ id: 3, status: "in-progress" });

		const updated = applyTaskSelection(
			[todoTask, doneTask, inProgressTask],
			[1, 3],
		);

		expect(updated[0]?.status).toBe("done");
		expect(updated[1]?.status).toBe("todo");
		expect(updated[2]?.status).toBe("done");
	});
});

describe("printTasks", () => {
	it("prints a message when there are no tasks", () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {});

		printTasks([]);

		expect(log).toHaveBeenCalledWith("No tasks found.");
		log.mockRestore();
	});
});

describe("listTasksInteractive", () => {
	describe("non-interactive mode", () => {
		let tempDir: string;
		let tasksFilePath: string;

		beforeAll(async () => {
			tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-list-test-"));
			tasksFilePath = path.join(tempDir, "tasks.json");
		});

		afterAll(async () => {
			await rm(tempDir, { recursive: true, force: true });
		});

		it("prints tasks when not interactive", async () => {
			const task = await addTask(tasksFilePath, "Buy groceries");
			const log = vi.spyOn(console, "log").mockImplementation(() => {});

			await listTasksInteractive(tasksFilePath, { isInteractive: false });

			expect(log).toHaveBeenCalledWith(formatTaskLabel(task));
			log.mockRestore();
		});
	});

	describe("interactive mode", () => {
		let tempDir: string;
		let tasksFilePath: string;

		beforeAll(async () => {
			tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-list-test-"));
			tasksFilePath = path.join(tempDir, "tasks.json");
		});

		afterAll(async () => {
			await rm(tempDir, { recursive: true, force: true });
		});

		it("saves task status changes after interactive selection", async () => {
			const task = await addTask(tasksFilePath, "Buy groceries");
			const promptCheckbox = vi.fn().mockResolvedValue([task.id]);

			await listTasksInteractive(tasksFilePath, {
				isInteractive: true,
				promptCheckbox,
			});

			expect(promptCheckbox).toHaveBeenCalledOnce();
			const saved = JSON.parse(await readFile(tasksFilePath, "utf-8"));
			expect(saved[0]?.status).toBe("done");
		});
	});
});
