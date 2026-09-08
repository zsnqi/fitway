// @vitest-environment happy-dom

import { act, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";

import { I18nProvider, useI18n } from "./provider";

let container: HTMLDivElement;
let root: Root;

function Harness() {
	const { locale, toggleLocale } = useI18n();
	const instance = useRef(crypto.randomUUID());
	const [draft, setDraft] = useState("unsaved");
	return (
		<div
			data-locale={locale}
			data-document-lang={document.documentElement.lang}
			data-document-dir={document.documentElement.dir}
			data-instance={instance.current}
		>
			<input value={draft} onChange={(event) => setDraft(event.target.value)} />
			<button type="button" onClick={toggleLocale}>
				toggle
			</button>
		</div>
	);
}

beforeEach(async () => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	window.localStorage.setItem("fitway.locale", "en");
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () =>
		root.render(
			<I18nProvider>
				<Harness />
			</I18nProvider>,
		),
	);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	window.localStorage.clear();
	document.documentElement.lang = "";
	document.documentElement.dir = "";
});

it("applies lang and dir before publishing localized React content", async () => {
	const view = () => container.querySelector<HTMLElement>("[data-locale]");
	const instance = view()?.dataset.instance;
	expect(view()?.dataset).toMatchObject({
		locale: "en",
		documentLang: "en",
		documentDir: "ltr",
	});

	await act(async () => {
		container.querySelector<HTMLButtonElement>("button")?.click();
	});

	expect(view()?.dataset).toMatchObject({
		locale: "ar",
		documentLang: "ar",
		documentDir: "rtl",
		instance,
	});
	expect(container.querySelector("input")?.value).toBe("unsaved");
});

it("applies accepted storage locale updates in the same transaction", async () => {
	await act(async () => {
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "fitway.locale",
				newValue: "ar",
			}),
		);
	});
	const view = container.querySelector<HTMLElement>("[data-locale]");
	expect(view?.dataset).toMatchObject({
		locale: "ar",
		documentLang: "ar",
		documentDir: "rtl",
	});
});
