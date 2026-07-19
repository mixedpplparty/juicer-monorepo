// API types are generated from the Rust backend's models via ts-rs —
// regenerate with `cargo test export_bindings` in src/server-rust.
// Do not hand-edit the ./generated directory.
export * from "./generated";

// The old backend serialized a discord.js GuildMember; the generated
// GuildMemberResponse is that endpoint's actual shape. Alias kept so client
// imports stay unchanged.
export type { GuildMemberResponse as GuildMember } from "./generated";

// Client-only UI types (not part of the API surface).
export type ToastProps = {
	type: "error" | "success" | "info" | null;
};

export type ToastObject = {
	idx: number;
	message: string;
	type: ToastProps["type"];
};
