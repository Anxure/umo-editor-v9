import { Extension } from '@tiptap/core'
import {
  AllSelection,
  TextSelection,
  type Transaction,
} from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
    }
    outdent: {
      outdent: () => ReturnType
    }
  }
}

// @weiruo/tiptap-extension-indent Version:2.0.4-1

const ptToPx = (pt: number) => pt * (96 / 72)

type IndentParseOptions = {
  indentSize: number
  minLevel: number
}

export const parseIndentLevelFromElement = (
  element: HTMLElement,
  options: IndentParseOptions,
): number | null => {
  const textIndent = element.style.textIndent?.trim()
  if (!textIndent) {
    return null
  }

  const match = textIndent.match(/^([\d.]+)\s*([a-z%]*)$/i)
  if (!match) {
    return null
  }

  const rawValue = Number.parseFloat(match[1])
  if (Number.isNaN(rawValue)) {
    return null
  }

  const unit = (match[2] ?? '').toLowerCase()

  // `em` is relative to the element itself, so we can compute the level
  // without relying on computed styles (important for detached DOM nodes).
  if (unit === 'em') {
    const level = Math.round(rawValue / options.indentSize)
    return level > options.minLevel ? level : null
  }

  // For other units we normalize to px, then divide by "indentSize * 1em".
  // If computed styles are unavailable (e.g. detached nodes), fall back to root/16px.
  const computedFontSize = Number.parseFloat(getComputedStyle(element).fontSize)
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  )
  const fontSizePx =
    !Number.isNaN(computedFontSize) && computedFontSize > 0
      ? computedFontSize
      : !Number.isNaN(rootFontSize) && rootFontSize > 0
        ? rootFontSize
        : 16

  const rootFontSizePx =
    !Number.isNaN(rootFontSize) && rootFontSize > 0 ? rootFontSize : fontSizePx

  const pxValue =
    unit === 'rem'
      ? rawValue * (rootFontSizePx || fontSizePx)
      : unit === 'pt'
        ? ptToPx(rawValue)
        : unit === 'px' || unit === ''
          ? rawValue
          : null
  if (pxValue === null) {
    return null
  }

  const basePx = options.indentSize * fontSizePx
  if (!basePx || Number.isNaN(basePx)) {
    return null
  }

  const level = Math.round(pxValue / basePx)
  return level > options.minLevel ? level : null
}

export default Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['heading', 'listItem', 'taskItem', 'paragraph'],
      minLevel: 0,
      maxLevel: 5,
      // 一个缩进级别对应的 text-indent 大小，单位 em
      indentSize: 2,
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: null,
            renderHTML: (attributes) => {
              const { indent } = attributes
              const { minLevel, indentSize } = this.options
              if (!indent || indent <= minLevel) {
                return {}
              }
              return {
                style: `text-indent: ${indent * indentSize}em;`,
              }
            },
            // renderHTML: (attributes) => {
            //   if (!attributes.indent) {
            //     return {}
            //   }
            //   if (attributes.indent > this.options.minLevel) {
            //     return {
            //       class: `${classAttrPrefix}${attributes.indent}`,
            //     }
            //   }
            //   return {}
            // },
            parseHTML: (element) => {
              // 通过单位换算，pt-> 多少个tab缩进
              return parseIndentLevelFromElement(element, {
                indentSize: this.options.indentSize,
                minLevel: this.options.minLevel,
              })
            },
          },
        },
      },
    ]
  },
  addCommands() {
    const setNodeIndentMarkup = (
      tr: Transaction,
      pos: number,
      delta: number,
    ) => {
      const node = tr.doc.nodeAt(pos)
      if (!node) return tr
      const nextLevel = (node.attrs.indent || 0) + delta
      const { minLevel, maxLevel } = this.options
      let indent = nextLevel
      if (nextLevel < minLevel) indent = minLevel
      if (nextLevel > maxLevel) indent = maxLevel
      if (indent !== node.attrs.indent) {
        const attrs = { ...node.attrs }
        delete attrs.indent
        const nextAttrs = indent > minLevel ? { ...attrs, indent } : attrs
        return tr.setNodeMarkup(pos, node.type, nextAttrs, node.marks)
      }
      return tr
    }
    const updateIndentLevel = (tr: Transaction, delta: number) => {
      const { doc, selection } = tr
      if (
        selection instanceof TextSelection ||
        selection instanceof AllSelection
      ) {
        const { from, to } = selection
        doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            tr = setNodeIndentMarkup(tr, pos, delta)
            return false
          }
          return true
        })
      }
      return tr
    }
    const applyIndent =
      (direction: number) =>
        () =>
          ({ tr, state, dispatch }) => {
            tr.setSelection(state.selection)
            tr = updateIndentLevel(tr, direction)
            if (tr.docChanged) {
              if (dispatch) {
                dispatch(tr)
              }
              return true
            }
            return false
          }
    return {
      indent: applyIndent(1),
      outdent: applyIndent(-1),
    }
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (
          this.editor.isActive('bulletList') ||
          this.editor.isActive('orderedList')
        ) {
          return this.editor.commands.sinkListItem('listItem')
        }
        if (this.editor.isActive('taskList')) {
          return this.editor.commands.sinkListItem('taskItem')
        }
        return this.editor.commands.indent()
      },
      'Shift-Tab': () => {
        if (
          this.editor.isActive('bulletList') ||
          this.editor.isActive('orderedList')
        ) {
          return this.editor.commands.liftListItem('listItem')
        }
        if (this.editor.isActive('taskList')) {
          return this.editor.commands.liftListItem('taskItem')
        }
        return this.editor.commands.outdent()
      },
    }
  },
})
