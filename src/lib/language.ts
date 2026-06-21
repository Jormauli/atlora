export type UiLanguage = "zh" | "en";

export const uiCopy = {
  zh: {
    product: {
      subtitle: "知识星域",
      description: "把碎片知识连接成你的认知星图"
    },
    publicHome: {
      eyebrow: "atlora / knowledge starfield",
      headline: "把读过的内容，沉淀为真正属于你的知识",
      description: "输入链接、文本或图片，Atlora 自动提炼总结、核心观点、原文论据与行动建议。",
      primaryAction: "开始体验",
      secondaryAction: "已有账号",
      login: "登录",
      capabilities: [
        { title: "多来源采集", detail: "链接、文本、图片" },
        { title: "结构化提炼", detail: "总结、观点、论据" },
        { title: "按视角行动", detail: "研究、投资、成长" }
      ],
      flow: {
        eyebrow: "material / knowledge card",
        title: "从素材到知识，只需三步",
        description: "不改变你的阅读习惯，只把零散内容整理成可回看、可检索、可行动的知识卡片。",
        steps: [
          { title: "输入素材", detail: "粘贴链接或文字，也可以上传文章截图。" },
          { title: "AI 结构化提炼", detail: "自动整理总结、核心观点、原文论据与行动信息。" },
          { title: "沉淀为知识卡片", detail: "确认后保存到星域，随时检索、阅读和继续连接。" }
        ]
      }
    },
    navigation: {
      library: "星域",
      newCard: "新建星球",
      newMaterial: "新建素材",
      usage: "用量",
      settings: "设置",
      recent: "最近观测",
      logout: "退出"
    },
    auth: {
      loginTitle: "欢迎回来",
      registerTitle: "创建账号",
      email: "邮箱",
      password: "密码",
      passwordHint: "至少 8 位密码",
      nickname: "昵称，可选",
      login: "登录",
      register: "注册",
      loggingIn: "登录中...",
      registering: "注册中...",
      loginEyebrow: "返回你的知识星域",
      registerEyebrow: "开始构建你的知识星域",
      backHome: "返回首页",
      loginFailed: "邮箱或密码错误",
      registerFailed: "注册失败，请确认数据库已启动。",
      noAccount: "还没有账号？",
      hasAccount: "已有账号？"
    },
    onboarding: {
      title: "选择你的初始观测视角",
      description: "先选你常看的内容类型。之后每次生成卡片时，系统会在这些视角里判断最适合的 1-2 个视角。",
      enter: "进入星域"
    },
    dashboard: {
      eyebrow: "atlora / starfield",
      empty: "没有匹配的星球。",
      search: "搜索星球",
      sort: "排序",
      newest: "创建时间倒序",
      oldest: "创建时间正序",
      searchAll: "在全部星域内搜索",
      searchSelected: "在所选观测视角内搜索"
    },
    newMaterial: {
      eyebrow: "atlora / new planet",
      title: "新建素材",
      description: "把文本、截图或链接整理成一颗可检索的知识星球",
      textTab: "输入文本",
      imageTab: "上传图片",
      linkTab: "粘贴链接",
      viewLabel: "观测视角",
      autoView: "自动判断",
      textPlaceholder: "粘贴文本内容",
      urlPlaceholder: "https://...",
      generateDraft: "生成卡片草稿",
      uploadGenerate: "上传并生成",
      generateLink: "生成链接卡片",
      generateFailed: "生成失败。",
      reading: "阅读中...",
      generating: "生成中...",
      recognizing: "识别中...",
      stages: {
        textRead: "正在读取文本",
        textReadDetail: "检查文本长度和基本结构",
        viewMatch: "正在判断视角",
        viewMatchDetail: "从你选择的观测视角里匹配 1-2 个最合适的方向",
        cardGenerate: "正在生成卡片",
        cardGenerateDetail: "整理总结、核心观点和观测提炼",
        imageUpload: "正在上传图片",
        imageUploadDetail: "先校验图片格式和大小",
        imageOcr: "正在识别图片",
        imageOcrDetail: "提取截图里的正文或关键信息",
        imageCardDetail: "把识别结果整理成草稿",
        linkOpen: "正在打开链接",
        linkOpenDetail: "先尝试读取网页正文",
        linkExtract: "正在提取正文",
        linkExtractDetail: "公众号链接可能需要多一点时间",
        linkFallback: "正在尝试备用读取",
        linkFallbackDetail: "如果正文不可读，会自动尝试截图识别",
        linkCardDetail: "把读取结果整理成草稿",
        waited: "已等待"
      },
      advice: {
        text: "文本太短或结构不清时，可以多粘贴几段正文，或直接粘贴原文标题、摘要和关键段落。",
        image: "图片识别失败时，可以换一张更清晰的截图，裁掉无关区域，或改用复制文本上传。",
        link: "链接打不开或正文不可读时，可以手动复制正文、上传文章截图，或确认链接没有登录/权限限制。"
      }
    },
    contentViews: {
      all: "全部",
      investment_finance: "投资理财",
      market_research: "市场研究",
      tool_skill: "工具/技能",
      personal_growth: "个人成长",
      news: "新闻资讯",
      knowledge: "知识点",
      viral_article: "爆款好文",
      general_content: "通用内容"
    },
    editor: {
      saveTo: "保存到",
      saveChanges: "保存修改",
      delete: "删除",
      sourceLink: "原文链接",
      title: "标题",
      summary: "总结",
      keyPoints: "3 个核心观点+论据",
      tags: "标签",
      insights: "根据角色的启示",
      category: "分类"
    },
    card: {
      archive: "星球档案",
      sourceTitle: "原文标题",
      overview: "星球概览",
      keyPoints: "核心矿脉",
      insights: "观测提炼",
      noInsights: "当前所选视角暂无对应提炼。",
      source: "原始信号",
      close: "关闭卡片",
      edit: "编辑",
      delete: "删除卡片",
      deleteConfirmTitle: "确认删除这张卡片？",
      deleteConfirmBody: "删除后会从星域中移除，当前版本不会在页面中展示。",
      confirmDelete: "确认删除",
      deleting: "删除中...",
      cancel: "取消",
      deleteFailed: "删除失败，请稍后重试。"
    },
    settings: {
      eyebrow: "atlora / settings",
      title: "设置",
      description: "管理账号信息和默认观测参数",
      email: "邮箱",
      defaultView: "当前默认视角",
      unset: "未设置",
      ocrReminder: "OCR 提醒",
      usedThisMonth: "本月已用",
      remaining: "剩余",
      times: "次",
      threshold: "达到 {warning} 次时提醒，达到 {critical} 次时高优先级提醒。",
      warningMessage: "本月 OCR 已使用 {used}/{quota} 次，建议关注剩余额度。",
      criticalMessage: "本月 OCR 已使用 {used}/{quota} 次，接近或达到免费额度。"
    },
    usage: {
      eyebrow: "atlora / orbit usage",
      title: "用量记录",
      description: "查看本月识别额度和最近的模型调用轨迹",
      monthlyOcr: "本月 OCR 用量",
      critical: "接近上限",
      warning: "需要关注",
      ok: "额度正常",
      remaining: "剩余",
      threshold: "提醒阈值",
      time: "时间",
      type: "类型",
      task: "任务",
      modelTier: "模型层级",
      input: "输入",
      output: "输出",
      empty: "暂无用量记录",
      warningMessage: "本月 OCR 已使用 {used}/{quota} 次，建议关注剩余额度。",
      criticalMessage: "本月 OCR 已使用 {used}/{quota} 次，接近或达到免费额度。"
    }
  },
  en: {
    product: {
      subtitle: "Knowledge Starfield",
      description: "Connect scattered knowledge into your cognitive star map"
    },
    publicHome: {
      eyebrow: "atlora / knowledge starfield",
      headline: "Turn what you read into knowledge that is truly yours",
      description: "Add a link, text, or image. Atlora extracts the summary, core claims, source evidence, and actions.",
      primaryAction: "Start Exploring",
      secondaryAction: "I Have an Account",
      login: "Log in",
      capabilities: [
        { title: "Capture Anywhere", detail: "Links, text, images" },
        { title: "Extract Structure", detail: "Summary, claims, evidence" },
        { title: "Act by View", detail: "Research, investing, growth" }
      ],
      flow: {
        eyebrow: "material / knowledge card",
        title: "From material to knowledge in three steps",
        description: "Keep your reading habits. Atlora turns scattered material into knowledge cards you can revisit, search, and act on.",
        steps: [
          { title: "Add material", detail: "Paste a link or text, or upload screenshots from an article." },
          { title: "Let AI extract structure", detail: "Generate a summary, core claims, source evidence, and useful actions." },
          { title: "Save a knowledge card", detail: "Confirm it in your starfield, then search, read, and connect it later." }
        ]
      }
    },
    navigation: {
      library: "Starfield",
      newCard: "New Planet",
      newMaterial: "Add Material",
      usage: "Usage",
      settings: "Settings",
      recent: "Recent Signals",
      logout: "Log out"
    },
    auth: {
      loginTitle: "Welcome Back",
      registerTitle: "Create Account",
      email: "Email",
      password: "Password",
      passwordHint: "At least 8 characters",
      nickname: "Nickname, optional",
      login: "Log in",
      register: "Register",
      loggingIn: "Logging in...",
      registering: "Registering...",
      loginEyebrow: "Return to your knowledge starfield",
      registerEyebrow: "Start building your knowledge starfield",
      backHome: "Back to Home",
      loginFailed: "Email or password is incorrect",
      registerFailed: "Registration failed. Confirm the database is running.",
      noAccount: "No account yet?",
      hasAccount: "Already have an account?"
    },
    onboarding: {
      title: "Choose Your Starting Observation Views",
      description: "Pick the content types you read most. Future cards will be matched to the best 1-2 views from this set.",
      enter: "Enter Starfield"
    },
    dashboard: {
      eyebrow: "atlora / starfield",
      empty: "No matching planets.",
      search: "Search planets",
      sort: "Sort",
      newest: "Newest first",
      oldest: "Oldest first",
      searchAll: "Search all starfields",
      searchSelected: "Search selected view"
    },
    newMaterial: {
      eyebrow: "atlora / new planet",
      title: "Add Material",
      description: "Turn text, screenshots, or links into searchable knowledge planets",
      textTab: "Text",
      imageTab: "Image",
      linkTab: "Link",
      viewLabel: "Observation View",
      autoView: "Auto",
      textPlaceholder: "Paste text content",
      urlPlaceholder: "https://...",
      generateDraft: "Generate Draft",
      uploadGenerate: "Upload and Generate",
      generateLink: "Generate Link Card",
      generateFailed: "Generation failed.",
      reading: "Reading...",
      generating: "Generating...",
      recognizing: "Recognizing...",
      stages: {
        textRead: "Reading text",
        textReadDetail: "Checking length and basic structure",
        viewMatch: "Matching view",
        viewMatchDetail: "Selecting the best 1-2 views from your profile",
        cardGenerate: "Generating card",
        cardGenerateDetail: "Organizing summary, key points, and view insights",
        imageUpload: "Uploading image",
        imageUploadDetail: "Checking image format and size",
        imageOcr: "Recognizing image",
        imageOcrDetail: "Extracting article text or key information",
        imageCardDetail: "Turning recognition results into a draft",
        linkOpen: "Opening link",
        linkOpenDetail: "Trying to read webpage content first",
        linkExtract: "Extracting content",
        linkExtractDetail: "Official account links may take longer",
        linkFallback: "Trying fallback reading",
        linkFallbackDetail: "If content is unreadable, screenshot OCR may be attempted",
        linkCardDetail: "Turning extracted content into a draft",
        waited: "Waited"
      },
      advice: {
        text: "If the text is too short or unclear, paste more paragraphs or include the title, summary, and key passages.",
        image: "If image recognition fails, use a clearer screenshot, crop unrelated areas, or paste the text directly.",
        link: "If a link cannot be opened or read, paste the article text, upload screenshots, or check whether it requires login."
      }
    },
    contentViews: {
      all: "All",
      investment_finance: "Investing",
      market_research: "Market Research",
      tool_skill: "Tools/Skills",
      personal_growth: "Personal Growth",
      news: "News",
      knowledge: "Knowledge",
      viral_article: "Viral Article",
      general_content: "General"
    },
    editor: {
      saveTo: "Save to",
      saveChanges: "Save Changes",
      delete: "Delete",
      sourceLink: "Source Link",
      title: "Title",
      summary: "Summary",
      keyPoints: "3 Key Points + Evidence",
      tags: "Tags",
      insights: "View Insights",
      category: "Category"
    },
    card: {
      archive: "Planet Archive",
      sourceTitle: "Source Title",
      overview: "Planet Overview",
      keyPoints: "Core Veins",
      insights: "Observation Insights",
      noInsights: "No matching insight for the selected view.",
      source: "Source Signal",
      close: "Close Card",
      edit: "Edit",
      delete: "Delete Card",
      deleteConfirmTitle: "Delete this card?",
      deleteConfirmBody: "It will be removed from this starfield and hidden from the current view.",
      confirmDelete: "Confirm Delete",
      deleting: "Deleting...",
      cancel: "Cancel",
      deleteFailed: "Delete failed. Please try again later."
    },
    settings: {
      eyebrow: "atlora / settings",
      title: "Settings",
      description: "Manage account information and default observation parameters",
      email: "Email",
      defaultView: "Current Default View",
      unset: "Not set",
      ocrReminder: "OCR Reminder",
      usedThisMonth: "Used this month",
      remaining: "Remaining",
      times: "times",
      threshold: "Warn at {warning}; raise priority at {critical}.",
      warningMessage: "OCR usage is {used}/{quota} this month. Monitor the remaining quota.",
      criticalMessage: "OCR usage is {used}/{quota} this month and is near or at the free limit."
    },
    usage: {
      eyebrow: "atlora / orbit usage",
      title: "Usage",
      description: "Review this month's recognition quota and recent model calls",
      monthlyOcr: "Monthly OCR Usage",
      critical: "Near Limit",
      warning: "Needs Attention",
      ok: "Quota OK",
      remaining: "Remaining",
      threshold: "Threshold",
      time: "Time",
      type: "Type",
      task: "Task",
      modelTier: "Model Tier",
      input: "Input",
      output: "Output",
      empty: "No usage records",
      warningMessage: "OCR usage is {used}/{quota} this month. Monitor the remaining quota.",
      criticalMessage: "OCR usage is {used}/{quota} this month and is near or at the free limit."
    }
  }
} as const;

export type UiCopy = (typeof uiCopy)[UiLanguage];
export type ContentViewCopyKey = keyof typeof uiCopy.zh.contentViews;

const contentViewCopyKeys: Record<string, ContentViewCopyKey> = {
  all: "all",
  "全部": "all",
  investment_finance: "investment_finance",
  investment: "investment_finance",
  "投资理财": "investment_finance",
  market_research: "market_research",
  founder: "market_research",
  startup_product: "market_research",
  "市场研究": "market_research",
  tool_skill: "tool_skill",
  tools: "tool_skill",
  tool_app: "tool_skill",
  "工具/技能": "tool_skill",
  personal_growth: "personal_growth",
  "个人成长": "personal_growth",
  news: "news",
  "新闻资讯": "news",
  knowledge: "knowledge",
  learning: "knowledge",
  learning_note: "knowledge",
  "知识点": "knowledge",
  viral_article: "viral_article",
  creator: "viral_article",
  content_creator: "viral_article",
  "爆款好文": "viral_article",
  general_content: "general_content",
  general: "general_content",
  connection: "general_content",
  general_summary: "general_content",
  "综合摘要": "general_content",
  "通用内容": "general_content",
  "通用": "general_content"
};

export function localizedContentViewLabel(value: string | null | undefined, copy: UiCopy) {
  if (!value) return "";
  const key = contentViewCopyKeys[value];
  return key ? copy.contentViews[key] : value;
}
