import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in-progress", "done"]);

export const taskSchema = z.object({
	id: z.uuid(),
	description: z.string().min(1),
	status: taskStatusSchema,
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;
