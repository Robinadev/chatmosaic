import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type Assistant = { id: string; organizationName: string; welcomeMessage: string; primaryColor: string; websiteUrl: string; public: boolean };
export type StoredDocument = { id: string; name: string; size: number; type: string; text: string; createdAt: string };
type Store = { assistant: Assistant; documents: StoredDocument[] };
const filePath = path.join(process.cwd(), "data", "chatmosaic.json");
const initial: Store = { assistant: { id: "greenway-aid", organizationName: "Greenway Aid", welcomeMessage: "Hi there! I’m here to help with questions about Greenway Aid. What would you like to know?", primaryColor: "#477b5d", websiteUrl: "", public: true }, documents: [] };

async function readStore(): Promise<Store> {
  try { return { ...initial, ...JSON.parse(await readFile(filePath, "utf8")) }; }
  catch { return initial; }
}
async function writeStore(store: Store) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}
export async function getAssistant() { return (await readStore()).assistant; }
export async function saveAssistant(assistant: Assistant) { const store = await readStore(); store.assistant = assistant; await writeStore(store); return assistant; }
export async function getDocuments() { return (await readStore()).documents; }
export async function addDocument(document: StoredDocument) { const store = await readStore(); store.documents.unshift(document); await writeStore(store); return document; }
export async function removeDocument(id: string) { const store = await readStore(); store.documents = store.documents.filter((document) => document.id !== id); await writeStore(store); }
