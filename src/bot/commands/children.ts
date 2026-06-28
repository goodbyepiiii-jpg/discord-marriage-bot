import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
  MessageActionRowComponentBuilder,
} from "discord.js";
import {
  findMarriage,
  Child,
  futureChoices,
  childMilestones,
} from "../data.js";

export const childrenData = new SlashCommandBuilder()
  .setName("children")
  .setDescription("👶 Xem thông tin con cái của bạn");

export async function childrenExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = interaction.user;
  const guildId = interaction.guildId!;

  const marriage = findMarriage(user.id, guildId);
  if (!marriage) {
    await interaction.editReply("❌ Bạn chưa kết hôn!");
    return;
  }

  if (marriage.children.length === 0) {
    await interaction.editReply(
      `👶 Chưa có con.\n\nHãy cùng vợ/chồng nhắn tin trong phòng riêng **2 phút** liên tục để có con!`
    );
    return;
  }

  const childList = marriage.children
    .map((child, i) => {
      const ageStr = child.age >= 18 ? "trưởng thành" : `${child.age} tuổi`;
      const traits = child.traits.length > 0 ? `\n  🌟 Tính cách: ${child.traits.join(", ")}` : "";
      return (
        `**${i + 1}. ${child.name}** (${ageStr})\n` +
        `  ❤️ Hạnh phúc: ${child.happiness}%\n` +
        `  🍔 No bụng: ${child.hunger}%\n` +
        `  💤 Ngủ đủ giấc: ${child.sleep}%` +
        traits
      );
    })
    .join("\n\n");

  await interaction.editReply(
    `👶 **Con cái của bạn:**\n\n${childList}\n\n` +
      `_Dùng /feed, /sleep_baby, /comfort, /play, /heal để chăm sóc bé_`
  );
}

export const feedData = new SlashCommandBuilder()
  .setName("feed")
  .setDescription("🍼 Cho con ăn")
  .addStringOption((opt) =>
    opt.setName("child_name").setDescription("Tên con (bỏ trống nếu chỉ có 1 con)").setRequired(false)
  );

export async function feedExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await careAction(interaction, "🍼 Đã cho bé ăn! Bé no và hài lòng.", "hunger", 30);
}

export const sleepBabyData = new SlashCommandBuilder()
  .setName("sleep_baby")
  .setDescription("😴 Ru bé ngủ");

export async function sleepBabyExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await careAction(interaction, "😴 Đã ru bé ngủ! Bé ngủ ngon rồi.", "sleep", 30);
}

export const comfortData = new SlashCommandBuilder()
  .setName("comfort")
  .setDescription("🤗 Dỗ bé nín khóc");

export async function comfortExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await careAction(interaction, "🤗 Bé đã nín rồi! Bé vui vẻ hơn.", "happiness", 25);
}

export const playData = new SlashCommandBuilder()
  .setName("play")
  .setDescription("🎮 Chơi với bé");

export async function playExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await careAction(interaction, "🎮 Bé rất vui khi được chơi! Hạnh phúc tăng lên.", "happiness", 20);
}

export const healData = new SlashCommandBuilder()
  .setName("heal")
  .setDescription("💊 Chăm sóc bé khi bé ốm");

export async function healExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await careAction(interaction, "💊 Bé đã khỏe hơn rồi! Tiếp tục chăm sóc bé nhé.", "happiness", 20);
}

async function careAction(
  interaction: ChatInputCommandInteraction,
  successMsg: string,
  stat: keyof Pick<Child, "hunger" | "sleep" | "happiness">,
  amount: number
): Promise<void> {
  const user = interaction.user;
  const guildId = interaction.guildId!;

  const marriage = findMarriage(user.id, guildId);
  if (!marriage) {
    await interaction.editReply("❌ Bạn chưa kết hôn!");
    return;
  }
  if (marriage.children.length === 0) {
    await interaction.editReply("❌ Bạn chưa có con!");
    return;
  }

  const nameOpt = (interaction.options.getString("child_name") ?? "").trim().toLowerCase();
  let child: Child | undefined;

  if (nameOpt) {
    child = marriage.children.find((c) => c.name.toLowerCase() === nameOpt);
    if (!child) {
      await interaction.editReply(`❌ Không tìm thấy con tên **${nameOpt}**!`);
      return;
    }
  } else if (marriage.children.length === 1) {
    child = marriage.children[0];
  } else {
    const names = marriage.children.map((c) => c.name).join(", ");
    await interaction.editReply(`❌ Bạn có nhiều con! Hãy chỉ định tên: ${names}`);
    return;
  }

  child[stat] = Math.min(100, child[stat] + amount);

  await interaction.editReply(
    `${successMsg}\n\n` +
      `**${child.name}** bây giờ: ❤️ ${child.happiness}% | 🍔 ${child.hunger}% | 💤 ${child.sleep}%`
  );
}

export const futureData = new SlashCommandBuilder()
  .setName("future")
  .setDescription("🌱 Quyết định tương lai của con")
  .addStringOption((opt) =>
    opt.setName("child_name").setDescription("Tên con").setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("stage")
      .setDescription("Giai đoạn cuộc đời")
      .setRequired(true)
      .addChoices(
        { name: "Trường học", value: "school" },
        { name: "Sở thích", value: "hobby" },
        { name: "Nghề nghiệp", value: "career" }
      )
  );

export async function futureExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = interaction.user;
  const guildId = interaction.guildId!;

  const marriage = findMarriage(user.id, guildId);
  if (!marriage) {
    await interaction.editReply("❌ Bạn chưa kết hôn!");
    return;
  }

  const name = interaction.options.getString("child_name", true);
  const stage = interaction.options.getString("stage", true) as keyof typeof futureChoices;

  const child = marriage.children.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (!child) {
    await interaction.editReply(`❌ Không tìm thấy con tên **${name}**!`);
    return;
  }

  if (child.future.includes(stage)) {
    await interaction.editReply(`❌ Bạn đã chọn hướng **${stage}** cho **${child.name}** rồi!`);
    return;
  }

  const choices = futureChoices[stage];
  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    choices.map((c, i) =>
      new ButtonBuilder()
        .setCustomId(`future_${i}`)
        .setLabel(c.label)
        .setStyle(ButtonStyle.Primary)
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = await interaction.editReply({
    content: `🌱 **Tương lai của ${child.name}** — Chọn hướng **${stage}**:`,
    components: [row] as any,
  });

  const partnerId = marriage.partner1 === user.id ? marriage.partner2 : marriage.partner1;

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (btn: ButtonInteraction) =>
      btn.user.id === user.id || btn.user.id === partnerId,
    time: 30000,
    max: 1,
  });

  collector.on("collect", async (btn: ButtonInteraction) => {
    const idx = parseInt(btn.customId.split("_")[1]);
    const chosen = choices[idx];
    if (!chosen) return;
    child.traits.push(chosen.trait);
    child.future.push(stage);

    await btn.update({
      content:
        `🌟 **${child.name}** đã được chọn: **${chosen.label}**\n` +
        `📖 ${chosen.description}\n\n` +
        `✨ Đặc điểm mới: **${chosen.trait}**`,
      components: [],
    });
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      await interaction.editReply({ content: "⏰ Hết thời gian chọn!", components: [] }).catch(() => {});
    }
  });
}

export { childMilestones };
