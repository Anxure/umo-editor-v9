import { mergeAttributes } from '@tiptap/core'
import Table from '@tiptap/extension-table'
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// 解析剪切板中 excel 的 CSS 规则（将 CSS 字符串转换为对象）
const parseCSS = (cssRules: string) => {
  const results: any = {}
  const rules = cssRules
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
  rules.forEach((rule) => {
    const [property, value] = rule.split(':').map((part) => part.trim())
    if (property && value) {
      results[property] = value
    }
  })
  return results
}

// 提取样式规则的方法
const extractStyles = (styleText: string) => {
  const regex = /\.(\w+)\s*\{([^}]+)\}/g
  let match
  const styles: any = {}

  while ((match = regex.exec(styleText)) !== null) {
    // const className = match[1]
    // const cssRules = match[2]
    const [, className, cssRules] = match
    const parsedRules = parseCSS(cssRules)
    styles[className] = parsedRules
  }

  return styles
}

const CustomTable = Table.extend({
  renderHTML({ HTMLAttributes }) {
    // 保持与 tiptap 默认结构一致：div.tableWrapper > table > tbody
    // 关键点：把通过 addAttributes 注入的 HTMLAttributes 明确挂到 <table> 上，避免丢失 table.style 等
    return [
      'div',
      { class: 'tableWrapper' },
      ['table', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ['tbody', 0]],
    ]
  },
  addAttributes() {
    return {
      // @ts-ignore
      ...this.parent?.(),
      umoStyled: {
        default: false,
        parseHTML: (element: HTMLElement) => {
          return Boolean(
            element.getAttribute('style') ||
            element.getAttribute('border') ||
            element.getAttribute('cellpadding') ||
            element.getAttribute('cellspacing'),
          )
        },
        renderHTML: ({ umoStyled }: { umoStyled: boolean }) =>
          umoStyled ? { 'data-umo-styled-table': 'true' } : {},
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style') ?? null,
        renderHTML: ({ style }: { style: string | null }) =>
          style ? { style } : {},
      },
      border: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('border') ?? null,
        renderHTML: ({ border }: { border: string | null }) =>
          border ? { border } : {},
      },
      cellpadding: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('cellpadding') ?? null,
        renderHTML: ({ cellpadding }: { cellpadding: string | null }) =>
          cellpadding ? { cellpadding } : {},
      },
      cellspacing: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('cellspacing') ?? null,
        renderHTML: ({ cellspacing }: { cellspacing: string | null }) =>
          cellspacing ? { cellspacing } : {},
      },
    }
  },
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      // 处理从 Microsoft Excel 粘贴的表格样式问题
      new Plugin({
        key: new PluginKey('handleExcelPaste'),
        props: {
          handlePaste(view, event) {
            const { clipboardData } = event
            if (!clipboardData) return false

            const html = clipboardData.getData('text/html')
            if (!html) return false

            const parser = new DOMParser()
            const doc = parser.parseFromString(html, 'text/html')
            const excel = doc
              ?.querySelector('html')
              ?.getAttribute('xmlns:x')
              ?.includes('office:excel')
            if (!excel) {
              return false
            }

            const table = doc.querySelector('table')
            if (!table) return false

            const styleText = Array.from(doc.head.querySelectorAll('style'))
              .map((style) => style.textContent)
              .join('\n')

            // 提取所有样式规则
            const styles = extractStyles(styleText)

            // 添加单元格的样式
            table.querySelectorAll('td, th').forEach((cell: any) => {
              const style: any = styles[cell.getAttribute('class')]
              if (style?.background) {
                cell.style.background = style.background
              }
              if (style?.color) {
                cell.style.color = style.color
              }
              if (style?.['text-align']) {
                cell.setAttribute('align', style['text-align'])
              }
            })

            // 使用 ProseMirror 的 DOMParser 将表格转换为 ProseMirror 节点
            const { schema } = view.state
            const fragment =
              ProseMirrorDOMParser.fromSchema(schema).parse(table)
            const transaction = view.state.tr.replaceSelectionWith(fragment)
            view.dispatch(transaction)

            return true
          },
        },
      }),
    ]
  },
})

export default CustomTable.configure({
  allowTableNodeSelection: true,
  resizable: true,
})
