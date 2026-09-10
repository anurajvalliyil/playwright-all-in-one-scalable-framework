import fs from "fs";
import path from "path";

const logDir = path.resolve("./logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const pipelineLogFile = path.join(logDir, "pipeline.jsonl");

export const logEvent = (event: any) => {
  const ts = new Date().toISOString();
  const entry = { ts, ...event };
  fs.appendFileSync(pipelineLogFile, JSON.stringify(entry) + "\n");
};

export const consoleLog = (message: string) => {
  const ts = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
  console.log(`[${ts}] ${message}`);
};
