import type { Key } from "node:readline";
import readline from "node:readline";
import type { CheckboxInput, CheckboxOutput } from "./tty-checkbox.js";

export type SelectChoice<T> = {
	label: string;
	value: T;
};

export class SelectCancelledError extends Error {
	constructor() {
		super("Select prompt cancelled");
		this.name = "SelectCancelledError";
	}
}

type KeypressListener = (str: string, key: Key) => void;

type PromptSelectOptions = {
	stdin?: CheckboxInput;
	stdout?: CheckboxOutput;
};

export function promptSelect<T>(
	message: string,
	choices: readonly SelectChoice<T>[],
	options: PromptSelectOptions = {},
): Promise<T> {
	const stdin = options.stdin ?? process.stdin;
	const stdout = options.stdout ?? process.stdout;

	if (!stdin.isTTY) {
		return Promise.reject(new Error("promptSelect requires a TTY"));
	}

	return new Promise((resolve, reject) => {
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

		const formatLine = (choice: SelectChoice<T>, index: number): string => {
			const pointer = index === cursor ? ">" : " ";
			return `${pointer} ${choice.label}`;
		};

		const render = (): void => {
			const lines = [
				message,
				...choices.map((choice, index) => formatLine(choice, index)),
				"(↑↓ move, enter choose)",
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
				reject(new SelectCancelledError());
				return;
			}

			if (key.name === "up") {
				cursor = cursor > 0 ? cursor - 1 : choices.length - 1;
			} else if (key.name === "down") {
				cursor = cursor < choices.length - 1 ? cursor + 1 : 0;
			} else if (key.name === "return") {
				const selected = choices[cursor];
				if (!selected) {
					return;
				}

				cleanup();
				stdout.write("\n");
				resolve(selected.value);
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
