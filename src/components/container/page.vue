<template>
  <div class="umo-main-container">
    <container-toc v-if="pageOptions.showToc" @close="pageOptions.showToc = false" />
    <div :class="`umo-zoomable-container umo-${pageOptions.layout}-container umo-scrollbar`">
      <div class="umo-zoomable-content" :style="{
        width: pageZoomWidth,
        height: pageZoomHeight,
      }">
        <t-watermark class="umo-page-content" :style="{
          '--umo-page-orientation': pageOptions.orientation,
          '--umo-page-background': pageOptions.background,
          '--umo-page-margin-top': (pageOptions.margin?.top ?? '0') + 'cm',
          '--umo-page-margin-bottom':
            (pageOptions.margin?.bottom ?? '0') + 'cm',
          '--umo-page-margin-left': (pageOptions.margin?.left ?? '0') + 'cm',
          '--umo-page-margin-right':
            (pageOptions.margin?.right ?? '0') + 'cm',
          '--umo-page-width':
            pageOptions.layout === 'page' ? pageSize.width + 'cm' : 'auto',
          '--umo-page-height':
            pageOptions.layout === 'page' ? pageSize.height + 'cm' : '100%',
          width:
            pageOptions.layout === 'page' ? pageSize.width + 'cm' : '100%',
          transform: `scale(${pageOptions.zoomLevel ? pageOptions.zoomLevel / 100 : 1})`,
        }" :alpha="pageOptions.watermark.alpha" v-bind="watermarkOptions" :watermark-content="pageOptions.watermark">
          <div class="umo-page-node-header" contenteditable="false">
            <div class="umo-page-corner corner-tl" style="width: var(--umo-page-margin-left)"></div>

            <div class="umo-page-node-header-content"></div>
            <div class="umo-page-corner corner-tr" style="width: var(--umo-page-margin-right)"></div>
          </div>
          <div class="umo-page-node-content">
            <editor>
              <template #bubble_menu="props">
                <slot name="bubble_menu" v-bind="props" />
              </template>
              <template #paragraph_left_menu="props">
                <slot name="paragraph_left_menu" v-bind="props" />
              </template>
            </editor>
          </div>
          <div class="umo-page-node-footer" contenteditable="false">
            <div class="umo-page-corner corner-bl" style="width: var(--umo-page-margin-left)"></div>
            <div class="umo-page-node-footer-content"></div>
            <div class="umo-page-corner corner-br" style="width: var(--umo-page-margin-right)"></div>
          </div>
        </t-watermark>
      </div>
    </div>
    <t-image-viewer v-model:visible="imageViewer.visible" v-model:index="currentImageIndex" :images="previewImages" @close="imageViewer.visible = false" />
    <!-- 引用源浮动按钮 -->
    <transition name="umo-fade">
      <div
        v-if="showRefSource"
        class="umo-reference-source-float"
        :style="refSourceStyle"
        @click="handleRefSourceClick"
      >
        <slot name="reference_source" :config="refSourceConfig">
          <slot name="reference-source" :config="refSourceConfig">
            <t-tooltip
              :content="refSourceConfig.tooltip"
              placement="top"
            >
              <div class="umo-reference-source-pill">
                <div class="umo-source-icons">
                  <div class="umo-source-circle circle-1">
                    <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="#2ba245" stroke-width="3" stroke-linecap="round"><path d="M6 4v7a6 6 0 0 0 12 0V4"/></svg>
                  </div>
                  <div class="umo-source-circle circle-2">
                    <svg viewBox="0 0 24 24" width="8" height="8" fill="#ffffff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                  </div>
                  <div class="umo-source-circle circle-3">
                    <svg viewBox="0 0 24 24" width="8" height="8" fill="#2ba245"><circle cx="4" cy="4" r="2.5"/><circle cx="12" cy="4" r="2.5"/><circle cx="20" cy="4" r="2.5"/><circle cx="4" cy="12" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="20" cy="12" r="2.5"/><circle cx="4" cy="20" r="2.5"/><circle cx="12" cy="20" r="2.5"/><circle cx="20" cy="20" r="2.5"/></svg>
                  </div>
                </div>
                <span class="umo-source-text">{{ refSourceConfig.text }}</span>
                <span v-if="refSourceConfig.count !== undefined && refSourceConfig.count !== null && refSourceConfig.count !== ''" class="umo-source-count">{{ refSourceConfig.count }}</span>
              </div>
            </t-tooltip>
          </slot>
        </slot>
      </div>
    </transition>
    <t-back-top :container="`${container} .umo-zoomable-container`" :visible-height="800" size="small" :offset="showRefSource && pageOptions.layout === 'web' ? ['70px', '28px'] : ['25px', '30px']" />
    <container-search-replace />
    <container-print />
  </div>
  <div v-if="viewerVisible" class="umo-viewer-container">
    <div class="umo-viewer-close-button" @click="viewer = false">
      <t-icon name="close" size="24" />
    </div>
    <!-- <umo-viewer v-bind="viewerOptions" @edit="viewer = false" @close="viewer = false" :showHeader="false" /> -->
  </div>
</template>

<script setup lang="ts">
// import UmoViewer from '@umoteam/viewer'
import { isRecord } from '@tool-belt/type-predicates'

import type { WatermarkOption } from '@/types'

const container = inject('container')
const imageViewer = inject('imageViewer')
const pageOptions = inject('page')

// 页面大小
const pageSize = $computed(() => {
  const { width, height } = pageOptions.value.size ?? { width: 0, height: 0 }
  return {
    width: pageOptions.value.orientation === 'portrait' ? width : height,
    height: pageOptions.value.orientation === 'portrait' ? height : width,
  }
})
// 页面缩放后的大小
const pageZoomWidth = $computed(() => {
  if (pageOptions.value.layout === 'web') {
    return '100%'
  }
  return `calc(${pageSize.width}cm * ${pageOptions.value.zoomLevel ? pageOptions.value.zoomLevel / 100 : 1})`
})

// 页面内容变化后更新页面高度
let pageZoomHeight = $ref('')
const setPageZoomHeight = async () => {
  await nextTick()
  if (pageOptions.value.layout === 'web') {
    pageZoomHeight = 'auto'
    return
  }
  const el = document.querySelector(`${container} .umo-page-content`)
  if (!el) {
    console.warn('The element <.umo-page-content> does not exist.')
    return
  }
  pageZoomHeight = `${(el.clientHeight * (pageOptions.value.zoomLevel ?? 1)) / 100}px`
}
onMounted(() => {
  void setPageZoomHeight()
})
watch(
  () => [
    pageOptions.value.layout,
    pageOptions.value.zoomLevel,
    pageOptions.value.size,
    pageOptions.value.orientation,
  ],
  () => {
    void setPageZoomHeight()
  },
  { deep: true },
)

// 编辑器内容发生变化后，自动调整页面高度
const editorInstance = inject('editor')
watch(
  () => editorInstance.value?.getHTML(),
  () => {
    void setPageZoomHeight()
  },
)

// 水印
const watermarkOptions = $ref<{
  x: number
  y?: number
  width?: number
  height: number
  type?: string
}>({
  x: 0,
  height: 0,
})
watch(
  () => pageOptions.value.watermark,
  ({ type }: Partial<WatermarkOption> = { type: '' }) => {
    if (type === 'compact') {
      watermarkOptions.width = 320
      watermarkOptions.y = 240
    } else {
      watermarkOptions.width = 480
      watermarkOptions.y = 360
    }
  },
  { deep: true, immediate: true },
)

// 图片预览
let previewImages = $ref<string[]>([])
let currentImageIndex = $ref<number>(0)

watch(
  () => imageViewer.value.visible,
  async (visible: boolean) => {
    if (!visible) {
      previewImages = []
      currentImageIndex = 0
      return
    }
    await nextTick()
    const images = document.querySelectorAll(
      `${container} .umo-page-node-content img[src]:not(.umo-icon)`,
    )
    Array.from(images).forEach((image, index) => {
      const src = (image as HTMLImageElement).getAttribute('src')
      const nodeId = (image as HTMLImageElement).getAttribute('data-id')
      previewImages.push(src)
      if (nodeId === imageViewer.value.current) {
        currentImageIndex = index
      }
    })
  },
)

// 文档预览
const options = inject('options')
const viewer = inject('viewer')
let viewerVisible = $ref(false)
const { locale } = useI18n()
const getVanillaHTML = inject('getVanillaHTML')
const viewerOptions = $ref({
  lang: locale.value,
  theme: options.value.theme,
  mode: ['html'],
  title: options.value.document.title,
  html: '',
  editable: true,
  closeable: true,
  showAside: false,
})
watch(viewer, async (visible: boolean) => {
  viewerOptions.html = visible ? await getVanillaHTML() : ''
  viewerVisible = visible
})

// 引用源浮动按钮逻辑
const onReferenceClick = inject<((e: MouseEvent) => void) | undefined>(
  'handleReferenceClick',
  undefined,
)

const showRefSource = computed(() => {
  if (options.value.showReferenceSource) return true
  if (pageOptions.value?.showReferenceSource) return true
  if (options.value.referenceSource === true) return true
  if (
    typeof options.value.referenceSource === 'number' &&
    options.value.referenceSource > 0
  ) {
    return true
  }
  if (isRecord(options.value.referenceSource)) {
    return Boolean(
      options.value.referenceSource.show ??
        options.value.referenceSource.visible ??
        true,
    )
  }
  return false
})

const refSourceConfig = computed(() => {
  const rs = options.value.referenceSource
  if (typeof rs === 'number') {
    return {
      count: rs,
      text: '源',
      tooltip: `引用${rs}篇资料作为参考`,
    }
  }
  if (isRecord(rs)) {
    const count = rs.count
    return {
      count,
      text: rs.text ?? '源',
      tooltip:
        rs.tooltip ??
        (count !== undefined && count !== null && count !== ''
          ? `引用${count}篇资料作为参考`
          : '查看引用源'),
    }
  }
  return {
    count: undefined,
    text: '源',
    tooltip: '查看引用源',
  }
})

const handleRefSourceClick = (event: MouseEvent) => {
  onReferenceClick?.(event)
}

const refSourceStyle = ref<Record<string, string>>({})

const updateRefSourcePosition = () => {
  if (!showRefSource.value) return
  if (pageOptions.value?.layout === 'web') {
    refSourceStyle.value = {
      right: '28px',
      bottom: '25px',
      left: 'auto',
    }
    return
  }

  const mainEl = document.querySelector<HTMLElement>(
    `${container} .umo-main-container`,
  )
  const contentEl = document.querySelector<HTMLElement>(
    `${container} .umo-zoomable-content`,
  )

  if (!mainEl || !contentEl) {
    refSourceStyle.value = {
      right: '28px',
      bottom: '25px',
      left: 'auto',
    }
    return
  }

  const mainRect = mainEl.getBoundingClientRect()
  const contentRect = contentEl.getBoundingClientRect()

  // 引用源按钮配置的间距，默认放在页面右侧边缘外侧 14px
  const rs = options.value.referenceSource
  const gap = isRecord(rs) && typeof rs.gap === 'number' ? rs.gap : 14

  const floatEl = document.querySelector<HTMLElement>(
    `${container} .umo-reference-source-float`,
  )
  const buttonWidth = floatEl?.offsetWidth || 85

  // 计算相对于 mainContainer 的 left 坐标
  let targetLeft = contentRect.right - mainRect.left + gap

  // 边界保护：若右侧空间不足则贴在容器视口右侧
  const maxLeft = mainRect.width - buttonWidth - 16
  const minLeft = 16

  if (targetLeft > maxLeft) {
    targetLeft = Math.max(minLeft, maxLeft)
  }

  refSourceStyle.value = {
    left: `${Math.round(targetLeft)}px`,
    bottom: '25px',
    right: 'auto',
  }
}

let refSourceResizeObserver: ResizeObserver | null = null
let refSourceRaf: number | null = null

const queueUpdateRefSourcePosition = () => {
  if (refSourceRaf !== null) cancelAnimationFrame(refSourceRaf)
  refSourceRaf = requestAnimationFrame(() => {
    updateRefSourcePosition()
    refSourceRaf = null
  })
}

onMounted(() => {
  window.addEventListener('resize', queueUpdateRefSourcePosition)
  const zoomableEl = document.querySelector<HTMLElement>(
    `${container} .umo-zoomable-container`,
  )
  zoomableEl?.addEventListener('scroll', queueUpdateRefSourcePosition, {
    passive: true,
  })

  const mainEl = document.querySelector<HTMLElement>(
    `${container} .umo-main-container`,
  )
  const contentEl = document.querySelector<HTMLElement>(
    `${container} .umo-zoomable-content`,
  )
  if (typeof ResizeObserver !== 'undefined') {
    refSourceResizeObserver = new ResizeObserver(() => {
      queueUpdateRefSourcePosition()
    })
    if (mainEl) refSourceResizeObserver.observe(mainEl)
    if (contentEl) refSourceResizeObserver.observe(contentEl)
  }

  void nextTick(() => {
    updateRefSourcePosition()
  })
})

onUnmounted(() => {
  if (refSourceRaf !== null) cancelAnimationFrame(refSourceRaf)
  window.removeEventListener('resize', queueUpdateRefSourcePosition)
  const zoomableEl = document.querySelector<HTMLElement>(
    `${container} .umo-zoomable-container`,
  )
  zoomableEl?.removeEventListener('scroll', queueUpdateRefSourcePosition)
  refSourceResizeObserver?.disconnect()
})

watch(
  () => [
    showRefSource.value,
    pageOptions.value?.layout,
    pageOptions.value?.zoomLevel,
    pageOptions.value?.size,
    pageOptions.value?.orientation,
    pageOptions.value?.showToc,
  ],
  () => {
    void nextTick(() => {
      updateRefSourcePosition()
    })
  },
  { deep: true },
)
</script>

<style lang="less">
.umo-main-container {
  height: 100%;
  display: flex;
  position: relative;
}

.umo-zoomable-container {
  flex: 1;
  scroll-behavior: smooth;

  &.umo-page-container {
    padding: 20px 50px;
    box-sizing: border-box;

    .umo-zoomable-content {
      margin: 0 auto;
      box-shadow:
        rgba(0, 0, 0, 0.06) 0px 0px 10px 0px,
        rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
    }
  }

  &.umo-web-container {
    display: flex;

    .umo-zoomable-content {
      flex: 1;

      .umo-page-corner {
        display: none;
      }

      .umo-page-content {
        min-height: 100%;

        .umo-page-node-content {
          min-height: 100px;
        }
      }
    }
  }

  .umo-page-content {
    transform-origin: 0 0;
    box-sizing: border-box;
    display: flex;
    position: relative;
    box-sizing: border-box;
    background-color: var(--umo-page-background);
    width: var(--umo-page-width);
    min-height: var(--umo-page-height);
    overflow: visible !important;
    display: flex;
    flex-direction: column;

    [contenteditable] {
      outline: none;
    }
  }
}

.umo-page-node-header {
  height: var(--umo-page-margin-top);
  overflow: hidden;
}

.umo-page-node-footer {
  height: var(--umo-page-margin-bottom);
  overflow: hidden;
}

.umo-page-node-header,
.umo-page-node-footer {
  display: flex;
  justify-content: space-between;
}

.umo-page-corner {
  box-sizing: border-box;
  position: relative;
  z-index: 10;
}

.umo-page-corner {
  @media print {
    opacity: 0;
  }

  &::after {
    position: absolute;
    content: '';
    display: block;
    height: 1cm;
    width: 1cm;
    border: solid 1px rgba(0, 0, 0, 0.08);
  }

  &.corner-tl::after {
    border-top: none;
    border-left: none;
    bottom: 0;
    right: 0;
  }

  &.corner-tr::after {
    border-top: none;
    border-right: none;
    bottom: 0;
    left: 0;
  }

  &.corner-bl::after {
    border-bottom: none;
    border-left: none;
    top: 0;
    right: 0;
  }

  &.corner-br::after {
    border-bottom: none;
    border-right: none;
    top: 0;
    left: 0;
  }
}

.umo-page-node-header-content,
.umo-page-node-footer-content {
  flex: 1;
}

.umo-page-node-content {
  position: relative;
  box-sizing: border-box;
  flex-shrink: 1;
}

.umo-back-top {
  position: absolute;

  &:hover {
    opacity: 0.9;
    background-color: var(--umo-color-white) !important;

    .umo-back-top__icon {
      color: var(--umo-primary-color);
    }
  }
}

.umo-viewer-container {
  position: absolute;
  inset: 0;
  z-index: 1000;

  .umo-viewer-close-button {
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    background-color: var(--umo-color-white);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
  }
}

.umo-reference-source-float {
  position: absolute;
  right: 28px;
  bottom: 25px;
  z-index: 50;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.25s ease, transform 0.25s ease;

  &.umo-fade-enter-active,
  &.umo-fade-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  &.umo-fade-enter-from,
  &.umo-fade-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }

  .umo-reference-source-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    padding: 0 10px 0 6px;
    background: var(--umo-color-white);
    border: 1px solid var(--umo-border-color-dark);
    border-radius: 9999px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: var(--umo-button-hover-background);
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
  }

  .umo-source-icons {
    display: inline-flex;
    align-items: center;
  }

  .umo-source-circle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 1.5px var(--umo-color-white);
    flex-shrink: 0;

    &.circle-1 {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      z-index: 3;
    }

    &.circle-2 {
      background: #00a870;
      margin-left: -5px;
      z-index: 2;
    }

    &.circle-3 {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      margin-left: -5px;
      z-index: 1;
    }
  }

  .umo-source-text {
    font-size: 12px;
    font-weight: 500;
    color: var(--umo-text-color);
    line-height: 1;
    margin-left: 2px;
  }

  .umo-source-count {
    font-size: 12px;
    font-weight: 600;
    color: var(--umo-primary-color);
    line-height: 1;
    margin-left: 1px;
  }
}
</style>