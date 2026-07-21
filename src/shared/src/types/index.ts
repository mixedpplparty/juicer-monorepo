// API types are generated from the Rust backend's models via ts-rs —
// regenerate with `cargo test export_bindings` in src/server-rust.
// Do not hand-edit the ./generated directory.

// POST /games/create returns the inserted game row.
export type { GameWithoutRelations as CreateGameResponse } from "./generated";
export * from "./generated";

// Client-only UI types (not part of the API surface).
export type ToastProps = {
	type: "error" | "success" | "info" | null;
};

export type ToastObject = {
	idx: number;
	message: string;
	type: ToastProps["type"];
};
