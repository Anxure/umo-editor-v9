export type CharDiffOp =
  | { type: 'equal'; value: string }
  | { type: 'insert'; value: string }
  | { type: 'delete'; value: string }

/**
 * 轻量字符级 diff（适合中文正文）。
 * 超长文本按块切分，避免 O(nm) 过大。
 */
export function diffChars(oldText: string, newText: string): CharDiffOp[] {
  if (oldText === newText) {
    return oldText ? [{ type: 'equal', value: oldText }] : []
  }
  if (!oldText) {
    return newText ? [{ type: 'insert', value: newText }] : []
  }
  if (!newText) {
    return [{ type: 'delete', value: oldText }]
  }

  const MAX = 4000
  if (oldText.length * newText.length > MAX * MAX) {
    return diffByChunks(oldText, newText, 800)
  }

  return myersDiff(oldText, newText)
}

function diffByChunks(oldText: string, newText: string, chunkSize: number): CharDiffOp[] {
  const ops: CharDiffOp[] = []
  let oi = 0
  let ni = 0
  while (oi < oldText.length || ni < newText.length) {
    const oChunk = oldText.slice(oi, oi + chunkSize)
    const nChunk = newText.slice(ni, ni + chunkSize)
    ops.push(...myersDiff(oChunk, nChunk))
    oi += chunkSize
    ni += chunkSize
  }
  return mergeOps(ops)
}

function myersDiff(a: string, b: string): CharDiffOp[] {
  const n = a.length
  const m = b.length
  const max = n + m
  const v = new Map<number, number>()
  v.set(1, 0)
  const trace: Map<number, number>[] = []

  for (let d = 0; d <= max; d++) {
    const vCopy = new Map(v)
    trace.push(vCopy)
    for (let k = -d; k <= d; k += 2) {
      let x: number
      const left = v.get(k - 1) ?? 0
      const right = v.get(k + 1) ?? 0
      if (k === -d || (k !== d && left < right)) {
        x = right
      } else {
        x = left + 1
      }
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v.set(k, x)
      if (x >= n && y >= m) {
        return buildOpsFromTrace(a, b, trace, d)
      }
    }
  }
  return [
    { type: 'delete', value: a },
    { type: 'insert', value: b },
  ]
}

function buildOpsFromTrace(
  a: string,
  b: string,
  trace: Map<number, number>[],
  d: number,
): CharDiffOp[] {
  const ops: CharDiffOp[] = []
  let x = a.length
  let y = b.length

  for (let depth = d; depth >= 0; depth--) {
    const v = trace[depth]
    const k = x - y
    const left = v.get(k - 1) ?? 0
    const right = v.get(k + 1) ?? 0
    let prevK: number
    if (k === -depth || (k !== depth && left < right)) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }
    const prevX = v.get(prevK) ?? 0
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', value: a[x - 1]! })
      x--
      y--
    }
    if (depth === 0) break
    if (x > prevX) {
      ops.push({ type: 'delete', value: a[x - 1]! })
      x--
    } else if (y > prevY) {
      ops.push({ type: 'insert', value: b[y - 1]! })
      y--
    }
  }

  ops.reverse()
  return mergeOps(ops)
}

function mergeOps(ops: CharDiffOp[]): CharDiffOp[] {
  const merged: CharDiffOp[] = []
  for (const op of ops) {
    if (!op.value) continue
    const last = merged[merged.length - 1]
    if (last && last.type === op.type) {
      last.value += op.value
    } else {
      merged.push({ ...op })
    }
  }
  return merged
}

export interface TextPosMap {
  text: string
  /** text 下标 → 文档绝对位置；换行等无映射位置为 -1 */
  posAt: number[]
}

/** 按顶层块提取文本，块间用 \n 连接，并记录每个字符的文档位置 */
export function buildBlockAwareTextPosMap(doc: any): TextPosMap {
  let text = ''
  const posAt: number[] = []
  const blockCount = doc.childCount ?? 0

  let absolutePos = 1
  for (let i = 0; i < blockCount; i++) {
    const block = doc.child(i)

    block.descendants((node: any, relPos: number) => {
      if (node.isText && node.text) {
        const base = absolutePos + relPos
        for (let k = 0; k < node.text.length; k++) {
          text += node.text[k]
          posAt.push(base + k)
        }
      }
    })

    absolutePos += block.nodeSize

    if (i < blockCount - 1) {
      text += '\n'
      posAt.push(-1)
    }
  }

  return { text, posAt }
}
