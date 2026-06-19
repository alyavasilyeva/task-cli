import { faker } from "@faker-js/faker";
import { type Task, type TaskStatus, taskSchema } from "../types.js";

const taskStatuses: TaskStatus[] = ["todo", "in-progress", "done"];

export function createTask(overrides: Partial<Task> = {}): Task {
	const timestamp = faker.date.recent({ days: 30 }).toISOString();

	return taskSchema.parse({
		id: faker.number.int({ min: 1, max: 10_000 }),
		description: faker.lorem.sentence(),
		status: faker.helpers.arrayElement(taskStatuses),
		createdAt: timestamp,
		updatedAt: timestamp,
		...overrides,
	});
}
