export interface MinerUSettings {
	apiToken: string;
	modelVersion: string;
	outputFolder: string;
	enableFormula: boolean;
	enableTable: boolean;
	isOcr: boolean;
	language: string;
	pollInterval: number;
	autoCreateFolder: boolean;
	deletePdfAfterConvert: boolean;
}

export const DEFAULT_SETTINGS: MinerUSettings = {
	apiToken: "",
	modelVersion: "vlm",
	outputFolder: "MinerU-Output",
	enableFormula: true,
	enableTable: true,
	isOcr: false,
	language: "ch",
	pollInterval: 5000,
	autoCreateFolder: true,
	deletePdfAfterConvert: false,
};
