export class TaskNotFoundError extends Error {
	constructor(id: number) {
		super(`Task not found: ${id}`);
		this.name = "TaskNotFoundError";
	}
}
