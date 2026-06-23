import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import type { CheckboxOutput } from "./tty-checkbox.js";
import { promptSelect } from "./tty-select.js";

class MockStdin extends EventEmitter {
	isTTY = true;
	setRawMode = vi.fn<(mode: boolean) => void>();
	pause = vi.fn<() => void>();
	resume = vi.fn<() => void>();
}

describe("promptSelect", () => {
	it("returns the highlighted choice on enter", async () => {
		const stdin = new MockStdin();
		const stdout: CheckboxOutput = { write: vi.fn(() => true) };

		const resultPromise = promptSelect(
			"Choose",
			[
				{ label: "Delete", value: "delete" },
				{ label: "Cancel", value: "cancel" },
			],
			{ stdin, stdout },
		);

		stdin.emit("keypress", "", { name: "down" });
		stdin.emit("keypress", "", { name: "return" });

		await expect(resultPromise).resolves.toBe("cancel");
	});

	it("rejects when cancelled with ctrl+c", async () => {
		const stdin = new MockStdin();
		const stdout: CheckboxOutput = { write: vi.fn(() => true) };

		const resultPromise = promptSelect(
			"Choose",
			[{ label: "Cancel", value: "cancel" }],
			{ stdin, stdout },
		);

		stdin.emit("keypress", "", { name: "c", ctrl: true });

		await expect(resultPromise).rejects.toThrow("Select prompt cancelled");
	});
});
