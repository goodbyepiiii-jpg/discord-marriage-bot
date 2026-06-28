export interface Child {
  id: string;
  name: string;
  parents: [string, string];
  guildId: string;
  born: number;
  age: number;
  hunger: number;
  sleep: number;
  happiness: number;
  future: string[];
  lastNotify: number;
  traits: string[];
}

export interface Marriage {
  partner1: string;
  partner2: string;
  guildId: string;
  channelId: string;
  channelName: string;
  marriedAt: number;
  roomEnteredAt: number | null;
  children: Child[];
}

export interface InteractionCount {
  [key: string]: number;
}

export interface PendingProposal {
  from: string;
  to: string;
  guildId: string;
  timestamp: number;
}

export const marriages = new Map<string, Marriage>();
export const interactionCounts = new Map<string, number>();
export const pendingProposals = new Map<string, PendingProposal>();
export const roomOccupancy = new Map<string, Set<string>>();

export function getMarriageKey(user1: string, user2: string): string {
  const sorted = [user1, user2].sort();
  return `${sorted[0]}-${sorted[1]}`;
}

export function findMarriage(userId: string, guildId: string): Marriage | null {
  for (const marriage of marriages.values()) {
    if (marriage.guildId === guildId &&
      (marriage.partner1 === userId || marriage.partner2 === userId)) {
      return marriage;
    }
  }
  return null;
}

export function getInteractionKey(user1: string, user2: string, guildId: string): string {
  const sorted = [user1, user2].sort();
  return `${guildId}-${sorted[0]}-${sorted[1]}`;
}

export function getInteractionCount(user1: string, user2: string, guildId: string): number {
  const key = getInteractionKey(user1, user2, guildId);
  return interactionCounts.get(key) ?? 0;
}

export function incrementInteraction(user1: string, user2: string, guildId: string): number {
  const key = getInteractionKey(user1, user2, guildId);
  const current = interactionCounts.get(key) ?? 0;
  const next = current + 1;
  interactionCounts.set(key, next);
  return next;
}

export const childNeeds = [
  { type: "hungry", message: "😢 đang đói và khóc! Hãy cho bé ăn!", command: "/feed" },
  { type: "sleepy", message: "😴 buồn ngủ và quấy khóc! Hãy ru bé ngủ!", command: "/sleep_baby" },
  { type: "crying", message: "😭 đang quấy khóc không rõ lý do! Hãy dỗ bé!", command: "/comfort" },
  { type: "bored", message: "🥺 đang buồn chán! Hãy chơi với bé!", command: "/play" },
  { type: "sick", message: "🤒 có vẻ không khỏe! Hãy chăm sóc bé!", command: "/heal" },
];

export const childMilestones: Record<number, string> = {
  1: "👶 Bé biết mỉm cười lần đầu!",
  3: "🍼 Bé bắt đầu ăn dặm!",
  5: "👣 Bé tập đi những bước đầu tiên!",
  7: "💬 Bé nói được từ đầu tiên!",
  10: "🎒 Bé sắp đến trường!",
  15: "📚 Bé đang học trung học!",
  18: "🎓 Bé trưởng thành!",
};

export const futureChoices: Record<string, { label: string; trait: string; description: string }[]> = {
  school: [
    { label: "🎨 Nghệ thuật", trait: "creative", description: "Bé sẽ trở thành người sáng tạo" },
    { label: "🔬 Khoa học", trait: "intelligent", description: "Bé sẽ trở thành nhà khoa học" },
    { label: "⚽ Thể thao", trait: "athletic", description: "Bé sẽ trở thành vận động viên" },
  ],
  hobby: [
    { label: "🎵 Âm nhạc", trait: "musical", description: "Bé yêu thích âm nhạc" },
    { label: "📖 Đọc sách", trait: "wise", description: "Bé trở nên thông thái" },
    { label: "🎮 Gaming", trait: "strategic", description: "Bé có tư duy chiến lược" },
  ],
  career: [
    { label: "👨‍⚕️ Bác sĩ", trait: "healer", description: "Bé cứu người" },
    { label: "👨‍🍳 Đầu bếp", trait: "chef", description: "Bé nấu ăn ngon" },
    { label: "🚀 Phi hành gia", trait: "adventurer", description: "Bé khám phá vũ trụ" },
  ],
};
