import TableCell from '@tiptap/extension-table-cell'

const TableCellOptions = {
  addAttributes(): any {
    return {
      // @ts-ignore
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style') ?? null,
        renderHTML: ({ style }: { style: string | null }) =>
          style ? { style } : {},
      },
      align: {
        default: null,
        parseHTML: (element: any) => element.getAttribute('align') ?? null,
        renderHTML: ({ align }: any) => ({ align }),
      },
    }
  },
}

export default TableCell.extend(TableCellOptions)
export { TableCellOptions }
