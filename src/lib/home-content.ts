export const topics = [
  {
    name: "关系与情感",
    label: "RELATIONSHIPS",
    detail: "理解彼此，也看见自己",
    question: "在这段关系中，我真正需要的是什么？",
    icon: "circles",
  },
  {
    name: "事业与方向",
    label: "WORK & PURPOSE",
    detail: "在选择之间，找到自己的坐标",
    question: "面对工作上的选择，我可以先厘清什么？",
    icon: "path",
  },
  {
    name: "自我与成长",
    label: "SELF & GROWTH",
    detail: "向内探索，让改变慢慢发生",
    question: "最近反复出现的情绪，想提醒我什么？",
    icon: "star",
  },
  {
    name: "当下与抉择",
    label: "CHOICES",
    detail: "给纷乱的思绪，一个新的视角",
    question: "对于眼前的决定，我忽略了哪些可能？",
    icon: "cross",
  },
] as const;

export const spreads = [
  {
    id: "clarity",
    name: "当下的指引",
    english: "A MOMENT OF CLARITY",
    count: 1,
    time: "约 3 分钟",
    description: "从一个具体的问题开始，看见此刻值得留意的线索。",
    positions: ["当下的提醒"],
  },
  {
    id: "path",
    name: "看清，再向前",
    english: "THE PATH FORWARD",
    count: 3,
    time: "约 5 分钟",
    description: "梳理处境、理解阻力，找到一个可以开始的小小行动。",
    positions: ["当前处境", "需要看见的阻力", "可以尝试的行动"],
  },
  {
    id: "connection",
    name: "关系的另一面",
    english: "BETWEEN US",
    count: 3,
    time: "约 5 分钟",
    description: "从自己的感受与期待出发，探索关系里的互动模式。",
    positions: ["我的感受", "我的期待", "沟通的可能"],
  },
] as const;
export type Spread = (typeof spreads)[number];
