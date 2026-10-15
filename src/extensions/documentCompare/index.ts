import { Extension, type Editor, type JSONContent } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'
import { buildBlockAwareTextPosMap, diffChars } from './diffText'

export interface DocumentCompareOptions {
  /** 对比时是否自动将编辑器设为只读（默认 true） */
  autoReadOnly?: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    documentCompare: {
      /**
       * 展示 diff：以当前文档（或 toJson）为「新版」，fromJson 为「旧版」
       */
      showDocumentDiff: (options: {
        fromJson: JSONContent
        toJson?: JSONContent
      }) => ReturnType
      /**
       * 退出 diff。
       * restore=true（默认）恢复进入对比前的内容；
       * restore=false 只清高亮，保留当前文档（切换版本 / 内容一致时用）。
       */
      hideDocumentDiff: (options?: { restore?: boolean }) => ReturnType
    }
  }
}

const documentComparePluginKey = new PluginKey('documentCompare')

type DiffDecorationSpec = {
  type: 'inline-insert' | 'inline-delete'
}

function jsonToNode(editor: Editor, json: JSONContent): PMNode {
  return editor.schema.nodeFromJSON(json)
}

function buildDiffDecorations(doc: PMNode, fromJson: JSONContent, editor: Editor): DecorationSet {
  let oldDoc: PMNode
  try {
    oldDoc = jsonToNode(editor, fromJson)
  } catch (e) {
    console.error('[documentCompare] fromJson 解析失败', e)
    return DecorationSet.empty
  }

  const oldMap = buildBlockAwareTextPosMap(oldDoc)
  const newMap = buildBlockAwareTextPosMap(doc)
  const ops = diffChars(oldMap.text, newMap.text)

  const decorations: ReturnType<typeof Decoration.inline>[] = []
  let oldIdx = 0
  let newIdx = 0

  for (const op of ops) {
    if (op.type === 'equal') {
      oldIdx += op.value.length
      newIdx += op.value.length
      continue
    }

    // 块间换行 / 空白：HTML↔JSON 往返常会多空段，不算正文差异
    if (isIgnorableDiffValue(op.value)) {
      if (op.type === 'insert') newIdx += op.value.length
      else oldIdx += op.value.length
      continue
    }

    if (op.type === 'insert') {
      const startIdx = newIdx
      const endIdx = newIdx + op.value.length
      // 映射到连续文档区间（跳过 -1）
      const ranges = mapIndexRangeToDocRanges(newMap.posAt, startIdx, endIdx)
      for (const range of ranges) {
        if (range.from < range.to && range.to <= doc.content.size + 1) {
          decorations.push(
            Decoration.inline(range.from, range.to, {
              class: 'umo-diff-insert',
              'data-diff-type': 'inline-insert',
            }, { type: 'inline-insert' } satisfies DiffDecorationSpec),
          )
        }
      }
      newIdx = endIdx
      continue
    }

    if (op.type === 'delete') {
      // 删除内容以 widget 插在「新文档」对应位置前
      const insertAt = findWidgetPos(newMap.posAt, newIdx, doc)
      const deletedText = op.value.replace(/\n/g, '⏎')
      decorations.push(
        Decoration.widget(insertAt, () => {
          const el = document.createElement('span')
          el.className = 'umo-diff-delete'
          el.setAttribute('data-diff-type', 'inline-delete')
          el.textContent = deletedText
          return el
        }, { side: -1, type: 'inline-delete' } as any),
      )
      oldIdx += op.value.length
    }
  }

  return DecorationSet.create(doc, decorations)
}

/** 仅空白 / 换行：不算有内容差异 */
function isIgnorableDiffValue(value: string) {
  return /^[\s\u00a0]*$/.test(value)
}

function mapIndexRangeToDocRanges(
  posAt: number[],
  startIdx: number,
  endIdx: number,
): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = []
  let rangeStart = -1
  let prevPos = -1

  for (let i = startIdx; i < endIdx; i++) {
    const pos = posAt[i] ?? -1
    if (pos < 0) {
      if (rangeStart >= 0 && prevPos >= 0) {
        ranges.push({ from: rangeStart, to: prevPos + 1 })
      }
      rangeStart = -1
      prevPos = -1
      continue
    }
    if (rangeStart < 0) {
      rangeStart = pos
      prevPos = pos
    } else if (pos === prevPos + 1) {
      prevPos = pos
    } else {
      ranges.push({ from: rangeStart, to: prevPos + 1 })
      rangeStart = pos
      prevPos = pos
    }
  }
  if (rangeStart >= 0 && prevPos >= 0) {
    ranges.push({ from: rangeStart, to: prevPos + 1 })
  }
  return ranges
}

function findWidgetPos(posAt: number[], newIdx: number, doc: PMNode): number {
  // 找 newIdx 之后第一个有效位置；若在末尾则用 doc 末尾
  for (let i = newIdx; i < posAt.length; i++) {
    if ((posAt[i] ?? -1) >= 0) return posAt[i]!
  }
  for (let i = newIdx - 1; i >= 0; i--) {
    if ((posAt[i] ?? -1) >= 0) return posAt[i]! + 1
  }
  return Math.min(1, doc.content.size)
}

export const DocumentCompare = Extension.create<DocumentCompareOptions>({
  name: 'documentCompare',

  addOptions() {
    return {
      autoReadOnly: true,
    }
  },

  addStorage() {
    return {
      isPreviewing: false as boolean,
      fromJson: null as JSONContent | null,
      previousContent: null as JSONContent | null,
      wasEditable: true as boolean,
      decorationVersion: 0 as number,
      /** 最近一次 showDocumentDiff 是否存在可见差异 */
      hasChanges: false as boolean,
    }
  },

  addCommands() {
    return {
      showDocumentDiff:
        ({ fromJson, toJson }) =>
        ({ editor, tr, dispatch }) => {
          if (!fromJson) return false

          const storage = editor.storage.documentCompare as {
            isPreviewing: boolean
            fromJson: JSONContent | null
            previousContent: JSONContent | null
            wasEditable: boolean
            decorationVersion: number
            hasChanges: boolean
          }

          if (!storage.isPreviewing) {
            storage.previousContent = editor.getJSON()
            storage.wasEditable = editor.isEditable
          }

          storage.fromJson = fromJson
          storage.isPreviewing = true
          storage.decorationVersion += 1

          // 同一笔 tr 里换内容和刷 decoration，避免 setContent 后再 dispatch 旧 tr
          let nextTr = tr
          if (toJson) {
            const nextDoc = editor.schema.nodeFromJSON(toJson)
            nextTr = nextTr.replaceWith(0, nextTr.doc.content.size, nextDoc.content)
          }

          const docForDiff = toJson
            ? editor.schema.nodeFromJSON(toJson)
            : nextTr.doc
          const decos = buildDiffDecorations(docForDiff, fromJson, editor)
          storage.hasChanges = decos.find().length > 0

          nextTr = nextTr.setMeta(documentComparePluginKey, { refresh: true })
          if (dispatch) dispatch(nextTr)

          if (this.options.autoReadOnly) {
            editor.setEditable(false)
          }
          return true
        },

      /**
       * 退出 diff。
       * restore=true（默认）恢复进入对比前的内容；
       * restore=false 只清高亮，保留当前文档（切换版本 / 内容一致时用）。
       */
      hideDocumentDiff:
        (options?: { restore?: boolean }) =>
        ({ editor, tr, dispatch }) => {
          const storage = editor.storage.documentCompare as {
            isPreviewing: boolean
            fromJson: JSONContent | null
            previousContent: JSONContent | null
            wasEditable: boolean
            decorationVersion: number
            hasChanges: boolean
          }

          if (!storage.isPreviewing) return true

          const restore = options?.restore !== false
          const previous = storage.previousContent
          storage.isPreviewing = false
          storage.fromJson = null
          storage.previousContent = null
          storage.hasChanges = false
          storage.decorationVersion += 1

          let nextTr = tr
          if (restore && previous) {
            const prevDoc = editor.schema.nodeFromJSON(previous)
            nextTr = nextTr.replaceWith(0, nextTr.doc.content.size, prevDoc.content)
          }

          nextTr = nextTr.setMeta(documentComparePluginKey, { refresh: true })
          if (dispatch) dispatch(nextTr)

          editor.setEditable(storage.wasEditable)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this
    return [
      new Plugin({
        key: documentComparePluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldSet, _oldState, newState) {
            const storage = extension.editor.storage.documentCompare as {
              isPreviewing: boolean
              fromJson: JSONContent | null
            }
            const meta = tr.getMeta(documentComparePluginKey)
            if (!storage?.isPreviewing || !storage.fromJson) {
              return DecorationSet.empty
            }
            if (meta?.refresh || tr.docChanged) {
              return buildDiffDecorations(newState.doc, storage.fromJson, extension.editor)
            }
            return oldSet.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return documentComparePluginKey.getState(state)
          },
        },
      }),
    ]
  },
})

export default DocumentCompare
