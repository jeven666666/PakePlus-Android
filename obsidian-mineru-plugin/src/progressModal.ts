import { App, Modal } from "obsidian";
import type { TaskResult } from "./api";

interface ConvertItem {
	fileName: string;
	taskId?: string;
	status: "pending" | "uploading" | "processing" | "done" | "failed";
	progress?: string;
	errorMsg?: string;
}

export class ConvertProgressModal extends Modal {
	private items: ConvertItem[];
	private containerDiv: HTMLDivElement;
	private onCloseCallback?: () => void;

	constructor(app: App, items: ConvertItem[]) {
		super(app);
		this.items = items;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("mineru-progress-modal");

		contentEl.createEl("h2", { text: "MinerU PDF 转换进度" });

		this.containerDiv = contentEl.createDiv({ cls: "mineru-progress-list" });
		this.renderItems();
	}

	private renderItems() {
		this.containerDiv.empty();

		for (const item of this.items) {
			const row = this.containerDiv.createDiv({ cls: "mineru-progress-item" });

			const nameSpan = row.createSpan({ cls: "mineru-progress-name" });
			nameSpan.setText(item.fileName);

			const statusSpan = row.createSpan({ cls: `mineru-progress-status mineru-status-${item.status}` });

			switch (item.status) {
				case "pending":
					statusSpan.setText("⏳ 等待中");
					break;
				case "uploading":
					statusSpan.setText("📤 上传中...");
					break;
				case "processing":
					statusSpan.setText(item.progress || "⚙️ 处理中...");
					break;
				case "done":
					statusSpan.setText("✅ 完成");
					break;
				case "failed":
					statusSpan.setText(`❌ 失败: ${item.errorMsg || "未知错误"}`);
					break;
			}
		}

		const allDone = this.items.every(
			(i) => i.status === "done" || i.status === "failed"
		);
		if (allDone) {
			const successCount = this.items.filter((i) => i.status === "done").length;
			const failCount = this.items.filter((i) => i.status === "failed").length;
			const summary = this.containerDiv.createDiv({ cls: "mineru-progress-summary" });
			summary.setText(`转换完成！成功: ${successCount}, 失败: ${failCount}`);
		}
	}

	updateItem(index: number, updates: Partial<ConvertItem>) {
		if (index >= 0 && index < this.items.length) {
			Object.assign(this.items[index], updates);
			this.renderItems();
		}
	}

	updateProgress(index: number, result: TaskResult) {
		if (result.state === "running" && result.extract_progress) {
			const { extracted_pages, total_pages } = result.extract_progress;
			this.updateItem(index, {
				status: "processing",
				progress: `⚙️ 处理中 (${extracted_pages}/${total_pages} 页)`,
			});
		} else if (result.state === "converting") {
			this.updateItem(index, {
				status: "processing",
				progress: "⚙️ 格式转换中...",
			});
		}
	}

	markDone(index: number) {
		this.updateItem(index, { status: "done" });
	}

	markFailed(index: number, errorMsg: string) {
		this.updateItem(index, { status: "failed", errorMsg });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		if (this.onCloseCallback) {
			this.onCloseCallback();
		}
	}

	setOnClose(cb: () => void) {
		this.onCloseCallback = cb;
	}
}
