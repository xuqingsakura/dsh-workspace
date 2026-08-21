/**
 * host 侧 git 纯函数单测：porcelain / log 解析。
 * 这些函数不 spawn 子进程，只解析文本，适合快速回归。
 * @module dsh-workbench-window/tests
 */
import { describe, expect, it } from 'vitest'
import { parsePorcelain, parseLog } from '../src/git.ts'

describe('parsePorcelain', () => {
  it('解析未跟踪文件', () => {
    expect(parsePorcelain(['?? new.txt'])).toEqual([
      { path: 'new.txt', staged: false, kind: 'untracked' },
    ])
  })

  it('区分已暂存与未暂存的修改', () => {
    expect(parsePorcelain(['M  a.txt', ' M b.txt'])).toEqual([
      { path: 'a.txt', staged: true, kind: 'modified' },
      { path: 'b.txt', staged: false, kind: 'modified' },
    ])
  })

  it('重命名记录携带目标路径字段', () => {
    expect(parsePorcelain(['R  old.txt', 'new.txt'])).toEqual([
      { path: 'new.txt', staged: false, kind: 'renamed' },
    ])
  })
})

describe('parseLog', () => {
  it('按单元分隔符切分提交记录', () => {
    const record = ['abc123', 'abc1234', 'Author', '2026-01-01T00:00:00Z', 'subject', 'p1 p2'].join('\u001f')
    const entries = parseLog([record])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      hash: 'abc123',
      shortHash: 'abc1234',
      author: 'Author',
      date: '2026-01-01T00:00:00Z',
      message: 'subject',
      parents: ['p1', 'p2'],
    })
  })

  it('根提交无父记录时 parents 为空', () => {
    const record = ['abc123', 'abc1234', 'Author', '2026-01-01T00:00:00Z', 'root', ''].join('\u001f')
    const entries = parseLog([record])
    expect(entries[0]?.parents).toEqual([])
  })
})
