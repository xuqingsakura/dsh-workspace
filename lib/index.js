import { mkdir, open, opendir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { execFile, spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
//#region src/terminal.ts
/**
* Persistent shell sessions for the workbench terminal UI. Each session is a
* plain child process over stdio pipes (no PTY), keyed by session scope and a
* gateway-minted id; output is buffered and consumed incrementally so the UI
* can poll for deltas. Windows prefers PowerShell 7 (`pwsh`) and falls back
* to Windows PowerShell (`powershell.exe`); POSIX uses bash and then sh.
* @module @deepseek-ai/dsh-host-workbench/terminal
*/
/** Ordered shell candidates for the current platform. */
function shellCandidates() {
	if (process.platform === "win32") return [{
		file: "pwsh.exe",
		args: [
			"-NoLogo",
			"-NoProfile",
			"-ExecutionPolicy",
			"Bypass",
			"-NoExit",
			"-Command",
			"[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); $OutputEncoding = [System.Text.UTF8Encoding]::new($false)"
		]
	}, {
		file: "powershell.exe",
		args: [
			"-NoLogo",
			"-NoProfile",
			"-ExecutionPolicy",
			"Bypass",
			"-NoExit",
			"-Command",
			"[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); $OutputEncoding = [System.Text.UTF8Encoding]::new($false)"
		]
	}];
	return [{
		file: "bash",
		args: [
			"--noprofile",
			"--norc",
			"-i"
		]
	}, {
		file: "sh",
		args: []
	}];
}
/** Probe arguments that make a shell exit immediately (used for PATH probes). */
function probeArgs() {
	if (process.platform === "win32") return [
		"-NoLogo",
		"-NoProfile",
		"-Command",
		"exit 0"
	];
	return ["-c", "exit 0"];
}
/**
* Probe whether a shell candidate resolves on PATH.
*
* The probe must be synchronous: spawn() reports ENOENT through the async
* 'error' event, which a caller checking the return value never sees, so the
* old pickShell always picked the first candidate even when it was missing.
* spawnSync() throws ENOENT synchronously, so a missing candidate is
* detected here and skipped.
* @param candidate - the shell candidate to probe.
* @returns true when the probe process starts and exits cleanly.
*/
function probeShell(candidate) {
	try {
		return spawnSync(candidate.file, probeArgs(), {
			stdio: "ignore",
			windowsHide: true,
			timeout: 5e3
		}).error === void 0;
	} catch {
		return false;
	}
}
/**
* Pick the first shell candidate present on PATH.
* @param probe - PATH probe override (test seam); defaults to probeShell.
* @returns the first candidate whose probe succeeds, or the first candidate
* when none resolve (the spawn itself then surfaces the failure).
*/
function pickShell(probe = probeShell) {
	for (const candidate of shellCandidates()) if (probe(candidate)) return candidate;
	return shellCandidates()[0];
}
/**
* Session-scoped terminal registry: spawns shells, buffers output, and clears
* every process when the owning gateway disposes.
*/
var WorkbenchTerminalHost = class {
	terminals = /* @__PURE__ */ new Map();
	counters = /* @__PURE__ */ new Map();
	/**
	* Spawn one persistent shell for a session scope.
	* @param sessionId - the conversation scope owning the terminal.
	* @param cwd - initial working directory; falls back to the session cwd when absent.
	* @returns the minted session and the shell program name.
	*/
	spawn(sessionId, cwd) {
		const { file, args } = pickShell();
		const workingDir = cwd !== void 0 && existsSync(cwd) ? cwd : process.cwd();
		const child = spawn(file, [...args], {
			cwd: workingDir,
			env: {
				...process.env,
				NO_COLOR: "1"
			},
			windowsHide: true
		});
		const id = String(this.counters.get(sessionId) ?? 0);
		this.counters.set(sessionId, (this.counters.get(sessionId) ?? 0) + 1);
		const record = {
			process: child,
			buffer: "",
			exited: false,
			exitCode: null
		};
		const sessionMap = this.terminals.get(sessionId) ?? /* @__PURE__ */ new Map();
		sessionMap.set(id, record);
		this.terminals.set(sessionId, sessionMap);
		const append = (chunk) => {
			record.buffer += chunk.toString("utf8");
		};
		child.stdout.on("data", append);
		child.stderr.on("data", append);
		child.on("error", (error) => {
			record.buffer += `[shell error] ${error.message}\n`;
		});
		child.on("exit", (code) => {
			record.exited = true;
			record.exitCode = code;
		});
		return {
			session: {
				id,
				status: "running",
				exitCode: null
			},
			shell: file
		};
	}
	/**
	* Write raw input to one terminal's stdin.
	* @param sessionId - the owning conversation scope.
	* @param id - the terminal id.
	* @param data - bytes to write.
	*/
	write(sessionId, id, data) {
		const record = this.expect(sessionId, id);
		if (record.exited) throw new Error(`workbench: terminal ${id} has exited`);
		record.process.stdin.write(data);
	}
	/**
	* Consume the output produced since the previous read.
	* @param sessionId - the owning conversation scope.
	* @param id - the terminal id.
	* @returns the incremental output plus the session snapshot.
	*/
	read(sessionId, id) {
		const record = this.expect(sessionId, id);
		const delta = record.buffer;
		record.buffer = "";
		return {
			delta,
			session: {
				id,
				status: record.exited ? "exited" : "running",
				exitCode: record.exitCode
			}
		};
	}
	/**
	* Terminate one terminal and drop its record. Unknown ids are a no-op.
	* @param sessionId - the owning conversation scope.
	* @param id - the terminal id.
	* @returns after the process tree has exited.
	*/
	async close(sessionId, id) {
		const sessionMap = this.terminals.get(sessionId);
		const record = sessionMap?.get(id);
		if (record === void 0) return;
		await this.killTree(record);
		sessionMap?.delete(id);
		if (sessionMap?.size === 0) this.terminals.delete(sessionId);
	}
	/**
	* Terminate every terminal owned by one session scope.
	* @param sessionId - the owning conversation scope.
	* @returns after every process tree has exited.
	*/
	async closeSession(sessionId) {
		const sessionMap = this.terminals.get(sessionId);
		if (sessionMap === void 0) return;
		await Promise.all([...sessionMap.values()].map((record) => this.killTree(record)));
		this.terminals.delete(sessionId);
	}
	/**
	* Terminate every terminal across all scopes (gateway disposal).
	* @returns after every process tree has exited.
	*/
	async dispose() {
		const all = [...this.terminals.values()].flatMap((sessionMap) => [...sessionMap.values()]);
		await Promise.all(all.map((record) => this.killTree(record)));
		this.terminals.clear();
		this.counters.clear();
	}
	expect(sessionId, id) {
		const record = this.terminals.get(sessionId)?.get(id);
		if (record === void 0) throw new Error(`workbench: unknown terminal ${id}`);
		return record;
	}
	killTree(record) {
		if (record.exited) return Promise.resolve();
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				record.process.off("exit", onExit);
				record.process.off("error", onError);
				record.process.stdin.end();
				resolve();
			}, 3e3);
			const cleanup = () => {
				clearTimeout(timer);
				record.process.off("exit", onExit);
				record.process.off("error", onError);
				record.process.stdin.end();
				resolve();
			};
			const onExit = () => {
				cleanup();
			};
			const onError = () => {
				cleanup();
			};
			record.process.once("exit", onExit);
			record.process.once("error", onError);
			if (process.platform === "win32") try {
				if (spawnSync("taskkill", [
					"/pid",
					String(record.process.pid),
					"/T",
					"/F"
				], { windowsHide: true }).status !== 0) record.process.kill();
			} catch {
				record.process.kill();
			}
			else record.process.kill("SIGTERM");
		});
	}
};
//#endregion
//#region src/git.ts
/**
* Git 命令执行层：工作台 Git 面板的 host 侧实现。所有 verb 在会话 cwd
* 下运行系统 `git`（带 `--no-color`），返回结构化投影（status / diff / log /
* branches）以及变更操作（add / restore / commit / checkout / fetch / pull / push）。
* 非零退出不会 reject，而是返回捕获的 stdout/stderr，由调用方决定报错文案。
* @module dsh-workbench-window/git
*/
/** `git status --porcelain` 索引列(X)到变更类型的映射。 */
function indexKind(code) {
	switch (code) {
		case "A": return "added";
		case "M": return "modified";
		case "D": return "deleted";
		case "R": return "renamed";
		case "C": return "renamed";
		case "T": return "modified";
		case "U": return "modified";
		default: return;
	}
}
/** `git status --porcelain` 工作区列(Y)到变更类型的映射。 */
function worktreeKind(code) {
	switch (code) {
		case "M": return "modified";
		case "D": return "deleted";
		case "T": return "modified";
		case "U": return "modified";
		default: return;
	}
}
/** 解析 `git status --porcelain=v1 -z` 的 NUL 分割字段为有序变更列表。 */
function parsePorcelain(parts) {
	const changes = [];
	for (let i = 0; i < parts.length; i += 1) {
		const part = parts[i];
		if (part.length < 3) continue;
		const xy = part.slice(0, 2);
		const path = part.slice(3);
		if (xy === "??") {
			changes.push({
				path,
				staged: false,
				kind: "untracked"
			});
			continue;
		}
		if (xy[0] === "R" || xy[0] === "C") {
			const destination = parts[i + 1] ?? path;
			i += 1;
			changes.push({
				path: destination,
				staged: xy[1] !== " ",
				kind: "renamed"
			});
			continue;
		}
		const kind = indexKind(xy[0]) ?? worktreeKind(xy[1]);
		if (kind === void 0) continue;
		changes.push({
			path,
			staged: xy[0] !== " ",
			kind
		});
	}
	return changes;
}
/** 解析 `git log --format` 中按单元分隔符(\u001f)切分的记录。 */
function parseLog(records) {
	const entries = [];
	for (const record of records) {
		if (record === "") continue;
		const [hash = "", shortHash = "", author = "", date = "", message = "", parentLine = ""] = record.split("");
		const parents = parentLine === "" ? [] : parentLine.split(" ");
		entries.push({
			hash,
			shortHash,
			author,
			date,
			message,
			parents
		});
	}
	return entries;
}
/**
* 在指定工作目录运行一条 git 命令。
* @param cwd - 仓库工作目录。
* @param args - git 参数（不含开头的 `git`）。
* @returns 捕获结果；非零退出不 reject。
*/
function runGit(cwd, args) {
	return new Promise((resolve) => {
		execFile("git", [
			"-c",
			"color.ui=false",
			...args
		], {
			cwd,
			maxBuffer: 67108864,
			windowsHide: true,
			encoding: "utf8"
		}, (error, stdout, stderr) => {
			if (error === null) {
				resolve({
					stdout,
					stderr: "",
					code: 0
				});
				return;
			}
			resolve({
				stdout,
				stderr,
				code: typeof error.code === "number" ? error.code : 1
			});
		});
	});
}
/** 投影一个 git 工作树的状态（是否仓库、当前分支、变更列表）。 */
async function gitStatus(cwd) {
	const insideResult = await runGit(cwd, ["rev-parse", "--is-inside-work-tree"]);
	if (!(insideResult.code === 0 && insideResult.stdout.trim() === "true")) return {
		isRepo: false,
		branch: "",
		changes: []
	};
	const branchResult = await runGit(cwd, [
		"rev-parse",
		"--abbrev-ref",
		"HEAD"
	]);
	const branch = branchResult.code === 0 ? branchResult.stdout.trim() : "";
	const statusResult = await runGit(cwd, [
		"status",
		"--porcelain=v1",
		"-z"
	]);
	return {
		isRepo: true,
		branch,
		changes: statusResult.code === 0 ? parsePorcelain(statusResult.stdout.split("\0")) : []
	};
}
/** 投影一个路径（或整棵树）的统一 diff。 */
async function gitDiff(cwd, path, staged) {
	const args = ["diff", "--unified=3"];
	if (staged) args.push("--cached");
	if (path !== void 0) args.push("--", path);
	const result = await runGit(cwd, args);
	const binary = /^Binary files .* differ$/m.test(result.stdout) || /^GIT binary patch$/m.test(result.stdout);
	return {
		diff: result.stdout,
		binary
	};
}
/** 最近的提交历史（最新在前）。 */
async function gitLog(cwd, limit) {
	const result = await runGit(cwd, [
		"log",
		`-n ${String(limit)}`,
		"--pretty=format:%H%x1f%h%x1f%an%x1f%aI%x1f%s%x1f%P"
	]);
	return result.code === 0 ? parseLog(result.stdout.split("\n")) : [];
}
/** 本地分支列表，当前检出分支带标记。 */
async function gitBranches(cwd) {
	const result = await runGit(cwd, ["branch"]);
	if (result.code !== 0) return [];
	return result.stdout.split("\n").filter((line) => line.trim() !== "").map((line) => {
		const current = line.startsWith("*");
		return {
			name: line.slice(2).trim(),
			current
		};
	});
}
/** 把一次 git 失败包装为带捕获 stderr 的错误。 */
function gitFailure(operation, result) {
	const detail = result.stderr.trim() || result.stdout.trim() || `exit code ${String(result.code)}`;
	return /* @__PURE__ */ new Error(`workbench: ${operation} failed: ${detail}`);
}
/** 暂存指定路径（为空则暂存全部）。 */
async function gitAdd(cwd, paths) {
	const result = await runGit(cwd, paths !== void 0 && paths.length > 0 ? [
		"add",
		"--",
		...paths
	] : ["add", "--all"]);
	if (result.code !== 0) throw gitFailure("git add", result);
}
/** 丢弃工作区改动(staged=false)或撤销暂存(staged=true)。 */
async function gitRestore(cwd, paths, staged) {
	const result = await runGit(cwd, staged ? [
		"restore",
		"--staged",
		"--",
		...paths
	] : [
		"restore",
		"--",
		...paths
	]);
	if (result.code !== 0) throw gitFailure("git restore", result);
}
/** 用一条提交信息提交暂存内容。 */
async function gitCommit(cwd, message) {
	const result = await runGit(cwd, [
		"commit",
		"-m",
		message
	]);
	if (result.code !== 0) throw gitFailure("git commit", result);
}
/** 检出本地分支。 */
async function gitCheckout(cwd, branch) {
	const result = await runGit(cwd, ["checkout", branch]);
	if (result.code !== 0) throw gitFailure("git checkout", result);
}
/** 从配置的远端 fetch（不合并）。 */
async function gitFetch(cwd, remote) {
	const result = await runGit(cwd, remote !== void 0 && remote !== "" ? ["fetch", remote] : ["fetch"]);
	if (result.code !== 0) throw gitFailure("git fetch", result);
}
/** 从上游拉取当前分支。 */
async function gitPull(cwd) {
	const result = await runGit(cwd, ["pull"]);
	if (result.code !== 0) throw gitFailure("git pull", result);
}
/** 推送到上游（或指定远端）。 */
async function gitPush(cwd, remote, branch) {
	const result = await runGit(cwd, remote !== void 0 && remote !== "" ? [
		"push",
		remote,
		...branch !== void 0 && branch !== "" ? [branch] : []
	] : ["push"]);
	if (result.code !== 0) throw gitFailure("git push", result);
}
//#endregion
//#region src/config.ts
/** Defaults applied when a config section is absent. */
const DEFAULT_WORKSPACE_CONFIG = {
	terminalsPerSession: 4,
	listEntryMax: 1e3,
	detachedWindowEnabled: true,
	searchMax: 200
};
/**
* Resolve the effective config, merging the provided section over defaults.
* Unknown keys are dropped so a stale cordis.yml never leaks foreign fields.
* @param raw - the raw config section (may be undefined).
* @returns the resolved config.
*/
function resolveWorkspaceConfig(raw) {
	const value = raw ?? {};
	return {
		terminalsPerSession: typeof value.terminalsPerSession === "number" && value.terminalsPerSession > 0 ? value.terminalsPerSession : DEFAULT_WORKSPACE_CONFIG.terminalsPerSession,
		listEntryMax: typeof value.listEntryMax === "number" && value.listEntryMax > 0 ? value.listEntryMax : DEFAULT_WORKSPACE_CONFIG.listEntryMax,
		detachedWindowEnabled: typeof value.detachedWindowEnabled === "boolean" ? value.detachedWindowEnabled : DEFAULT_WORKSPACE_CONFIG.detachedWindowEnabled,
		searchMax: typeof value.searchMax === "number" && value.searchMax > 0 ? value.searchMax : DEFAULT_WORKSPACE_CONFIG.searchMax
	};
}
//#endregion
//#region src/trust-fence.ts
/** Loopback hostnames accepted without consulting the trust list. */
const LOOPBACK_HOSTS = /* @__PURE__ */ new Set([
	"localhost",
	"127.0.0.1",
	"::1",
	"0.0.0.0"
]);
/** Whether a hostname is a loopback literal. */
function isLoopbackHostname(hostname) {
	return LOOPBACK_HOSTS.has(hostname.toLowerCase());
}
/** Extract the hostname from a request Host header (`host[:port]`). */
function hostnameOf(request) {
	const raw = request.headers["host"];
	const value = Array.isArray(raw) ? raw[0] : raw;
	if (value === void 0) return "";
	return ((value.startsWith("[") ? value.slice(1, value.indexOf("]")) : value.split(":")[0]) ?? "").toLowerCase();
}
/**
* Decide whether a request is trusted to reach the workspace routes.
* @param request - the incoming request.
* @param trustedHosts - the web runtime's live trust list.
* @returns true when the caller is loopback or listed.
*/
function isTrustedApiRequest(request, trustedHosts) {
	const hostname = hostnameOf(request);
	if (hostname === "") return false;
	if (isLoopbackHostname(hostname)) return true;
	return trustedHosts.some((host) => host.toLowerCase() === hostname);
}
//#endregion
//#region src/wire.ts
/** One API failure with its wire code and HTTP status. */
var WorkspaceError = class extends Error {
	code;
	status;
	constructor(code, message, status = 400) {
		super(message);
		this.code = code;
		this.status = status;
	}
};
/** Body size bound of one JSON request (defense against unbounded reads). */
const MAX_BODY_BYTES = 1 << 20;
/** Read and parse the JSON request body (bounded; malformed → bad-request). */
async function readJsonBody(req) {
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const bytes = typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk;
		total += bytes.length;
		if (total > MAX_BODY_BYTES) throw new WorkspaceError("bad-request", "request body too large");
		chunks.push(bytes);
	}
	const text = new TextDecoder().decode(concatBytes(chunks));
	if (text.trim() === "") return {};
	try {
		return JSON.parse(text);
	} catch {
		throw new WorkspaceError("bad-request", "request body is not valid JSON");
	}
}
/** Concatenate byte chunks without a Node Buffer dependency (browser-safe). */
function concatBytes(chunks) {
	const size = chunks.reduce((sum, part) => sum + part.length, 0);
	const out = new Uint8Array(size);
	let offset = 0;
	for (const part of chunks) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}
/** Write a JSON response with the given status. */
function writeJson(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
/** Write the success envelope. */
function writeOk(res, value) {
	writeJson(res, 200, {
		ok: true,
		value
	});
}
/** Write the failure envelope for any thrown value (unknown → internal 500). */
function writeError(res, error) {
	if (error instanceof WorkspaceError) {
		writeJson(res, error.status, {
			ok: false,
			error: {
				code: error.code,
				message: error.message
			}
		});
		return;
	}
	writeJson(res, 500, {
		ok: false,
		error: {
			code: "internal",
			message: error instanceof Error ? error.message : String(error)
		}
	});
}
/** Narrow an unknown payload value to a string, else throw bad-request. */
function requireString(payload, key) {
	const value = payload?.[key];
	if (typeof value !== "string" || value === "") throw new WorkspaceError("bad-request", `missing or invalid "${key}"`);
	return value;
}
//#endregion
//#region src/fs-tree.ts
/**
* Filesystem tree helpers for the workspace API: path normalization,
* directory listing with a row bound, and cwd root resolution. Browser-safe
* (no Node type imports here — the host casts at the boundary).
* @module dsh-workbench-window/fs-tree
*/
/** Normalize a path to forward slashes and drop a trailing separator. */
function normalizePath(path) {
	const normalized = path.replace(/\\/g, "/");
	return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}
/** Whether `path` is the cwd itself or inside it. */
function isWithin(cwd, path) {
	const root = normalizePath(cwd);
	const target = normalizePath(path);
	if (target === root) return true;
	return target.startsWith(`${root}/`);
}
/** The display label of a cwd path (its basename, or the drive/root fallback). */
function rootLabel(cwd) {
	const normalized = normalizePath(cwd);
	const index = normalized.lastIndexOf("/");
	if (index === -1 || index === normalized.length - 1) return normalized;
	return normalized.slice(index + 1);
}
/** Throw a fs-error WorkspaceError for a failed path operation. */
function fsFailure(operation, path, error) {
	throw new WorkspaceError("fs-error", `${operation} "${path}": ${error instanceof Error ? error.message : String(error)}`, 500);
}
//#endregion
//#region src/index.ts
/**
* dsh-workbench-window host half: the /workspace JSON API (session cwd, file tree
* listing, file read/write, git status/log/diff), the /workspace/bundle
* lazy-chunk route, and the /workspace/ws terminal upgrade. Every route
* passes the same browser-trust fence as the /api gateway — Host-header
* loopback or the web runtime's `trustedHosts`.
*
* All operations are conversation-scoped: requests carry a sessionId, the
* session's authoritative cwd comes from the session store, and terminal
* processes are keyed by session.
* @module dsh-workbench-window
*/
/** Plugin identity for cordis.yml rows. */
const name = "dsh-workbench-window";
/** Services required before mounting. */
const inject = [
	"webServer",
	"sessions",
	"webRuntime",
	"settings"
];
/** Media content types by extension (images served to the editor/preview). */
const MEDIA_TYPES = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".bmp": "image/bmp",
	".ico": "image/x-icon"
};
/** Read-window ceiling for text reads, so one giant file cannot stall the UI. */
const TEXT_READ_LIMIT_BYTES = 1048576;
/** NUL-probe window for binary detection, matching the tool layer's sniffing. */
const BINARY_PROBE_BYTES = 4096;
/**
* Opaque freshness token: mtime + size. Consumers must not interpret it; they
* hand it back to fs.write to guard a save against concurrent edits.
* @param info - the stat result.
* @returns the token string.
*/
function versionOf(info) {
	return `${info.mtimeMs}:${info.size}`;
}
/**
* Read one text file with binary detection (NUL probe), size truncation, and
* a freshness token, mirroring the official workbench read shape.
* @param target - the absolute file path.
* @returns content, binary/truncated flags, byte size, and the version token.
*/
async function readTextFile(target) {
	const info = await stat(target);
	const size = info.size;
	const version = versionOf(info);
	const binaryOf = (buffer) => buffer.subarray(0, Math.min(buffer.length, BINARY_PROBE_BYTES)).includes(0);
	if (size > TEXT_READ_LIMIT_BYTES) {
		const buffer = Buffer.alloc(TEXT_READ_LIMIT_BYTES);
		const handle = await open(target, "r");
		try {
			await handle.read(buffer, 0, TEXT_READ_LIMIT_BYTES, 0);
		} finally {
			await handle.close();
		}
		return {
			content: binaryOf(buffer) ? "" : buffer.toString("utf8"),
			binary: binaryOf(buffer),
			truncated: true,
			size,
			version
		};
	}
	const buffer = await readFile(target);
	return {
		content: binaryOf(buffer) ? "" : buffer.toString("utf8"),
		binary: binaryOf(buffer),
		truncated: false,
		size,
		version
	};
}
/** Content type for a path extension (binary-safe fallback). */
function mediaTypeForPath(path) {
	const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
	return MEDIA_TYPES[ext] ?? "application/octet-stream";
}
/** Resolve a session's authoritative working directory (session header wins). */
function sessionCwdOf(ctx, sessionId) {
	const headerCwd = ctx.sessions.get(sessionId)?.header.cwd;
	return headerCwd !== void 0 && headerCwd !== "" ? headerCwd : process.cwd();
}
/** Project one directory entry to the wire shape. */
async function projectEntry(cwd, name) {
	const path = join(cwd, name);
	let isDir = false;
	let isSymlink = false;
	let broken = false;
	try {
		const info = await stat(path);
		isDir = info.isDirectory();
		isSymlink = info.isSymbolicLink();
	} catch {
		broken = true;
	}
	return {
		name,
		path: normalizePath(path),
		isDir,
		hidden: name.startsWith("."),
		isSymlink,
		broken
	};
}
/** List one directory level, capped at the configurable row bound. */
async function listDirectory(cwd, max) {
	let handle;
	try {
		handle = await opendir(cwd);
	} catch (error) {
		throw fsFailure("list", cwd, error);
	}
	const entries = [];
	let truncated = false;
	for await (const dirent of handle) {
		if (entries.length >= max) {
			truncated = true;
			break;
		}
		entries.push(await projectEntry(cwd, dirent.name));
	}
	return {
		entries,
		truncated
	};
}
/** 在会话 cwd 下按文件名递归搜索（跳过隐藏目录与常见忽略目录，限制结果数）。 */
async function searchFiles(cwd, query, max) {
	const q = query.toLowerCase();
	const results = [];
	const skip = /* @__PURE__ */ new Set([
		"node_modules",
		".git",
		"dist",
		"out",
		".dsh-home",
		"vendor"
	]);
	async function walk(dir, depth) {
		if (depth > 12 || results.length >= max) return;
		let handle;
		try {
			handle = await opendir(dir);
		} catch {
			return;
		}
		for await (const dirent of handle) {
			if (results.length >= max) break;
			if (dirent.name.startsWith(".") || skip.has(dirent.name)) continue;
			const full = join(dir, dirent.name);
			if (dirent.isDirectory()) await walk(full, depth + 1);
			else if (dirent.name.toLowerCase().includes(q)) results.push({
				path: normalizePath(relative(cwd, full)),
				name: dirent.name
			});
		}
	}
	await walk(cwd, 0);
	return results;
}
/** Build the JSON API handler for one request path. */
function buildApi(ctx, config, terminals) {
	return async (req, res) => {
		try {
			const payload = await readJsonBody(req);
			const sessionId = requireString(payload, "sessionId");
			const cwd = sessionCwdOf(ctx, sessionId);
			const method = payload.method;
			switch (method) {
				case "session.cwd":
					writeOk(res, {
						sessionId,
						cwd,
						root: rootLabel(cwd)
					});
					return;
				case "fs.list": {
					const path = typeof payload.path === "string" ? payload.path : cwd;
					const target = resolve(cwd, path);
					if (!isWithin(cwd, target)) throw new WorkspaceError("forbidden", "path escapes session cwd");
					writeOk(res, await listDirectory(target, config.listEntryMax));
					return;
				}
				case "fs.read": {
					const path = requireString(payload, "path");
					const target = resolve(cwd, path);
					if (!isWithin(cwd, target)) throw new WorkspaceError("forbidden", "path escapes session cwd");
					const result = await readTextFile(target).catch((error) => fsFailure("read", path, error));
					writeOk(res, {
						path: normalizePath(target),
						...result
					});
					return;
				}
				case "fs.write": {
					const path = requireString(payload, "path");
					const content = requireString(payload, "content");
					const raw = payload;
					const version = typeof raw.version === "string" ? raw.version : void 0;
					const target = resolve(cwd, path);
					if (!isWithin(cwd, target)) throw new WorkspaceError("forbidden", "path escapes session cwd");
					if (version !== void 0) {
						const current = await stat(target).catch(() => void 0);
						if (current === void 0 || versionOf(current) !== version) throw new WorkspaceError("conflict", "file changed since it was read");
					}
					await writeFile(target, content, "utf8").catch((error) => fsFailure("write", path, error));
					const after = await stat(target).catch(() => void 0);
					writeOk(res, {
						ok: true,
						version: after === void 0 ? void 0 : versionOf(after)
					});
					return;
				}
				case "fs.mkdir": {
					const path = requireString(payload, "path");
					const target = resolve(cwd, path);
					if (!isWithin(cwd, target)) throw new WorkspaceError("forbidden", "path escapes session cwd");
					await mkdir(target, { recursive: true }).catch((error) => fsFailure("mkdir", path, error));
					writeOk(res, { ok: true });
					return;
				}
				case "fs.rename": {
					const path = requireString(payload, "path");
					const nextPath = requireString(payload, "nextPath");
					const from = resolve(cwd, path);
					const to = resolve(cwd, nextPath);
					if (!isWithin(cwd, from) || !isWithin(cwd, to)) throw new WorkspaceError("forbidden", "path escapes session cwd");
					await rename(from, to).catch((error) => fsFailure("rename", path, error));
					writeOk(res, { ok: true });
					return;
				}
				case "fs.remove": {
					const path = requireString(payload, "path");
					const recursive = payload.recursive === true;
					const target = resolve(cwd, path);
					if (!isWithin(cwd, target)) throw new WorkspaceError("forbidden", "path escapes session cwd");
					const info = await stat(target).catch(() => void 0);
					if (info === void 0) throw new WorkspaceError("not-found", `"${path}" does not exist`, 404);
					if (info.isDirectory() && !recursive) throw new WorkspaceError("bad-request", `"${path}" is a directory; pass recursive`);
					await rm(target, {
						recursive: info.isDirectory(),
						force: true
					}).catch((error) => fsFailure("remove", path, error));
					writeOk(res, { ok: true });
					return;
				}
				case "fs.search":
					writeOk(res, { results: await searchFiles(cwd, requireString(payload, "query"), config.searchMax) });
					return;
				case "terminal.spawn": {
					const cwdArg = payload.cwd;
					let spawned;
					try {
						spawned = terminals.spawn(sessionId, typeof cwdArg === "string" ? cwdArg : void 0);
					} catch (error) {
						throw new WorkspaceError("pty-error", error instanceof Error ? error.message : String(error));
					}
					writeOk(res, spawned);
					return;
				}
				case "terminal.write": {
					const id = requireString(payload, "id");
					const data = requireString(payload, "data");
					try {
						terminals.write(sessionId, id, data);
					} catch (error) {
						throw new WorkspaceError("pty-error", error instanceof Error ? error.message : String(error));
					}
					writeOk(res, { ok: true });
					return;
				}
				case "terminal.read": {
					const id = requireString(payload, "id");
					try {
						writeOk(res, terminals.read(sessionId, id));
					} catch (error) {
						throw new WorkspaceError("pty-error", error instanceof Error ? error.message : String(error));
					}
					return;
				}
				case "terminal.close": {
					const id = requireString(payload, "id");
					await terminals.close(sessionId, id);
					writeOk(res, { ok: true });
					return;
				}
				case "terminal.closeSession":
					await terminals.closeSession(sessionId);
					writeOk(res, { ok: true });
					return;
				case "git.status":
					writeOk(res, await gitStatus(cwd));
					return;
				case "git.diff":
					writeOk(res, await gitDiff(cwd, typeof payload.path === "string" ? payload.path : void 0, payload.staged === true));
					return;
				case "git.log":
					writeOk(res, await gitLog(cwd, typeof payload.limit === "number" ? payload.limit : 30));
					return;
				case "git.branches":
					writeOk(res, await gitBranches(cwd));
					return;
				case "git.add":
					await gitAdd(cwd, Array.isArray(payload.paths) ? payload.paths : void 0);
					writeOk(res, { ok: true });
					return;
				case "git.restore":
					await gitRestore(cwd, Array.isArray(payload.paths) ? payload.paths : [], payload.staged === true);
					writeOk(res, { ok: true });
					return;
				case "git.commit":
					await gitCommit(cwd, requireString(payload, "message"));
					writeOk(res, { ok: true });
					return;
				case "git.checkout":
					await gitCheckout(cwd, requireString(payload, "branch"));
					writeOk(res, { ok: true });
					return;
				case "git.fetch":
					await gitFetch(cwd, typeof payload.remote === "string" ? payload.remote : void 0);
					writeOk(res, { ok: true });
					return;
				case "git.pull":
					await gitPull(cwd);
					writeOk(res, { ok: true });
					return;
				case "git.push":
					await gitPush(cwd, typeof payload.remote === "string" ? payload.remote : void 0, typeof payload.branch === "string" ? payload.branch : void 0);
					writeOk(res, { ok: true });
					return;
				default: throw new WorkspaceError("bad-request", `unknown method "${String(method)}"`);
			}
		} catch (error) {
			writeError(res, error);
		}
	};
}
/**
* Plugin body: register the JSON API, the media route, and the lazy-bundle
* route, all behind the browser-trust fence.
* @param ctx - the host cordis context.
* @param config - optional cordis.yml config section.
*/
function apply(ctx, config) {
	const resolved = resolveWorkspaceConfig(config);
	const terminals = new WorkbenchTerminalHost();
	const fence = (req) => isTrustedApiRequest(req, ctx.webRuntime.trustedHosts);
	ctx.effect(() => {
		const off = ctx.webServer.register({
			kind: "prefix",
			path: "/workspace/api",
			handler: async (req, res) => {
				if (!fence(req)) {
					writeJson(res, 403, {
						ok: false,
						error: {
							code: "forbidden",
							message: "forbidden"
						}
					});
					return;
				}
				await buildApi(ctx, resolved, terminals)(req, res);
			}
		});
		return () => {
			off();
			terminals.dispose();
		};
	}, "dsh-workbench-window: json api");
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: "/workspace/file",
		handler: async (req, res) => {
			if (!fence(req)) {
				writeJson(res, 403, {
					ok: false,
					error: {
						code: "forbidden",
						message: "forbidden"
					}
				});
				return;
			}
			try {
				const url = new URL(req.url ?? "/workspace/file", "http://localhost");
				const sessionId = url.searchParams.get("sessionId") ?? "";
				const path = url.searchParams.get("path") ?? "";
				if (sessionId === "" || path === "") throw new WorkspaceError("bad-request", "missing sessionId or path");
				const cwd = sessionCwdOf(ctx, sessionId);
				const target = resolve(cwd, path);
				if (!isWithin(cwd, target)) throw new WorkspaceError("forbidden", "path escapes session cwd");
				const data = await readFile(target).catch((error) => fsFailure("read", path, error));
				res.writeHead(200, { "content-type": mediaTypeForPath(path) });
				res.end(data);
			} catch (error) {
				writeError(res, error);
			}
		}
	}), "dsh-workbench-window: media route");
}
//#endregion
export { apply, inject, mediaTypeForPath, name, resolveWorkspaceConfig };
