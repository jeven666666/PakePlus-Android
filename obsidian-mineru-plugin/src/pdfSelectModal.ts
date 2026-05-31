import { App, FuzzySuggestModal, TFile, TFolder } from "obsidian";

export class PdfSelectModal extends FuzzySuggestModal<TFile> {
	private onChoose: (files: TFile[]) => void;
	private selectedFiles: Set<TFile> = new Set();
	private confirmBtn: HTMLButtonElement;
	private listEl: HTMLElement;

	constructor(app: App, onChoose: (files: TFile[]) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder("搜索并选择 PDF 文件...");
		this.setInstructions([
			{ command: "↑↓", purpose: "导航" },
			{ command: "↵", purpose: "切换选中" },
			{ command: "esc", purpose: "取消" },
		]);
	}

	getItems(): TFile[] {
		return this.app.vault.getFiles().filter((f) => f.extension === "pdf");
	}

	getItemText(item: TFile): string {
		return item.path;
	}

	onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
		if (this.selectedFiles.has(item)) {
			this.selectedFiles.delete(item);
		} else {
			this.selectedFiles.add(item);
		}
		this.updateConfirmButton();
	}

	onOpen() {
		super.onOpen();
		const footer = this.modalEl.createDiv({ cls: "mineru-pdf-select-footer" });
		this.confirmBtn = footer.createEl("button", {
			text: "确认转换 (0)",
			cls: "mod-cta",
		});
		this.confirmBtn.addEventListener("click", () => {
			this.onChoose(Array.from(this.selectedFiles));
			this.close();
		});

		const selectAllBtn = footer.createEl("button", { text: "全选" });
		selectAllBtn.addEventListener("click", () => {
			this.selectedFiles = new Set(this.getItems());
			this.updateConfirmButton();
		});

		const clearBtn = footer.createEl("button", { text: "清空" });
		clearBtn.addEventListener("click", () => {
			this.selectedFiles.clear();
			this.updateConfirmButton();
		});
	}

	private updateConfirmButton() {
		if (this.confirmBtn) {
			this.confirmBtn.setText(`确认转换 (${this.selectedFiles.size})`);
		}
	}
}
