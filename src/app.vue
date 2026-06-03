<template>
  <div class="examples">
    <div class="box">

      <!-- ykx测试纠错 -->
      <div v-if="isYkxDev" class="ykx-test-editor">

        <umo-editor ref="editorRef" v-bind="testOptions">
        </umo-editor>

        <div class="test-panel">
          <button @click="handleFullTextCorrection">纠错</button>
          <div style="margin-top: 10px;">
            <button @click="handleApplyAllSuggestions">应用所有</button>
            <button @click="handleRejectAllSuggestions">拒绝所有</button>
          </div>
          <ul>
            <li v-for="suggestion in editorSuggestions" :key="suggestion.id">
              <div>
                {{ suggestion.message }}
              </div>
              <div>
                <button @click="handleApplySuggestion(suggestion)">应用</button>
                <button @click="handleRejectSuggestion(suggestion)">拒绝</button>
                <button @click="handlePointToSuggestion(suggestion)">定位</button>
              </div>

            </li>

          </ul>
          <button @click="handleGetTextDirty">获取正文是否变动字段</button>
        </div>
      </div>
      <umo-editor v-else ref="editorRef" v-bind="options" @exportWord="handleExportWord"
        @customSaveContent="handleCustomSaveContent">
        <template #paragraph_left_menu="props">
          <!-- <umo-menu-button>1111</umo-menu-button> -->
        </template>
        <template #extended-actions>
          <t-button size="small" variant="text" @click="handleOpenImportHtmlDialog">
            导入HTML测试
          </t-button>
          <t-button size="small" variant="text" @click="handleGetHtmlContent">
            获取html内容
          </t-button>
        </template>
      </umo-editor>

      <t-dialog v-model:visible="importHtmlDialogVisible" header="导入HTML测试" width="720px"
        :confirm-btn="{ content: '确定' }" :cancel-btn="{ content: '取消' }" @confirm="handleConfirmImportHtml"
        @close="handleCloseImportHtmlDialog" @cancel="handleCloseImportHtmlDialog">
        <t-textarea v-model="importHtmlValue" placeholder="在这里粘贴/输入 HTML..." :autosize="{ minRows: 14, maxRows: 26 }" />
      </t-dialog>
    </div>
    <!-- <div class="box">
      <umo-editor editor-key="testaaa" :toolbar="{ defaultMode: 'classic' }" />
    </div> -->

  </div>
</template>

<script setup lang="ts">
import { shortId } from '@/utils/short-id'
import { useEditorStorage } from '@/hooks/useEditorStrorage'

const editorRef = useTemplateRef('editorRef')
const isYkxDev = import.meta.env.MODE === 'ykx'
const editorInstanceRef = computed(() => editorRef.value?.useEditor?.() ?? null)
// console.log('editorInstance', editorInstanceRef.value)
// 通过hook拿到建议列表，保持更新

const editorSuggestions = useEditorStorage<any[], any[]>(
  editorInstanceRef,
  (storage) => (storage as any).documentSuggest?.suggestions ?? [],
  [],
)
// const cptSuggestions = computed(() => editorSuggestions.value)
const templates = [
  {
    title: '工作任务',
    description: '工作任务模板',
    content:
      '<h1>工作任务</h1><h3>任务名称：</h3><p>[任务的简短描述]</p><h3>负责人：</h3><p>[执行任务的个人姓名]</p><h3>截止日期：</h3><p>[任务需要完成的日期]</p><h3>任务详情：</h3><ol><li>[任务步骤1]</li><li>[任务步骤2]</li><li>[任务步骤3]...</li></ol><h3>目标：</h3><p>[任务需要达成的具体目标或结果]</p><h3>备注：</h3><p>[任何额外信息或注意事项]</p>',
  },
  {
    title: '工作周报',
    description: '工作周报模板',
    content:
      '<h1>工作周报</h1><h2>本周工作总结</h2><hr /><h3>已完成工作：</h3><ul><li>[任务1名称]：[简要描述任务内容及完成情况]</li><li>[任务2名称]：[简要描述任务内容及完成情况]</li><li>...</li></ul><h3>进行中工作：</h3><ul><li>[任务1名称]：[简要描述任务当前进度和下一步计划]</li><li>[任务2名称]：[简要描述任务当前进度和下一步计划]</li><li>...</li></ul><h3>问题与挑战：</h3><ul><li>[问题1]：[描述遇到的问题及当前解决方案或需要的支持]</li><li>[问题2]：[描述遇到的问题及当前解决方案或需要的支持]</li><li>...</li></ul><hr /><h2>下周工作计划</h2><h3>计划开展工作：</h3><ul><li>[任务1名称]：[简要描述下周计划开始的任务内容]</li><li>[任务2名称]：[简要描述下周计划开始的任务内容]</li><li>...</li></ul><h3>需要支持与资源：</h3><ul><li>[资源1]：[描述需要的资源或支持]</li><li>[资源2]：[描述需要的资源或支持]</li><li>...</li></ul>',
  },
]
// console.log('editorRef', editorRef)
const handleCustomSaveContent = () => {
  console.log('handleCustomSaveContent')
  editorRef.value?.saveContentStatus(true)
}
const handleExportWord = () => {
  console.log('handleExportWord')
}
const handleFullTextCorrection = () => {
  const editor = editorRef.value?.useEditor?.()
  editor?.chain().loadSuggestions().run()
}

const options = $ref({
  toolbar: {
    showToggleToolbar: false,
    // show: false,
    // defaultMode: 'classic',
    // menus: ['base'],
  },
  document: {
    title: '测试文档',
    content: localStorage.getItem('document.content') ?? '<p>测试文档</p>',
    characterLimit: 10000,
  },
  page: {
    layouts: ['page', 'web'],
    showBookmark: true,
  },
  templates,
  cdnUrl: 'https://cdn.umodoc.com',
  shareUrl: 'https://www.umodoc.com',
  file: {
    // allowedMimeTypes: [
    //   'application/pdf',
    //   'image/svg+xml',
    //   'video/mp4',
    //   'audio/*',
    // ],
  },
  importWord: {
    enabled: true,
    // async onCustomImportMethod() {
    //   return await Promise.resolve({
    //     value: '<p>测试导入word</p>',
    //   })
    // },
  },
  ai: {
    assistant: {
      enabled: true,
      async onMessage() {
        return await Promise.resolve('<p>AI助手测试</p>')
      },
    },
  },
  user: {
    id: 'umoeditor',
    label: 'Umo Editor',
    avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
  },
  users: [
    { id: 'umodoc', label: 'Umo Team' },
    { id: 'Cassielxd', label: 'Cassielxd' },
    { id: 'Goldziher', label: "Na'aman Hirschfeld" },
    { id: 'SerRashin', label: 'SerRashin' },
    { id: 'ChenErik', label: 'ChenErik' },
    { id: 'china-wangxu', label: 'china-wangxu' },
    { id: 'Sherman Xu', label: 'xuzhenjun130' },
    { id: 'testuser', label: '测试用户' },
  ],
  // https://dev.umodoc.com/cn/docs/options/extensions#disableextensions
  disableExtensions: ['file', 'full-text-correction'],
  async onSave(content: string, page: number, document: { content: string }) {
    localStorage.setItem('document.content', document.content)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = true
        if (success) {
          console.log('onSave', { content, page, document })
          resolve('操作成功')
        } else {
          reject(new Error('操作失败'))
        }
      }, 2000)
    })
  },
  async onFileUpload(file: File & { url?: string }) {
    if (!file) {
      throw new Error('没有找到要上传的文件')
    }
    console.log('onUpload', file)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return {
      id: shortId(),
      url: file.url ?? URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size,
    }
  },
  onFileDelete(id: string, url: string, type: string) {
    console.log(id, url, type)
  },
})


/**
 * 根据错误词、所在段落文本和段落的全局位置，计算错误词的全局坐标
 *
 * @param {Object} suggestion - 后端返回的建议对象
 * @param {string} suggestion.text - 包含错误的完整段落文本
 * @param {string} suggestion.errorWord - 具体的错误词
 * @param {Object} suggestion.originalTextPos - 段落在全局的 {from, to}
 * @param {number} suggestion.appearTimes - 该错误词在段落中是第几次出现 (从 1 开始)
 * @returns {Object|null} - 返回 { from: number, to: number }，如果找不到则返回 null
 */
function calculateErrorPosition(suggestion: any) {
  const { text, errorWord, originalTextPos, appearTimes } = suggestion;
  const appearTimesNum = parseInt(appearTimes); // 防止传入的是字符串
  // 1. 基础校验
  if (!text || !errorWord || !originalTextPos) {
    console.warn("缺少必要字段，无法计算坐标");
    return null;
  }

  const segmentStart = originalTextPos.from;

  // 2. 在 text 中查找 errorWord 的第 appearTimes 次出现位置
  let startIndex = -1;
  let count = 0;
  let currentSearchIndex = 0;

  // 循环查找，直到找到第 N 次出现
  while (count < appearTimesNum) {
    const foundIndex = text.indexOf(errorWord, currentSearchIndex);

    if (foundIndex === -1) {
      // 如果还没找到第 N 次就结束了，说明数据有问题或 appearTimes 越界
      console.warn(`未在文本中找到第 ${appearTimesNum} 次出现的错误词 "${errorWord}"`);
      return null;
    }

    count++;
    if (count === appearTimesNum) {
      startIndex = foundIndex;
    } else {
      // 继续往后找，避免死循环 (从找到位置的下一个字符开始)
      currentSearchIndex = foundIndex + 1;
    }
  }

  if (startIndex === -1) {
    return null;
  }

  // 3. 计算全局绝对坐标
  const globalFrom = segmentStart + startIndex;
  const globalTo = globalFrom + errorWord.length;
  const endIndex = startIndex + errorWord.length;
  return {
    from: globalFrom,
    to: globalTo,
    originalHitText: text.slice(startIndex, endIndex)
  };
}

const editorPointToSuggestion = (id: string) => {
  const editor = editorRef.value?.useEditor?.()
  editor?.commands.pointSuggestion(id)
}
const handlePointToSuggestion = (suggestion: any) => {
  const editor = editorRef.value?.useEditor?.()
  editor?.commands.pointSuggestion(suggestion.id)
}
const handleApplySuggestion = (suggestion: any) => {
  const editor = editorRef.value?.useEditor?.()
  editor?.chain().applySuggestion(suggestion.id).run()
  editorPointToSuggestion(suggestion.id)
}
const handleRejectSuggestion = (suggestion: any) => {
  const editor = editorRef.value?.useEditor?.()
  editor?.chain().rejectSuggestion(suggestion.id).run();
  editorPointToSuggestion(suggestion.id)
}
const handleApplyAllSuggestions = () => {
  const editor = editorRef.value?.useEditor?.()
  editor?.chain().applyAllSuggestions().run()
}
const handleRejectAllSuggestions = () => {
  const editor = editorRef.value?.useEditor?.()
  editor?.chain().rejectAllSuggestions().run()
}
const handleGetTextDirty = () => {
  const editor = editorRef.value?.useEditor?.()
  console.log('getTextDirty', editor?.storage.documentSuggest.textDirty)
}
let importHtmlDialogVisible = $ref(false)
let importHtmlValue = $ref('')
const handleOpenImportHtmlDialog = () => {
  // const editor = editorRef.value?.useEditor?.()
  // importHtmlValue = editor?.getHTML?.() ?? ''
  importHtmlDialogVisible = true
}
const handleGetHtmlContent = () => {
  const editor = editorRef.value?.useEditor?.()
  console.log('importHtmlValue', editor?.getHTML?.())
}
const handleCloseImportHtmlDialog = () => {
  importHtmlDialogVisible = false
}
const handleConfirmImportHtml = () => {
  const editor = editorRef.value?.useEditor?.()
  if (editor) {
    editor.chain().setContent(importHtmlValue || '<p></p>', true).focus().run()
  }
  importHtmlDialogVisible = false
}
const testOptions = $ref({
  document: {
    content: ''
  },
  documentSuggestConfig: {
    onSuggestionClick: (suggestion: any) => {
      console.log('onSuggestionClick', suggestion)
    },
    rules: [
      {
        id: 'RULE_TITLE_SIZE',
        name: '标题字号规范',
        description: '标题(查找type为ul、li、heading的节点)必须使用h1-h6, params的level可以返回1-6',
        severity: 'warning',
        fixCommand: {
          action: 'setHeading',
          params: {
            level: 1,
          }
        }
      },
      {
        id: 'RULE_TEXT_COLOR_STYLE',
        name: '文本颜色规范',
        description: '文字里面不能出现红色， 你检测到后不用给参数给我',
        severity: 'warning',
        fixCommand: {
          action: 'resetTextStyle',
          params: {
            color: '',
          }
        }
      },
      {
        id: 'RULE_TEXT_BACKGROUND_STYLE',
        name: '文本背景色规范',
        description: '文字块不能出现背景色, 你检测到后不用给参数给我',
        severity: 'warning',
        fixCommand: {
          action: 'resetTextStyle',
          params: {
            backgroundColor: ''
          }
        }
      },
      {
        id: 'RULE_GRAMMAR_PROBLEM',
        name: '语法性问题',
        description: '语法性问题，核心是找语句不通顺的，你需要把纠错后的文本返回到fixCommand的params中的text字段中',
        severity: 'warning',
        fixCommand: {
          action: 'replaceText',
          params: {
            text: '',
          }
        }
      },
      {
        id: 'RULE_GRAMMAR_PROBLEM',
        name: '错别字问题',
        description: '错别字问题，需要注意携带上text_pos的from和to字段',
        severity: 'warning',
        fixCommand: {
          action: 'replaceText',
          params: {
            text: '',
          }
        }
      },
      // {
      //     id: 'RULE_FONT_FAMILY',
      //     name: '字体规范',
      //     description: '需采用仿宋字体',
      //     severity: 'error',
      //     fixCommand: {
      //         action: 'setFontFamily',
      //         params: {
      //             family: '仿宋',
      //         }
      //     }
      // },
    ],
    fetchSuggestions: async (doc: any, rules: any[], editor: any) => {
      const openTest = true;
      if (!openTest) {
        let suggestions = [];
        const resp = await fetch('http://localhost:8010/api/v1/ai/document/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doc,
            rules: rules,
          }),
        });
        if (!resp.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const payload = await resp.json();
        suggestions = (payload.data.suggestions || []);
        return suggestions.map((item: any) => ({ ...item, handleStatus: 'todo' }));
      } else {
        // console.log(doc);
        // const targetList = [
        //   {
        //     "id": "validScopeMsgMap",
        //     "message": "当前正文需为宋体\n当前正文字号需为小四",
        //     "ruleId": null,
        //     "appearTimes": null,
        //     "errorWord": null,
        //     "originalTextPos": null,
        //     "severity": null,
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": null
        //   },
        //   {
        //     "id": "1",
        //     "message": "错别字：'路线图' 应为 '路线图'",
        //     "ruleId": "9",
        //     "appearTimes": "1",
        //     "errorWord": "路线图",
        //     "originalTextPos": {
        //       "from": 145,
        //       "to": 163
        //     },
        //     "severity": "warning",
        //     "fixCommand": {
        //       "action": "replaceText",
        //       "params": {
        //         "text": "路线图"
        //       }
        //     },
        //     "meta": {
        //       "section": "一、提前谋划部署，科学布局“路线图”"
        //     },
        //     "text": "一、提前谋划部署，科学布局“路线图”"
        //   },
        //   {
        //     "id": "2",
        //     "message": "错别字：'听心声' 应为 '听心声'",
        //     "ruleId": "9",
        //     "appearTimes": "1",
        //     "errorWord": "听心声",
        //     "originalTextPos": {
        //       "from": 612,
        //       "to": 630
        //     },
        //     "severity": "warning",
        //     "fixCommand": {
        //       "action": "replaceText",
        //       "params": {
        //         "text": "听心声"
        //       }
        //     },
        //     "meta": {
        //       "section": "三、深化多维访谈，问需于民“听心声”"
        //     },
        //     "text": "三、深化多维访谈，问需于民“听心声”"
        //   },
        //   {
        //     "id": "1",
        //     "message": "存在敏感词：国家",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "国家",
        //     "originalTextPos": {
        //       "from": 31,
        //       "to": 143
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "为准确掌握全省冬小麦返青期苗情动态，科学研判粮食生产形势，国家统计局山东调查总队抢抓农时、主动作为，紧扣冬小麦返青起身关键窗口期，在全省16市128个县（市、区），抽选1470个不同规模的种粮主体，全面开展苗情监测专题调研。"
        //   },
        //   {
        //     "id": "1",
        //     "message": "存在敏感词：路线",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "路线",
        //     "originalTextPos": {
        //       "from": 145,
        //       "to": 163
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "一、提前谋划部署，科学布局“路线图”"
        //   },
        //   {
        //     "id": "1",
        //     "message": "存在敏感词：计划",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "计划",
        //     "originalTextPos": {
        //       "from": 165,
        //       "to": 368
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "针对山东地域广阔、气候差异较大的特点，山东总队充分发挥粮食生产全过程监测机制优势，调研启动前周密准备、精准布局。一是精准把握调研窗口期。遵循冬小麦返青由南至北逐步推进的规律，合理安排调研时序，确保调研踩在节点上、落在关键处。二是科学制定实施方案。统筹考虑种植结构、地形地貌及历年生产情况，兼顾产粮大县与典型区域，细化完善调研计划与路线安排，明确调研内容、方法步骤和责任分工，推动调研工作靶向发力、有序推进。"
        //   },
        //   {
        //     "id": "2",
        //     "message": "存在敏感词：路线",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "路线",
        //     "originalTextPos": {
        //       "from": 165,
        //       "to": 368
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "针对山东地域广阔、气候差异较大的特点，山东总队充分发挥粮食生产全过程监测机制优势，调研启动前周密准备、精准布局。一是精准把握调研窗口期。遵循冬小麦返青由南至北逐步推进的规律，合理安排调研时序，确保调研踩在节点上、落在关键处。二是科学制定实施方案。统筹考虑种植结构、地形地貌及历年生产情况，兼顾产粮大县与典型区域，细化完善调研计划与路线安排，明确调研内容、方法步骤和责任分工，推动调研工作靶向发力、有序推进。"
        //   },
        //   {
        //     "id": "1",
        //     "message": "存在敏感词：进行",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "进行",
        //     "originalTextPos": {
        //       "from": 391,
        //       "to": 610
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "为全面提升苗情调研的客观性和精准度，总队坚持问题导向与目标导向相统一，推动现代信息技术与农业调查的深度融合。一是以遥感技术锁定重点区域。运用卫星遥感长势监测技术，对全省冬小麦返青情况进行宏观筛查，精准识别苗情异常地块，为实地调研提供靶向指引。二是以实地核查校准数据偏差。针对遥感监测发现的弱苗、受灾等疑似地块，组织专业力量开展现场核实，对比不同地块、品种、播期的苗情差异，科学评估整体长势，构建“天上看、地上察、数据核”的立体化监测体系。"
        //   },
        //   {
        //     "id": "2",
        //     "message": "存在敏感词：信息",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "信息",
        //     "originalTextPos": {
        //       "from": 391,
        //       "to": 610
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "为全面提升苗情调研的客观性和精准度，总队坚持问题导向与目标导向相统一，推动现代信息技术与农业调查的深度融合。一是以遥感技术锁定重点区域。运用卫星遥感长势监测技术，对全省冬小麦返青情况进行宏观筛查，精准识别苗情异常地块，为实地调研提供靶向指引。二是以实地核查校准数据偏差。针对遥感监测发现的弱苗、受灾等疑似地块，组织专业力量开展现场核实，对比不同地块、品种、播期的苗情差异，科学评估整体长势，构建“天上看、地上察、数据核”的立体化监测体系。"
        //   },
        //   {
        //     "id": "1",
        //     "message": "存在敏感词：多维",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "多维",
        //     "originalTextPos": {
        //       "from": 612,
        //       "to": 630
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "三、深化多维访谈，问需于民“听心声”"
        //   },
        //   {
        //     "id": "1",
        //     "message": "存在敏感词：管理",
        //     "ruleId": "4",
        //     "appearTimes": "2",
        //     "errorWord": "管理",
        //     "originalTextPos": {
        //       "from": 632,
        //       "to": 868
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "坚持既“察苗情”也“听民情”，采取“实地察看、现场走访、深入座谈、综合研判”的方式，与种植农户、辅助调查员、新型经营主体代表面对面交流。一是聚焦田间生产管理。详细了解返青水浇灌、化肥农药施用、生产投入成本及预期收益等情况，精准掌握农户在春季田间管理中面临的困难与问题。二是聚焦政策落地见效。结合农产品集贸市场价格、生产者价格及上年实产数据，与农业农村部门、农技专家深入座谈交流，详细了解惠农政策落实、农技服务、农资价格变动及农户种植意愿变化等情况，全方位研判粮食生产形势。"
        //   },
        //   {
        //     "id": "2",
        //     "message": "存在敏感词：政策",
        //     "ruleId": "4",
        //     "appearTimes": "2",
        //     "errorWord": "政策",
        //     "originalTextPos": {
        //       "from": 632,
        //       "to": 868
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "坚持既“察苗情”也“听民情”，采取“实地察看、现场走访、深入座谈、综合研判”的方式，与种植农户、辅助调查员、新型经营主体代表面对面交流。一是聚焦田间生产管理。详细了解返青水浇灌、化肥农药施用、生产投入成本及预期收益等情况，精准掌握农户在春季田间管理中面临的困难与问题。二是聚焦政策落地见效。结合农产品集贸市场价格、生产者价格及上年实产数据，与农业农村部门、农技专家深入座谈交流，详细了解惠农政策落实、农技服务、农资价格变动及农户种植意愿变化等情况，全方位研判粮食生产形势。"
        //   },
        //   {
        //     "id": "3",
        //     "message": "存在敏感词：价格",
        //     "ruleId": "4",
        //     "appearTimes": "3",
        //     "errorWord": "价格",
        //     "originalTextPos": {
        //       "from": 632,
        //       "to": 868
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "坚持既“察苗情”也“听民情”，采取“实地察看、现场走访、深入座谈、综合研判”的方式，与种植农户、辅助调查员、新型经营主体代表面对面交流。一是聚焦田间生产管理。详细了解返青水浇灌、化肥农药施用、生产投入成本及预期收益等情况，精准掌握农户在春季田间管理中面临的困难与问题。二是聚焦政策落地见效。结合农产品集贸市场价格、生产者价格及上年实产数据，与农业农村部门、农技专家深入座谈交流，详细了解惠农政策落实、农技服务、农资价格变动及农户种植意愿变化等情况，全方位研判粮食生产形势。"
        //   },
        //   {
        //     "id": "4",
        //     "message": "存在敏感词：代表",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "代表",
        //     "originalTextPos": {
        //       "from": 632,
        //       "to": 868
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "坚持既“察苗情”也“听民情”，采取“实地察看、现场走访、深入座谈、综合研判”的方式，与种植农户、辅助调查员、新型经营主体代表面对面交流。一是聚焦田间生产管理。详细了解返青水浇灌、化肥农药施用、生产投入成本及预期收益等情况，精准掌握农户在春季田间管理中面临的困难与问题。二是聚焦政策落地见效。结合农产品集贸市场价格、生产者价格及上年实产数据，与农业农村部门、农技专家深入座谈交流，详细了解惠农政策落实、农技服务、农资价格变动及农户种植意愿变化等情况，全方位研判粮食生产形势。"
        //   },
        //   {
        //     "id": "1",
        //     "message": "存在敏感词：信息",
        //     "ruleId": "4",
        //     "appearTimes": "2",
        //     "errorWord": "信息",
        //     "originalTextPos": {
        //       "from": 890,
        //       "to": 1091
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "在扎实掌握一手数据的基础上，总队深挖调研信息，强化定量分析与趋势研判，为保障粮食安全、促进农民增收提供坚实统计支撑。一是深化部门协同联动。加强与农业农村、气象、水利等部门的沟通协作，健全信息共享机制，会商研判生产形势。二是强化全程动态监测。紧盯小麦拔节、孕穗、灌浆等关键生育期，加密监测频次、扩大监测范围，持续跟踪苗情变化、气象灾害影响及病虫害发生发展情况，为粮食生产全过程提供更加精准的统计调查服务。"
        //   },
        //   {
        //     "id": "2",
        //     "message": "存在敏感词：安全",
        //     "ruleId": "4",
        //     "appearTimes": "1",
        //     "errorWord": "安全",
        //     "originalTextPos": {
        //       "from": 890,
        //       "to": 1091
        //     },
        //     "severity": "warning",
        //     "fixCommand": null,
        //     "meta": null,
        //     "text": "在扎实掌握一手数据的基础上，总队深挖调研信息，强化定量分析与趋势研判，为保障粮食安全、促进农民增收提供坚实统计支撑。一是深化部门协同联动。加强与农业农村、气象、水利等部门的沟通协作，健全信息共享机制，会商研判生产形势。二是强化全程动态监测。紧盯小麦拔节、孕穗、灌浆等关键生育期，加密监测频次、扩大监测范围，持续跟踪苗情变化、气象灾害影响及病虫害发生发展情况，为粮食生产全过程提供更加精准的统计调查服务。"
        //   }
        // ]
        // const result = targetList.map((item) => {
        //   const calcInfo = calculateErrorPosition(item);
        //   return {
        //     ...item,
        //     originalHitText: calcInfo?.originalHitText ?? '',
        //     notNeedFix: item.id === 'validScopeMsgMap', // 增加一个不需修复的标识
        //     btns: item.ruleId === '4' || item.id === 'validScopeMsgMap' ? ['confirmed'] : ['accepted', 'ignored'], // 传入按钮数组
        //     textPos: {
        //       from: calcInfo?.from,
        //       to: calcInfo?.to,
        //     },
        //     handleStatus: 'todo'
        //   }
        // });
        const result = [
          {
            "id": "leaderAuditDetection",
            "message": "审批件标题跟源文件主题吻合，无明显错误。",
            "ruleId": null,
            "appearTimes": null,
            "errorWord": null,
            "originalTextPos": null,
            "severity": "warning",
            "fixCommand": null,
            "meta": null,
            "text": null,
            "isError": false,
            "originalHitText": "",
            "btns": [],
            "notNeedFix": true,
            "handleStatus": "todo",
            "file": {
              "id": "687",
              "name": "稿件1审批.png",
              "size": "223351",
              "type": "png"
            }
          },
          {
            "id": "odmkt2uqamo",
            "message": "内容未涉及会议精神或会议/培训相关要求",
            "ruleId": null,
            "appearTimes": null,
            "errorWord": null,
            "originalTextPos": null,
            "severity": "warning",
            "fixCommand": null,
            "meta": null,
            "text": null,
            "isError": true,
            "oldId": "validScopeMsgMap",
            "originalHitText": "",
            "notNeedFix": true,
            "btns": [
              "confirmed"
            ],
            "textPos": {},
            "handleStatus": "todo"
          },
          {
            "id": "6kfgq2jazpw",
            "message": "未出现'会议指出/强调/要求'等表述",
            "ruleId": null,
            "appearTimes": null,
            "errorWord": null,
            "originalTextPos": null,
            "severity": "warning",
            "fixCommand": null,
            "meta": null,
            "text": null,
            "isError": true,
            "oldId": "validScopeMsgMap",
            "originalHitText": "",
            "notNeedFix": true,
            "btns": [
              "confirmed"
            ],
            "textPos": {},
            "handleStatus": "todo"
          },
          {
            "id": "lqphe7s5kcw",
            "message": "当前正文字号需为小四\n当前正文需为宋体",
            "ruleId": null,
            "appearTimes": null,
            "errorWord": null,
            "originalTextPos": null,
            "severity": "warning",
            "fixCommand": null,
            "meta": null,
            "text": null,
            "isError": true,
            "oldId": "validScopeMsgMap",
            "originalHitText": "",
            "notNeedFix": true,
            "btns": [
              "confirmed"
            ],
            "textPos": {},
            "handleStatus": "todo"
          },
          {
            "id": "ipt1gcww4ew",
            "message": "错别字：'针' 应为 '对'",
            "ruleId": "9",
            "appearTimes": "1",
            "errorWord": "针",
            "originalTextPos": {
              "from": 171,
              "to": 172
            },
            "severity": "warning",
            "fixCommand": {
              "action": "replaceText",
              "params": {
                "text": "对"
              }
            },
            "meta": null,
            "text": "针",
            "isError": true,
            "oldId": "9",
            "originalHitText": "针",
            "notNeedFix": false,
            "btns": [
              "accepted",
              "ignored"
            ],
            "textPos": {
              "from": 171,
              "to": 172
            },
            "handleStatus": "todo"
          }
        ]
        return Promise.resolve(result);
      }
    }
  },
})
setTimeout(() => {
  if (isYkxDev) {
    const tiptapEditor = editorRef.value?.useEditor?.()
    const documentSuggestStorage = (tiptapEditor as any)?.storage?.documentSuggest
    if (documentSuggestStorage) {
      documentSuggestStorage.ignoreDirtyDepth = (documentSuggestStorage.ignoreDirtyDepth ?? 0) + 1
    }
    try {
      editorRef.value?.setContent('<p style="text-align: center;"><span style="font-family: SimSun;">关于网站建设、大模型建设和公众服务工作</span></p><p style="text-align: center;"><span style="font-family: SimSun;">开展情况的汇报</span></p><p style="text-align: center;"><span style="font-family: SimSun;">浙江省统计局</span></p><p style="text-align: center;"><br></p><p style="text-indent: 2em;"><span style="font-family: SimSun;">非常欢迎李主任和资料中心的各位领导来我局指导工作。根据调研要求，我就浙江局网站建设、人工智能大模型相关情况和公众服务工作进行简要汇报。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;">一、持续推进网站建设，不断优化完善网站管理能力</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>省市两级门户网站统一部署。从省级看，</b>我局现有网站两个，分别为门户网站（外网）和工作网站（内网，属于政务外网）。根据省委省政府相关要求，</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">门户网站于2018年迁至浙江省网站集约化平台</span><span style="font-family: SimSun;">，采用静态页面发布，部署在一朵云互联网区，通过阿里云WAF映射，访问开放了80和443</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">两个</span><span style="font-family: SimSun;">端口。门户网站系统涉及的后台发布、数据库、存储等关键节点均部署在一朵云专有云区域，由省政府安全团队统一负责，实现7</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">×</span><span style="font-family: SimSun;">24小时全天候实时监控与安全防护。工作网站部署在浙江政务云，由我局自行维护和管理。<b>从各地看，</b>各设区市统计局网站系统均已统一部署在</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">省的</span><span style="font-family: SimSun;">网站集约化平台，参照省级门户网站模式，各设区市统计局仅负责发布信息；各设区市网站安全等级依据2024年6月印发的《浙江省统计局网络安全等级保护定级指南》定级，</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">除温州市为三级外（自己要求），其余设区市均为二级。</span><span style="font-family: SimSun;">县级统计部门不单独建设网站，</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">仅在当地政府网站加载统计局相关页面</span><span style="font-family: SimSun;">。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>栏目清晰完备。</b>我局门户网站按政务管理要求，设置浙江省情、统计数据、统计快讯、统计法规、统计制度、政务公开和互动交流7个栏目，每个栏目下均设有相应子栏目。工作网站设置工作动态、组织机构、法制宣传、统计制度、统计信息、统计数据、统计分析、党建工作、队伍建设、管理制度和统计科研11个栏目及相应子栏目。<b>信息发布内外有别。</b>按照发布信息内外有别原则，门户网站和工作网站各栏目根据OA流转文件发布权限范围做好定期更新。门户网站月度发布经济运行情况综合分析通稿，季度发布经济运行新闻发布稿和记者问答口径，年度发布各类统计公报；重要节点，如“八八战略”二十周年，发布分领域、分专业、分市系列解读文章；统计数据按照</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">《浙江省统计局统计数据发布、新闻宣传和舆情监测工作细则》要求</span><span style="font-family: SimSun;">，在“数据浙江”发布主要宏观经济指标。<b>职责分工明确。</b>网站管理工作由局办公室牵头，研发中心、数管中心按职能配合开展。</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">其中，办公室除负责网站整体管理工作外，配备2人负文件通知加载</span><span style="font-family: SimSun;">；研发中心有1名专职网站管理员负责门户网站统计资料、工作动态等信息发布，定期由第三方公司开展门户网站安全检测，如链接有效性、文字表述、图片视频敏感词汇监测等；数管中心配备1名人员负责技术支撑，根据办公室提出的业务需求执行后台各项变更操作，如账号创建、权限分配、栏目调整等。<b>制度建设完善。</b>根据国家局及省级职能部门相关要求，我局制定并实施一系列管理制度，涵盖信息发布、数据安全、人员管理和应急响应多方面，主要有《浙江省统计局网络与信息安全管理办法》《浙江省统计局统计数据发布、新闻宣传和舆情监测工作细则》《浙江省统计系统网络安全体系规范》《浙江省统计局网络运维规范》《浙江省统计局政务新媒体管理办法》等，确保各项操作有章可循、流程规范。<b>安全保障有效。</b>每年依据等级保护标准开展信息系统安全等级保护测评（</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">其中门户网站三级、工作网站二级</span><span style="font-family: SimSun;">），定期进行漏洞扫描、渗透测试和安全评估。运维人员通过零信任设备连接至我局内部后，才能对工作网站资源进行运维操作，遵循“最小权限”原则，严格控制访问范围，有效防范供应链风险。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;">二、迭代升级统计大模型，不断提升统计大脑智能水平</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>统计特色大模型构建统计服务新范式。</b>我局积极探索人工智能在统计服务中应用，严格遵守大模型政务应用相关工作要求，完成deepseek满血版本地化部署，并同步基于通义千问等大模型，与省数据局协同开发“高质量发展监测智能助手”（目前上架了浙政钉，面向特定用户开放）。智能助手在安全环境下目前已搭建数万字提示词库，训练融入已发布非涉密的地区生产总值、投资、社零等9个核心指标的近三年省市县三级16万笔统计数据、572篇统计分析和435篇常用统计知识语料，实现“问统计数据、问经济形势、问统计知识”三问一体功能，用户通过自然语言交互，可快速获取数据、可视化图表、简要分析和知识解答，服务响应时间为“分秒级”，构建了“数据即时可得、形势基本可判、知识便捷共享”的统计服务新范式，为党委政府科学决策提供统计支撑。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>人工智能助推统计工作质高效优。</b>4月1日，我局为“统计大脑”接入“统计分析智能助手”功能，进一步提升“统计大脑”智能水平。分析助手由浙江局与绍兴市局联合开发，以DeepSeek-671b为基础大模型，围绕提升统计分析和公文写作工作质效，基于“DeepSeek+统计知识库”和投喂数据，交互启发文稿撰写方向思路、形成提纲，辅助撰写统计分析、统计信息、统计专报、课题报告等统计简报，以及发言稿、通知、培训资料等公文，识别错别字和语义错误，探索数据智能校对。<b>开发高质量发展监测智能助手，提升统计预测精准度。</b>围绕市县高质量发展绩效考核指标，基于“DeepSeek+Qwen+考核指标数据库+统计分析知识库”，语义化查询、深度思考分析指标数据，自动生成分析结果、可视化数据图表。同时，基于历史和相关性数据，分类预测GDP及其他主要经济指标。<b>探索统计分析核稿功能，拓展智能助手用途。</b>利用deepseek大模型开展已发布数据和统计分析的核稿功能探索，已成功实现统计分析文章中的数据与表格数据的自动校对、计量单位换算校对、分项指标简单加总计算校对和数据趋势变动自动确认等功能，极大提升统计政务信息审核效率。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;">三、用心用情做好公众服务，不断增强统计工作美誉度</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>公众服务渠道多样。</b></span><span style="font-family: SimSun; color: rgb(0, 0, 0);">近年来，在国家局指导下，</span><span style="font-family: SimSun;">我局</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">全面把握政府统计公众服务工作新形势、新要求，聚焦服务“两个先行”，更加突出群众视角，建设线上线下全渠道公开平台，推动政府统计公众服务工作更加透明规范、高效优质。我局</span><span style="font-family: SimSun;">公众服务主要渠道为</span><span style="font-family: SimSun; color: rgb(0, 0, 0);"><b>政务服务、</b></span><span style="font-family: SimSun;"><b>依申请政府信息公开、网上互动</b>三种途径，还包括来电、少量来信和个别来访。<b>其中，</b>政务服务依托浙江政务服务网，开设行政许可、行政奖励、公共服务、行政检查行政处罚事项等网上办理事项；依申请政府信息公开依托浙江省政府信息公开系统办理；网上互动版块依托浙江省民呼我为统一平台（省信访局平台）开设的“我要咨询、我要反映、我要建议、我要信访、领导信箱、智能问答、办理公开、查询评价”和互动交流（意见征集、在线访谈、智能问答）等栏目受理。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>公众服务工作规范。</b>我局成立政务公开和信访工作领导小组，负责统计政务公开和信访工作。领导小组办公室设在局办公室，协调全局政务公开和信访工作，按照不同来源渠道分别由相关工作人员接收、办公室提出拟办意见后再分发至各职能部门处理。其中，综合类统计资料由综合处牵头负责，单一专业指标及政务服务事项由对口部门办理。根据申请事项不同，简单事项均先口头沟通处理，复杂事项由办理部门按《浙江省统计局信访工作管理办法》提供的相关告知书模板答复，由办公室统一回复。目前未产生行政复议和行政诉讼。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>服务频次增加明显。政务服务方面</b>，目前，我局政务服务事项中暂无行政许可、行政奖励事项；行政处罚办理2025年至今为8件（2024年为12件）。<b>依申请政府信息公开方面</b>，2025年至今，已收到政府信息公开申请41件（2024年全年89件），其中正式答复函27件。<b>网上互动方面</b>，2025年至今，省民呼我为统一平台收办155件（2024年全年419件）。<b>电话咨询方面，</b>年均1100个左右，其中统一对外咨询电话接听约300个，办公室主任接听公众咨询答复电话推算约300个，综合处接听公众数据咨询电话约500个。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>数据类需求占比约95%</b>。我局公众服务以数据需求类为主，还有小部分涉及网站、职称考试、联网直报平台使用等情况，另有个别投诉类信访件，经甄别均不属于统计部门职能范围。<b>数据申请类以学术研究需求为主，申请指标多、时间跨度长、超过一半为外单位数据。</b>分类处理数据申请。对已在各级统计年鉴和“数据浙江”公布的，我局仅告知数据查询方式，由申请人自行查询；数源单位非统计部门的，经专业处确认后，提供数源部门规范全称及门户网站公布的联系方式；依据工作要求无法提供的，按照《浙江省统计局信访工作管理办法》的相关告知书模板</span><span style="font-family: SimSun; color: rgb(0, 0, 0);">答复</span><span style="font-family: SimSun;">。此外，还有小部分咨询全社会平均工资，主要用途为裁员补偿。<b>从今年学术数据需求看，</b>主要集中在GDP及分项、工业具体产品产量及中小类产值、货物进出口值及具体产品出口情况、研发投入相关数据、能源消费与碳排放统计核算、分县（市、区）常住人口等。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>4、 存在不足及相关建议</b></span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;"><b>大模型资源全省统一调配共享。</b>我局目前在用的大模型有DeepSeek-671B-R1、Qwen72B和Qwen2.5-Max三种，均部署在省政务云，由省数据局统一部署，以接口服务方式提供我局调用，所有大模型均与其他厅局共用，高峰期有卡顿，大模型服务崩溃会导致所有厅局的大模型应用均无法使用。<b>大模型算力支撑能力有待提升。</b>我省政务云由阿里云提供技术支撑，显卡采用阿里APG显卡，单卡显存96GB。我局模型算力由省数据局提供，采用向云服务商租用（1万元/每卡每月）方式使用。目前我局所用大模型共使用36张显卡（DeepSeek-671B-R1 16张、Qwen72B 4张、Qwen2.5-Max 16张）。因省数据局并未制定算力调度机制，当多个厅局共同使用大模型应用，会导致算力紧张，直至算力占满无法使用。遇到该情况时，只能等待省数据局重启大模型服务，释放资源，方可继续使用，会在一定程度影响大模型效力发挥。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun; color: rgb(0, 0, 0);">我局各项工作得到国家统计局的大力支持，李主任和资料中心各位领导长期关心我局工作，在网站建设、信息发布等方面给予指导，帮助我局做好各项工作。建议在每年一度的全国统计网站培训班上丰富教学方式，增加实操演示、小组讨论等内容，进一步提升培训效用并希望有机会能够资料中心心可以在浙江开展相关培训，实地指导我局工作。</span></p><p style="text-indent: 2em;"><span style="font-family: SimSun;">以上是我局相关情况的简要汇报。下一步我局将按照李主任本次调研的要求在网站建设、大模型建设和公众服务众服务做好各项工作。谢谢。</span></p>', { focusPostion: null });
    } finally {
      queueMicrotask(() => {
        if (documentSuggestStorage) {
          documentSuggestStorage.ignoreDirtyDepth = Math.max(0, (documentSuggestStorage.ignoreDirtyDepth ?? 0) - 1)
        }
      })
    }
  }

}, 1000)


</script>

<style lang="less">
html,
body {
  padding: 0;
  margin: 0;
}

.examples {
  margin: 20px;
  display: flex;
  height: calc(100vh - 40px);
}

.box {
  border: solid 1px #ddd;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100%;
}

html,
body {
  height: 100vh;
  overflow: hidden;
}

.ykx-test-editor {
  position: relative;

  .test-panel {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1000;
    width: 300px;
    height: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    background-color: #fff;
  }
}
</style>