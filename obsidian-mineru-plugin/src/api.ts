import { requestUrl, RequestUrlParam } from "obsidian";
import type { MinerUSettings } from "./settings";

const BASE_URL = "https://mineru.net";

export interface TaskResult {
	task_id: string;
	state: "done" | "pending" | "running" | "failed" | "converting";
	full_zip_url?: string;
	err_msg?: string;
	extract_progress?: {
		extracted_pages: number;
		total_pages: number;
		start_time: string;
	};
	data_id?: string;
}

export interface BatchUploadResult {
	batch_id: string;
	file_urls: string[];
}

export class MinerUClient {
	constructor(private settings: MinerUSettings) {}

	private get headers(): Record<string, string> {
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.settings.apiToken}`,
		};
	}

	private async request(params: RequestUrlParam): Promise<any> {
		const response = await requestUrl(params);
		const data = response.json;
		if (data.code !== 0) {
			throw new Error(`MinerU API 错误: ${data.msg || JSON.stringify(data)}`);
		}
		return data;
	}

	async testConnection(): Promise<{ success: boolean; message: string }> {
		try {
			const data = await this.request({
				url: `${BASE_URL}/api/v4/file-urls/batch`,
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({
					files: [{ name: "test.pdf" }],
					model_version: "vlm",
				}),
			});
			return { success: true, message: `连接成功! batch_id: ${data.data.batch_id}` };
		} catch (err: any) {
			return { success: false, message: `连接失败: ${err.message}` };
		}
	}

	async batchUpload(fileNames: string[]): Promise<BatchUploadResult> {
		const files = fileNames.map((name) => ({ name }));
		const data = await this.request({
			url: `${BASE_URL}/api/v4/file-urls/batch`,
			method: "POST",
			headers: this.headers,
			body: JSON.stringify({
				files,
				model_version: this.settings.modelVersion,
				is_ocr: this.settings.isOcr,
				enable_formula: this.settings.enableFormula,
				enable_table: this.settings.enableTable,
				language: this.settings.language,
			}),
		});
		return {
			batch_id: data.data.batch_id,
			file_urls: data.data.file_urls,
		};
	}

	async uploadFile(uploadUrl: string, fileData: ArrayBuffer): Promise<void> {
		console.log("[MinerU] 开始上传文件...");
		console.log(`[MinerU] 上传 URL: ${uploadUrl.substring(0, 80)}...`);
		console.log(`[MinerU] 文件大小: ${fileData.byteLength} bytes`);

		let httpsMod: any;
		try {
			httpsMod = require("https");
			console.log("[MinerU] https 模块加载成功");
		} catch (e) {
			console.error("[MinerU] https 模块加载失败，回退到 requestUrl:", e);
			const response = await requestUrl({
				url: uploadUrl,
				method: "PUT",
				body: fileData,
			});
			if (response.status >= 400) {
				throw new Error(`上传失败(requestUrl): HTTP ${response.status}`);
			}
			console.log(`[MinerU] requestUrl 上传成功, 状态码: ${response.status}`);
			return;
		}

		const NodeBuffer = require("buffer").Buffer;

		const urlObj = new URL(uploadUrl);

		return new Promise<void>((resolve, reject) => {
			const view = new Uint8Array(fileData);
			const buffer = NodeBuffer.from(view.buffer, view.byteOffset, view.byteLength);

			console.log(`[MinerU] Buffer 大小: ${buffer.length} bytes`);

			const options = {
				hostname: urlObj.hostname,
				port: urlObj.port || 443,
				path: urlObj.pathname + urlObj.search,
				method: "PUT",
				headers: {
					"Content-Length": buffer.length,
				},
				timeout: 120000,
			};

			console.log(`[MinerU] 发送 PUT 请求到 ${urlObj.hostname}`);

			const req = httpsMod.request(options, (res: any) => {
				console.log(`[MinerU] 收到响应: HTTP ${res.statusCode}`);
				const chunks: any[] = [];
				res.on("data", (chunk: any) => chunks.push(chunk));
				res.on("end", () => {
					const body = NodeBuffer.concat(chunks).toString("utf8").substring(0, 200);
					console.log(`[MinerU] 响应体: ${body}`);
					if (res.statusCode >= 200 && res.statusCode < 300) {
						console.log("[MinerU] 文件上传成功!");
						resolve();
					} else {
						reject(new Error(`上传失败: HTTP ${res.statusCode} - ${body}`));
					}
				});
			});

			req.on("error", (err: Error) => {
				console.error(`[MinerU] 上传请求错误: ${err.message}`);
				reject(new Error(`上传失败: ${err.message}`));
			});

			req.on("timeout", () => {
				console.error("[MinerU] 上传超时!");
				req.destroy();
				reject(new Error("上传超时"));
			});

			req.write(buffer);
			req.end();
		});
	}

	async createTask(fileUrl: string, dataId?: string): Promise<string> {
		console.log(`[MinerU] 创建任务, URL: ${fileUrl.substring(0, 60)}...`);
		const body: Record<string, any> = {
			url: fileUrl,
			model_version: this.settings.modelVersion,
			is_ocr: this.settings.isOcr,
			enable_formula: this.settings.enableFormula,
			enable_table: this.settings.enableTable,
			language: this.settings.language,
		};
		if (dataId) {
			body.data_id = dataId;
		}
		const data = await this.request({
			url: `${BASE_URL}/api/v4/extract/task`,
			method: "POST",
			headers: this.headers,
			body: JSON.stringify(body),
		});
		console.log(`[MinerU] 任务创建成功, task_id: ${data.data.task_id}`);
		return data.data.task_id;
	}

	async getTaskResult(taskId: string): Promise<TaskResult> {
		const data = await this.request({
			url: `${BASE_URL}/api/v4/extract/task/${taskId}`,
			method: "GET",
			headers: this.headers,
		});
		return data.data;
	}

	async waitForTask(
		taskId: string,
		onProgress?: (result: TaskResult) => void
	): Promise<TaskResult> {
		return new Promise((resolve, reject) => {
			const poll = async () => {
				try {
					const result = await this.getTaskResult(taskId);
					console.log(`[MinerU] 任务状态: ${result.state}`);
					if (result.state === "done") {
						resolve(result);
						return;
					}
					if (result.state === "failed") {
						reject(new Error(`任务失败: ${result.err_msg || "未知错误"}`));
						return;
					}
					if (onProgress) {
						onProgress(result);
					}
					setTimeout(poll, this.settings.pollInterval);
				} catch (err) {
					reject(err);
				}
			};
			poll();
		});
	}

	async downloadZip(zipUrl: string): Promise<ArrayBuffer> {
		const response = await requestUrl({
			url: zipUrl,
			method: "GET",
		});
		return response.arrayBuffer;
	}
}
