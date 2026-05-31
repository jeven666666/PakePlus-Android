import {
	Notice,
	Plugin,
	TFile,
	TFolder,
	requestUrl,
} from "obsidian";
import { MinerUClient } from "./src/api";
import { DEFAULT_SETTINGS, type MinerUSettings } from "./src/settings";
import { MinerUSettingTab } from "./src/settingsTab";
import { ConvertProgressModal } from "./src/progressModal";
import { PdfSelectModal } from "./src/pdfSelectModal";

export default class MinerUPlugin extends Plugin {
	settings: MinerUSettings = DEFAULT_SETTINGS;
	client: MinerUClient;

	async onload() {
		await this.loadSettings();
		this.client = new MinerUClient(this.settings);

		this.addCommand({
			id: "mineru-test-connection",
			name: "测试 MinerU API 连接",
			callback: () => this.testConnection(),
		});

		this.addCommand({
			id: "mineru-convert-selected-pdf",
			name: "转换选中的 PDF 文件",
			callback: () => this.convertSelectedPdfs(),
		});

		this.addCommand({
			id: "mineru-convert-all-pdfs",
			name: "转换 Vault 中所有 PDF",
			callback: () => this.convertAllPdfs(),
		});

		this.addCommand({
			id: "mineru-convert-current-folder",
			name: "转换当前文件夹中的 PDF",
			callback: () => this.convertCurrentFolderPdfs(),
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFile && file.extension === "pdf") {
					menu.addItem((item) => {
						item.setTitle("MinerU: 转换为 Markdown")
							.setIcon("file-text")
							.onClick(() => this.convertFiles([file]));
					});
				}
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item.setTitle("MinerU: 转换文件夹中的 PDF")
							.setIcon("folder")
							.onClick(() => this.convertFolderPdfs(file));
					});
				}
			})
		);

		this.addSettingTab(new MinerUSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.client = new MinerUClient(this.settings);
	}

	private validateToken(): boolean {
		if (!this.settings.apiToken) {
			new Notice("请先在设置中填写 MinerU API Token");
			return false;
		}
		return true;
	}

	private async testConnection() {
		if (!this.validateToken()) return;

		new Notice("正在测试连接...");
		try {
			const result = await this.client.testConnection();
			if (result.success) {
				new Notice(`✅ ${result.message}`);
				console.log("[MinerU] 测试连接成功:", result.message);
			} else {
				new Notice(`❌ ${result.message}`);
				console.error("[MinerU] 测试连接失败:", result.message);
			}
		} catch (err: any) {
			new Notice(`❌ 测试异常: ${err.message}`);
			console.error("[MinerU] 测试连接异常:", err);
		}
	}

	private async ensureOutputFolder(): Promise<TFolder | null> {
		const folderPath = this.settings.outputFolder;
		const existing = this.app.vault.getAbstractFileByPath(folderPath);
		if (existing instanceof TFolder) {
			return existing;
		}
		if (this.settings.autoCreateFolder) {
			await this.app.vault.createFolder(folderPath);
			const created = this.app.vault.getAbstractFileByPath(folderPath);
			return created instanceof TFolder ? created : null;
		}
		new Notice(`输出文件夹 "${folderPath}" 不存在，请在设置中开启自动创建或手动创建`);
		return null;
	}

	private async convertSelectedPdfs() {
		if (!this.validateToken()) return;
		const modal = new PdfSelectModal(this.app, (files) => {
			this.convertFiles(files);
		});
		modal.open();
	}

	private async convertAllPdfs() {
		if (!this.validateToken()) return;
		const pdfFiles = this.app.vault.getFiles().filter((f) => f.extension === "pdf");
		if (pdfFiles.length === 0) {
			new Notice("Vault 中没有 PDF 文件");
			return;
		}
		this.convertFiles(pdfFiles);
	}

	private async convertCurrentFolderPdfs() {
		if (!this.validateToken()) return;
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("请先打开一个文件以确定当前文件夹");
			return;
		}
		const parentFolder = activeFile.parent;
		if (!parentFolder) return;
		this.convertFolderPdfs(parentFolder);
	}

	private async convertFolderPdfs(folder: TFolder) {
		if (!this.validateToken()) return;
		const pdfFiles = folder.children
			.filter((f): f is TFile => f instanceof TFile && f.extension === "pdf");
		if (pdfFiles.length === 0) {
			new Notice(`文件夹 "${folder.path}" 中没有 PDF 文件`);
			return;
		}
		this.convertFiles(pdfFiles);
	}

	private async convertFiles(pdfFiles: TFile[]) {
		if (pdfFiles.length === 0) {
			new Notice("没有选择 PDF 文件");
			return;
		}

		const outputFolder = await this.ensureOutputFolder();
		if (!outputFolder) return;

		const items = pdfFiles.map((f) => ({
			fileName: f.name,
			file: f,
			status: "pending" as const,
			progress: "",
			errorMsg: "",
		}));

		const progressItems: Array<{
			fileName: string;
			status: "pending" | "uploading" | "processing" | "done" | "failed";
		}> = items.map((i) => ({
			fileName: i.fileName,
			status: "pending" as const,
		}));

		const modal = new ConvertProgressModal(this.app, progressItems);
		modal.open();

		new Notice(`开始转换 ${pdfFiles.length} 个 PDF 文件...`);

		const BATCH_SIZE = 50;
		for (let batchStart = 0; batchStart < items.length; batchStart += BATCH_SIZE) {
			const batch = items.slice(batchStart, batchStart + BATCH_SIZE);
			const batchIndices = batch.map((_, i) => batchStart + i);

			try {
				for (let i = 0; i < batch.length; i++) {
					modal.updateItem(batchIndices[i], { status: "uploading" });
				}

				const fileNames = batch.map((item) => item.fileName);
				const uploadResult = await this.client.batchUpload(fileNames);

				for (let i = 0; i < batch.length; i++) {
					const item = batch[i];
					const uploadUrl = uploadResult.file_urls[i];

					try {
						const fileData = await this.app.vault.readBinary(item.file);
						await this.client.uploadFile(uploadUrl, fileData);
					} catch (err) {
						modal.markFailed(
							batchIndices[i],
							`上传失败: ${err.message}`
						);
						batch[i] = null as any;
					}
				}

				const validItems = batch.filter((item) => item !== null);
				const validIndices = batchIndices.filter(
					(_, i) => batch[i] !== null
				);

				// 为每个成功上传的文件创建任务并轮询
				const taskPromises = validItems.map(async (item, i) => {
					const globalIndex = validIndices[i];
					const uploadUrl = uploadResult.file_urls[validIndices[i] - batchStart];
					
					modal.updateItem(globalIndex, {
						status: "processing",
						progress: "⚙️ 等待处理...",
					});

					try {
						const taskId = await this.client.createTask(uploadUrl);
						
						const maxWaitTime = 10 * 60 * 1000;
						const startTime = Date.now();

						return new Promise<void>(async (resolve, reject) => {
							const poll = async () => {
								if (Date.now() - startTime > maxWaitTime) {
									modal.markFailed(globalIndex, "超时（10分钟）");
									resolve();
									return;
								}

								try {
									const result = await this.client.getTaskResult(taskId);

									if (result.state === "done" && result.full_zip_url) {
										await this.downloadAndSave(
											result.full_zip_url,
											item.fileName,
											outputFolder
										);
										modal.markDone(globalIndex);

										if (this.settings.deletePdfAfterConvert) {
											await this.app.vault.delete(item.file);
										}
										resolve();
										return;
									}

									if (result.state === "failed") {
										modal.markFailed(
											globalIndex,
											result.err_msg || "处理失败"
										);
										resolve();
										return;
									}

									modal.updateProgress(globalIndex, result);
									setTimeout(poll, this.settings.pollInterval);
								} catch (err) {
									modal.markFailed(globalIndex, err.message);
									resolve();
								}
							};
							poll();
						});
					} catch (err) {
						modal.markFailed(globalIndex, `创建任务失败: ${err.message}`);
					}
				});

				await Promise.all(taskPromises);
			} catch (err) {
				for (const idx of batchIndices) {
					modal.markFailed(idx, `批量操作失败: ${err.message}`);
				}
			}
		}

		const successCount = progressItems.filter(
			(i) => i.status === "done"
		).length;
		new Notice(`转换完成！成功 ${successCount}/${pdfFiles.length}`);
	}

	private async downloadAndSave(
		zipUrl: string,
		originalFileName: string,
		outputFolder: TFolder
	) {
		const zipData = await this.client.downloadZip(zipUrl);
		const mdContent = await this.extractMdFromZip(zipData);

		if (!mdContent) {
			throw new Error("ZIP 中未找到 Markdown 文件");
		}

		const baseName = originalFileName.replace(/\.pdf$/i, "");
		const mdFileName = `${baseName}.md`;
		const mdFilePath = `${outputFolder.path}/${mdFileName}`;

		const existing = this.app.vault.getAbstractFileByPath(mdFilePath);
		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, mdContent);
		} else {
			await this.app.vault.create(mdFilePath, mdContent);
		}
	}

	private async extractMdFromZip(zipData: ArrayBuffer): Promise<string | null> {
		try {
			const JSZip = await this.loadJSZip();
			const zip = await JSZip.loadAsync(zipData);

			let mdContent: string | null = null;

			const files = Object.keys(zip.files);
			const mdFile = files.find(
				(f) => f.endsWith("full.md") || f.endsWith(".md")
			);

			if (mdFile) {
				mdContent = await zip.files[mdFile].async("string");
			}

			return mdContent;
		} catch (err) {
			console.error("解压 ZIP 失败:", err);
			throw new Error(`解压失败: ${err.message}`);
		}
	}

	private async loadJSZip(): Promise<any> {
		if ((window as any).JSZip) {
			return (window as any).JSZip;
		}

		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
			script.onload = () => {
				if ((window as any).JSZip) {
					resolve((window as any).JSZip);
				} else {
					reject(new Error("JSZip 加载失败"));
				}
			};
			script.onerror = () => reject(new Error("JSZip 脚本加载失败"));
			document.head.appendChild(script);
		});
	}
}
