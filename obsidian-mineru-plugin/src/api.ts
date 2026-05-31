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
		await requestUrl({
			url: uploadUrl,
			method: "PUT",
			headers: {
				"Content-Type": "application/pdf",
			},
			body: fileData,
		});
	}

	async createTask(fileUrl: string, dataId?: string): Promise<string> {
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
