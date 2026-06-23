import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { type CheckboxOutput, promptCheckbox } from "./tty-checkbox.js";

class MockStdin extends EventEmitter {
	isTTY = true;
	setRawMode = vi.fn<(mode: boolean) => void>();
	pause = vi.fn<() => void>();
	resume = vi.fn<() => void>();
}

describe("promptCheckbox", () => {
	it("returns checked values after toggling and pressing enter", async () => {
		const stdin = new MockStdin();
		const stdout: CheckboxOutput = { write: vi.fn(() => true) };

		const resultPromise = promptCheckbox(
			"Pick tasks",
			[
				{ label: "First", value: 1, checked: false },
				{ label: "Second", value: 2, checked: false },
			],
			{ stdin, stdout },
		);

		stdin.emit("keypress", "", { name: "down" });
		stdin.emit("keypress", "", { name: "space" });
		stdin.emit("keypress", "", { name: "return" });

		await expect(resultPromise).resolves.toEqual([2]);
	});

	it("rejects when cancelled with ctrl+c", async () => {
		const stdin = new MockStdin();
		const stdout: CheckboxOutput = { write: vi.fn(() => true) };

		const resultPromise = promptCheckbox(
			"Pick tasks",
			[{ label: "First", value: 1, checked: false }],
			{ stdin, stdout },
		);

		stdin.emit("keypress", "", { name: "c", ctrl: true });

		await expect(resultPromise).rejects.toThrow("Checkbox prompt cancelled");
	});
});
