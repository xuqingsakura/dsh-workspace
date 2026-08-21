/**
 * Git 命令执行层：工作台 Git 面板的 host 侧实现。所有 verb 在会话 cwd
 * 下运行系统 `git`（带 `--no-color`），返回结构化投影（status / diff / log /
 * branches）以及变更操作（add / restore / commit / checkout / fetch / pull / push）。
 * 非零退出不会 reject，而是返回捕获的 stdout/stderr，由调用方决定报错文案。
 * @module dsh-workbench-window/git
 */
import { execFile } from 'node:child_process'
import type {
  WorkbenchGitBranch,
  WorkbenchGitChange,
  WorkbenchGitChangeKind,
  WorkbenchGitDiffResult,
  WorkbenchGitLogEntry,
  WorkbenchGitStatusResult,
} from './workbench-types.ts'

/** `git status --porcelain` 索引列(X)到变更类型的映射。 */
function indexKind(code: string): WorkbenchGitChangeKind | undefined {
  switch (code) {
    case 'A': return 'added'
    case 'M': return 'modified'
    case 'D': return 'deleted'
    case 'R': return 'renamed'
    case 'C': return 'renamed'
    case 'T': return 'modified'
    case 'U': return 'modified'
    default: return undefined
  }
}

/** `git status --porcelain` 工作区列(Y)到变更类型的映射。 */
function worktreeKind(code: string): WorkbenchGitChangeKind | undefined {
  switch (code) {
    case 'M': return 'modified'
    case 'D': return 'deleted'
    case 'T': return 'modified'
    case 'U': return 'modified'
    default: return undefined
  }
}

/** 解析 `git status --porcelain=v1 -z` 的 NUL 分割字段为有序变更列表。 */
export function parsePorcelain(parts: readonly string[]): WorkbenchGitChange[] {
  const changes: WorkbenchGitChange[] = []
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i] as string
    if (part.length < 3) continue
    const xy = part.slice(0, 2)
    const path = part.slice(3)
    if (xy === '??') {
      changes.push({ path, staged: false, kind: 'untracked' })
      continue
    }
    if (xy[0] === 'R' || xy[0] === 'C') {
      // 重命名/复制记录的下一个 NUL 字段是目标路径。
      const destination = parts[i + 1] ?? path
      i += 1
      changes.push({ path: destination, staged: xy[1] !== ' ', kind: 'renamed' })
      continue
    }
    const kind = indexKind(xy[0] as string) ?? worktreeKind(xy[1] as string)
    if (kind === undefined) continue
    changes.push({ path, staged: xy[0] !== ' ', kind })
  }
  return changes
}

/** 解析 `git log --format` 中按单元分隔符(\u001f)切分的记录。 */
export function parseLog(records: readonly string[]): WorkbenchGitLogEntry[] {
  const entries: WorkbenchGitLogEntry[] = []
  for (const record of records) {
    if (record === '') continue
    const [hash = '', shortHash = '', author = '', date = '', message = '', parentLine = ''] = record.split('\u001f')
    const parents = parentLine === '' ? [] : parentLine.split(' ')
    entries.push({ hash, shortHash, author, date, message, parents })
  }
  return entries
}

/** 一次 git 调用的完整结果。 */
export interface GitRunResult {
  /** 捕获的 stdout。 */
  stdout: string
  /** 捕获的 stderr（用于错误提示）。 */
  stderr: string
  /** 进程退出码。 */
  code: number
}

/**
 * 在指定工作目录运行一条 git 命令。
 * @param cwd - 仓库工作目录。
 * @param args - git 参数（不含开头的 `git`）。
 * @returns 捕获结果；非零退出不 reject。
 */
export function runGit(cwd: string, args: readonly string[]): Promise<GitRunResult> {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['-c', 'color.ui=false', ...args],
      { cwd, maxBuffer: 64 * 1024 * 1024, windowsHide: true, encoding: 'utf8' },
      (error, stdout, stderr) => {
        if (error === null) {
          resolve({ stdout, stderr: '', code: 0 })
          return
        }
        const code = typeof error.code === 'number' ? error.code : 1
        resolve({ stdout, stderr, code })
      },
    )
  })
}

/** 判断目录是否位于 git 工作树内。 */
export function isGitRepo(cwd: string): Promise<boolean> {
  return runGit(cwd, ['rev-parse', '--is-inside-work-tree']).then(result => result.stdout.trim() === 'true')
}

/** 投影一个 git 工作树的状态（是否仓库、当前分支、变更列表）。 */
export async function gitStatus(cwd: string): Promise<WorkbenchGitStatusResult> {
  const insideResult = await runGit(cwd, ['rev-parse', '--is-inside-work-tree'])
  const isRepo = insideResult.code === 0 && insideResult.stdout.trim() === 'true'
  if (!isRepo) return { isRepo: false, branch: '', changes: [] }
  const branchResult = await runGit(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])
  const branch = branchResult.code === 0 ? branchResult.stdout.trim() : ''
  const statusResult = await runGit(cwd, ['status', '--porcelain=v1', '-z'])
  const changes = statusResult.code === 0 ? parsePorcelain(statusResult.stdout.split('\0')) : []
  return { isRepo: true, branch, changes }
}

/** 投影一个路径（或整棵树）的统一 diff。 */
export async function gitDiff(cwd: string, path: string | undefined, staged: boolean): Promise<WorkbenchGitDiffResult> {
  const args = ['diff', '--unified=3']
  if (staged) args.push('--cached')
  if (path !== undefined) args.push('--', path)
  const result = await runGit(cwd, args)
  const binary = /^Binary files .* differ$/m.test(result.stdout) || /^GIT binary patch$/m.test(result.stdout)
  return { diff: result.stdout, binary }
}

/** 最近的提交历史（最新在前）。 */
export async function gitLog(cwd: string, limit: number): Promise<WorkbenchGitLogEntry[]> {
  const result = await runGit(cwd, ['log', `-n ${String(limit)}`, '--pretty=format:%H%x1f%h%x1f%an%x1f%aI%x1f%s%x1f%P'])
  return result.code === 0 ? parseLog(result.stdout.split('\n')) : []
}

/** 本地分支列表，当前检出分支带标记。 */
export async function gitBranches(cwd: string): Promise<WorkbenchGitBranch[]> {
  const result = await runGit(cwd, ['branch'])
  if (result.code !== 0) return []
  return result.stdout.split('\n')
    .filter(line => line.trim() !== '')
    .map((line) => {
      const current = line.startsWith('*')
      return { name: line.slice(2).trim(), current }
    })
}

/** 把一次 git 失败包装为带捕获 stderr 的错误。 */
export function gitFailure(operation: string, result: GitRunResult): Error {
  const detail = result.stderr.trim() || result.stdout.trim() || `exit code ${String(result.code)}`
  return new Error(`workbench: ${operation} failed: ${detail}`)
}

/** 暂存指定路径（为空则暂存全部）。 */
export async function gitAdd(cwd: string, paths: readonly string[] | undefined): Promise<void> {
  const args = paths !== undefined && paths.length > 0 ? ['add', '--', ...paths] : ['add', '--all']
  const result = await runGit(cwd, args)
  if (result.code !== 0) throw gitFailure('git add', result)
}

/** 丢弃工作区改动(staged=false)或撤销暂存(staged=true)。 */
export async function gitRestore(cwd: string, paths: readonly string[], staged: boolean): Promise<void> {
  const args = staged ? ['restore', '--staged', '--', ...paths] : ['restore', '--', ...paths]
  const result = await runGit(cwd, args)
  if (result.code !== 0) throw gitFailure('git restore', result)
}

/** 用一条提交信息提交暂存内容。 */
export async function gitCommit(cwd: string, message: string): Promise<void> {
  const result = await runGit(cwd, ['commit', '-m', message])
  if (result.code !== 0) throw gitFailure('git commit', result)
}

/** 检出本地分支。 */
export async function gitCheckout(cwd: string, branch: string): Promise<void> {
  const result = await runGit(cwd, ['checkout', branch])
  if (result.code !== 0) throw gitFailure('git checkout', result)
}

/** 从配置的远端 fetch（不合并）。 */
export async function gitFetch(cwd: string, remote?: string): Promise<void> {
  const args = remote !== undefined && remote !== '' ? ['fetch', remote] : ['fetch']
  const result = await runGit(cwd, args)
  if (result.code !== 0) throw gitFailure('git fetch', result)
}

/** 从上游拉取当前分支。 */
export async function gitPull(cwd: string): Promise<void> {
  const result = await runGit(cwd, ['pull'])
  if (result.code !== 0) throw gitFailure('git pull', result)
}

/** 推送到上游（或指定远端）。 */
export async function gitPush(cwd: string, remote?: string, branch?: string): Promise<void> {
  const args = remote !== undefined && remote !== '' ? ['push', remote, ...(branch !== undefined && branch !== '' ? [branch] : [])] : ['push']
  const result = await runGit(cwd, args)
  if (result.code !== 0) throw gitFailure('git push', result)
}

export default {
  parsePorcelain, parseLog, runGit, isGitRepo, gitStatus, gitDiff, gitLog, gitBranches,
  gitAdd, gitRestore, gitCommit, gitCheckout, gitFetch, gitPull, gitPush, gitFailure,
}
