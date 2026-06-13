declare module "node-mac-auth" {
	export function canPromptTouchID(): boolean;

	export function promptTouchID(options: {
		reason: string;
		reuseDuration?: number;
	}): Promise<void>;
}

declare module "node-mac-auth/build/Release/auth.node" {
	export function canPromptTouchID(): boolean;

	export function promptTouchID(options: {
		reason: string;
		reuseDuration?: number;
	}): Promise<void>;
}
