import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTask } from "../test/create-task.js";
import { addTask } from "./add.js";
import {
	applyListAction,
	formatTaskLabel,
	getAffectedTasks,
	listTasksInteractive,
	printListActionResult,
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

describe("applyListAction", () => {
	const tasks = [
		createTask({ id: 1, description: "First", status: "todo" }),
		createTask({ id: 2, description: "Second", status: "todo" }),
		createTask({ id: 3, description: "Third", status: "done" }),
	];

	it("returns null when cancelled", () => {
		expect(applyListAction(tasks, [1], "cancel")).toBeNull();
	});

	it("deletes selected tasks", () => {
		const updated = applyListAction(tasks, [1, 3], "delete");

		expect(updated?.map((task) => task.id)).toEqual([2]);
	});

	it("marks selected tasks as done", () => {
		const updated = applyListAction(tasks, [1, 2], "done");

		expect(updated?.[0]?.status).toBe("done");
		expect(updated?.[1]?.status).toBe("done");
		expect(updated?.[2]?.status).toBe("done");
	});

	it("marks selected tasks as in progress", () => {
		const updated = applyListAction(tasks, [2, 3], "in-progress");

		expect(updated?.[0]?.status).toBe("todo");
		expect(updated?.[1]?.status).toBe("in-progress");
		expect(updated?.[2]?.status).toBe("in-progress");
	});
});

describe("getAffectedTasks", () => {
	const tasks = [
		createTask({ id: 1, description: "First", status: "todo" }),
		createTask({ id: 2, description: "Second", status: "done" }),
	];

	it("returns selected tasks for delete", () => {
		expect(getAffectedTasks(tasks, [1, 2], "delete").map((t) => t.id)).toEqual([
			1, 2,
		]);
	});

	it("returns only tasks that change status for done", () => {
		expect(getAffectedTasks(tasks, [1, 2], "done").map((t) => t.id)).toEqual([
			1,
		]);
	});

	it("returns only tasks that change status for in progress", () => {
		expect(
			getAffectedTasks(tasks, [1, 2], "in-progress").map((t) => t.id),
		).toEqual([1, 2]);
	});
});

describe("printListActionResult", () => {
	const tasks = [
		createTask({ id: 1, description: "First", status: "todo" }),
		createTask({ id: 2, description: "Second", status: "todo" }),
	];

	it("prints deleted tasks", () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {});

		printListActionResult(tasks, [1], "delete");

		expect(log).toHaveBeenCalledWith("Tasks deleted: 1. First [todo]");
		log.mockRestore();
	});

	it("prints tasks marked as done", () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {});

		printListActionResult(tasks, [1, 2], "done");

		expect(log).toHaveBeenCalledWith(
			"Tasks marked as done: 1. First [todo], 2. Second [todo]",
		);
		log.mockRestore();
	});

	it("prints nothing when no tasks were affected", () => {
		const doneTasks = [
			createTask({ id: 1, description: "First", status: "done" }),
		];
		const log = vi.spyOn(console, "log").mockImplementation(() => {});

		printListActionResult(doneTasks, [1], "done");

		expect(log).not.toHaveBeenCalled();
		log.mockRestore();
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
		describe("applying an action", () => {
			let tempDir: string;
			let tasksFilePath: string;

			beforeAll(async () => {
				tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-list-test-"));
				tasksFilePath = path.join(tempDir, "tasks.json");
			});

			afterAll(async () => {
				await rm(tempDir, { recursive: true, force: true });
			});

			it("applies the chosen action to selected tasks", async () => {
				const task = await addTask(tasksFilePath, "Buy groceries");
				const promptCheckbox = vi.fn().mockResolvedValue([task.id]);
				const promptSelect = vi.fn().mockResolvedValue("done");
				const log = vi.spyOn(console, "log").mockImplementation(() => {});

				await listTasksInteractive(tasksFilePath, {
					isInteractive: true,
					promptCheckbox,
					promptSelect,
				});

				expect(promptCheckbox).toHaveBeenCalledOnce();
				expect(promptSelect).toHaveBeenCalledOnce();
				const saved = JSON.parse(await readFile(tasksFilePath, "utf-8"));
				expect(saved[0]?.status).toBe("done");
				expect(log).toHaveBeenCalledWith(
					`Tasks marked as done: ${formatTaskLabel(task)}`,
				);
				log.mockRestore();
			});
		});

		describe("cancelling an action", () => {
			let tempDir: string;
			let tasksFilePath: string;

			beforeAll(async () => {
				tempDir = await mkdtemp(path.join(tmpdir(), "task-cli-list-test-"));
				tasksFilePath = path.join(tempDir, "tasks.json");
			});

			afterAll(async () => {
				await rm(tempDir, { recursive: true, force: true });
			});

			it("does not save when the action is cancel", async () => {
				const task = await addTask(tasksFilePath, "Walk the dog");
				const promptCheckbox = vi.fn().mockResolvedValue([task.id]);
				const promptSelect = vi.fn().mockResolvedValue("cancel");

				await listTasksInteractive(tasksFilePath, {
					isInteractive: true,
					promptCheckbox,
					promptSelect,
				});

				const saved = JSON.parse(await readFile(tasksFilePath, "utf-8"));
				expect(saved[0]?.status).toBe("todo");
			});
		});
	});
});
