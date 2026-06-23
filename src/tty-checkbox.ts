import type { Key } from "node:readline";
import readline from "node:readline";

export type CheckboxChoice<T> = {
	label: string;
	value: T;
	checked: boolean;
};

export class CheckboxCancelledError extends Error {
	constructor() {
		super("Checkbox prompt cancelled");
		this.name = "CheckboxCancelledError";
	}
}

type KeypressListener = (str: string, key: Key) => void;

export type CheckboxInput = {
	isTTY?: boolean;
	setRawMode: (mode: boolean) => void;
	resume: () => void;
	pause: () => void;
	on: (event: "keypress", listener: KeypressListener) => void;
	removeListener: (event: "keypress", listener: KeypressListener) => void;
};

export type CheckboxOutput = {
	write: (chunk: string) => boolean;
};

type PromptCheckboxOptions = {
	stdin?: CheckboxInput;
	stdout?: CheckboxOutput;
};

export function promptCheckbox<T>(
	message: string,
	choices: readonly CheckboxChoice<T>[],
	options: PromptCheckboxOptions = {},
): Promise<T[]> {
	const stdin = options.stdin ?? process.stdin;
	const stdout = options.stdout ?? process.stdout;

	if (!stdin.isTTY) {
		return Promise.reject(new Error("promptCheckbox requires a TTY"));
	}

	return new Promise((resolve, reject) => {
		const state = choices.map((choice) => ({ ...choice }));
		let cursor = 0;
		let lineCount = 0;

		if ("readable" in stdin) {
			readline.emitKeypressEvents(stdin);
		}

		stdin.setRawMode(true);
		stdin.resume();

		const hideCursor = (): void => {
			stdout.write("\x1b[?25l");
		};

		const showCursor = (): void => {
			stdout.write("\x1b[?25h");
		};

		const formatLine = (choice: CheckboxChoice<T>, index: number): string => {
			const mark = choice.checked ? "[x]" : "[ ]";
			const pointer = index === cursor ? ">" : " ";
			return `${pointer} ${mark} ${choice.label}`;
		};

		const render = (): void => {
			const lines = [
				message,
				...state.map((choice, index) => formatLine(choice, index)),
				"(↑↓ move, space toggle, enter save)",
			];

			if (lineCount > 0) {
				stdout.write(`\x1b[${lineCount}A`);
			}

			for (const line of lines) {
				stdout.write(`\x1b[2K${line}\n`);
			}

			lineCount = lines.length;
		};

		const onKeypress: KeypressListener = (_str, key) => {
			if (!key) {
				return;
			}

			if (key.ctrl && key.name === "c") {
				cleanup();
				stdout.write("\n");
				reject(new CheckboxCancelledError());
				return;
			}

			if (key.name === "up") {
				cursor = cursor > 0 ? cursor - 1 : state.length - 1;
			} else if (key.name === "down") {
				cursor = cursor < state.length - 1 ? cursor + 1 : 0;
			} else if (key.name === "space") {
				const current = state[cursor];
				if (current) {
					current.checked = !current.checked;
				}
			} else if (key.name === "return") {
				cleanup();
				stdout.write("\n");
				resolve(
					state
						.filter((choice) => choice.checked)
						.map((choice) => choice.value),
				);
				return;
			} else {
				return;
			}

			render();
		};

		const cleanup = (): void => {
			stdin.removeListener("keypress", onKeypress);
			stdin.setRawMode(false);
			showCursor();
			stdin.pause();
		};

		hideCursor();
		stdin.on("keypress", onKeypress);
		render();
	});
}
