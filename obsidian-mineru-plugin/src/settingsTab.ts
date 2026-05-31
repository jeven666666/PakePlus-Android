import { App, PluginSettingTab, Setting } from "obsidian";
import type MinerUPlugin from "../main";
import type { MinerUSettings } from "./settings";

export class MinerUSettingTab extends PluginSettingTab {
	plugin: MinerUPlugin;

	constructor(app: App, plugin: MinerUPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "MinerU PDF Converter 设置" });

		new Setting(containerEl)
			.setName("API Token")
			.setDesc("在 mineru.net 获取的 API Token")
			.addText((text) =>
				text
					.setPlaceholder("输入你的 MinerU API Token")
					.setValue(this.plugin.settings.apiToken)
					.onChange(async (value) => {
						this.plugin.settings.apiToken = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("模型版本")
			.setDesc("pipeline: 默认模型; vlm: 推荐模型(更准确); MinerU-HTML: HTML文件专用")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("pipeline", "pipeline (默认)")
					.addOption("vlm", "vlm (推荐)")
					.addOption("MinerU-HTML", "MinerU-HTML (HTML专用)")
					.setValue(this.plugin.settings.modelVersion)
					.onChange(async (value: string) => {
						this.plugin.settings.modelVersion = value as MinerUSettings["modelVersion"];
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("输出文件夹")
			.setDesc("转换后的 Markdown 文件保存到 Vault 中的哪个文件夹")
			.addText((text) =>
				text
					.setPlaceholder("MinerU-Output")
					.setValue(this.plugin.settings.outputFolder)
					.onChange(async (value) => {
						this.plugin.settings.outputFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("启用公式识别")
			.setDesc("开启后将识别文档中的数学公式")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableFormula)
					.onChange(async (value) => {
						this.plugin.settings.enableFormula = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("启用表格识别")
			.setDesc("开启后将识别文档中的表格")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTable)
					.onChange(async (value) => {
						this.plugin.settings.enableTable = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("启用 OCR")
			.setDesc("开启后对扫描件进行 OCR 识别（仅 pipeline/vlm 模型有效）")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.isOcr)
					.onChange(async (value) => {
						this.plugin.settings.isOcr = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("文档语言")
			.setDesc("文档主要语言，影响识别效果。ch=中文, en=英文")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("ch", "中文 (ch)")
					.addOption("en", "英文 (en)")
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("轮询间隔 (毫秒)")
			.setDesc("查询任务状态的间隔时间，默认 5000ms")
			.addSlider((slider) =>
				slider
					.setLimits(2000, 30000, 1000)
					.setValue(this.plugin.settings.pollInterval)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.pollInterval = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("自动创建输出文件夹")
			.setDesc("如果输出文件夹不存在，自动创建")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoCreateFolder)
					.onChange(async (value) => {
						this.plugin.settings.autoCreateFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("转换后删除原 PDF")
			.setDesc("转换成功后自动删除 Vault 中的原 PDF 文件（谨慎开启）")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.deletePdfAfterConvert)
					.onChange(async (value) => {
						this.plugin.settings.deletePdfAfterConvert = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
