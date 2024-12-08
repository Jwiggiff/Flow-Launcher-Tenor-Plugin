import childProcess from "child_process";
import { z } from "zod";
import { Flow, JSONRPCResponse } from "flow-launcher-helper";
import logger from "./lib/logger";
import { TenorResult } from "./lib/types";
import path from "path";
import os from "os";
import fs from "fs";

// The events are the custom events that you define in the flow.on() method.
const events = ["copy_result"] as const;
type Events = (typeof events)[number];

const flow = new Flow<Events>("assets/icon.png");

flow.on("query", async (params) => {
	const { api_key } = flow.settings;
	if (!api_key) {
		flow.showResult({
			title: "No API key set",
			subtitle: "Please set your API key in the settings",
		});
		return;
	}

	const [query] = z.array(z.string()).parse(params);

	if (query.length < 3) {
		return flow.showResult({
			title: "Query too short",
			subtitle: "Please enter at least 3 characters",
		});
	}

	try {
		const results = await getResults(query, api_key);

		const resultsToSend: JSONRPCResponse<Events>[] = [];
		results.forEach((result, i) => {
			resultsToSend.push({
				iconPath: result.media_formats.gifpreview.url,
				title: result.title || result.content_description,
				subtitle: result.content_description,
				method: "copy_result" as const,
				params: [result.media_formats.gif.url],
				score: results.length - i,
			});
		});

		flow.showResult(...resultsToSend);
	} catch (error) {
		if (error instanceof Error)
			return flow.showResult({
				title: "Error",
				subtitle: error.message,
			});
	}
});

async function getResults(query: string, api_key: string): Promise<TenorResult[]> {
	const response = await fetch(
		`https://tenor.googleapis.com/v2/search?q=${query}&key=${api_key}&client_key=flow_tenor_plugin&limit=10`
	);
	if (!response.ok) {
		throw new Error(`Failed to fetch results: ${response.statusText}`);
	}
	const data = await response.json();
	return data.results as TenorResult[];
}

const copyImageToClipboard = async (url: string) => {
	try {
		// Download image to temp file
		const response = await fetch(url);
		if (!response.ok) throw new Error("Failed to fetch image");
		const buffer = Buffer.from(await response.arrayBuffer());

		const tempFile = path.join(os.tmpdir(), `flow-tenor-${Date.now()}.gif`);
		await fs.promises.writeFile(tempFile, buffer);

		// Copy to clipboard using PowerShell
		const psScript = `
			Add-Type -AssemblyName System.Windows.Forms
			$files = New-Object System.Collections.Specialized.StringCollection
			$files.Add('${tempFile}')
			[System.Windows.Forms.Clipboard]::SetFileDropList($files)
		`;

		childProcess.spawn("powershell", ["-command", psScript]);
	} catch (error) {
		logger.error("Failed to copy image to clipboard:", error);
	}
};

flow.on("copy_result", async (params) => {
	const [url] = z.array(z.string()).parse(params);
	await copyImageToClipboard(url);
});

flow.run();
