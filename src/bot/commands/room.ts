import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ChannelType,
} from "discord.js";
import { findMarriage, marriages, getMarriageKey } from "../data.js";

export const renameData = new SlashCommandBuilder()
  .setName("rename_room")
  .setDescription("🏠 Đặt tên phòng riêng của hai vợ chồng")
  .addStringOption((opt) =>
    opt.setName("name").setDescription("Tên mới cho phòng").setRequired(true)
  );

export async function renameExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const user = interaction.user;
  const guildId = interaction.guildId!;
  const newName = interaction.options.getString("name", true);

  const marriage = findMarriage(user.id, guildId);
  if (!marriage) {
    await interaction.editReply("❌ Bạn chưa kết hôn!");
    return;
  }

  if (interaction.channelId !== marriage.channelId) {
    await interaction.editReply("❌ Lệnh này chỉ dùng được trong phòng riêng của bạn!");
    return;
  }

  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.editReply("❌ Không thể đổi tên kênh này!");
    return;
  }

  const sanitized = newName.slice(0, 90).replace(/\s+/g, "-").toLowerCase();

  try {
    await channel.setName(sanitized);
    marriage.channelName = sanitized;
    await interaction.editReply(`✅ Đã đổi tên phòng thành **${sanitized}**!`);
  } catch {
    await interaction.editReply("❌ Không thể đổi tên phòng. Bot cần quyền Manage Channels!");
  }
}

export const divorceData = new SlashCommandBuilder()
  .setName("divorce")
  .setDescription("💔 Ly hôn (xóa phòng riêng và kết thúc hôn nhân)");

export async function divorceExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = interaction.user;
  const guildId = interaction.guildId!;

  const marriage = findMarriage(user.id, guildId);
  if (!marriage) {
    await interaction.editReply("❌ Bạn chưa kết hôn!");
    return;
  }

  const key = getMarriageKey(marriage.partner1, marriage.partner2);
  marriages.delete(key);

  const guild = interaction.guild!;

  try {
    const channel = guild.channels.cache.get(marriage.channelId);
    if (channel) {
      await channel.delete("Divorce");
    }
  } catch {
  }

  const partner =
    marriage.partner1 === user.id ? marriage.partner2 : marriage.partner1;

  await interaction.editReply(
    `💔 **${user.username}** và <@${partner}> đã ly hôn.\n\n` +
      `Phòng riêng đã bị xóa. Chúc may mắn trong tương lai.`
  );
}

export const statusData = new SlashCommandBuilder()
  .setName("marriage_status")
  .setDescription("💑 Xem trạng thái hôn nhân của bạn");

export async function statusExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = interaction.user;
  const guildId = interaction.guildId!;

  const marriage = findMarriage(user.id, guildId);
  if (!marriage) {
    await interaction.editReply("💔 Bạn chưa kết hôn.");
    return;
  }

  const partner =
    marriage.partner1 === user.id ? marriage.partner2 : marriage.partner1;

  const marriedFor = Math.floor((Date.now() - marriage.marriedAt) / 1000 / 60);
  const childrenCount = marriage.children.length;

  let childrenInfo = "";
  if (childrenCount > 0) {
    childrenInfo =
      "\n\n**👶 Con cái:**\n" +
      marriage.children
        .map(
          (c) =>
            `• **${c.name}** (${c.age} tuổi) — ❤️ ${c.happiness}% vui | 🍔 ${c.hunger}% no | 💤 ${c.sleep}% ngủ`
        )
        .join("\n");
  }

  await interaction.editReply(
    `💑 **Trạng thái hôn nhân**\n\n` +
      `👫 Vợ/chồng: <@${partner}>\n` +
      `💒 Kết hôn: ${marriedFor} phút trước\n` +
      `🏠 Phòng riêng: <#${marriage.channelId}>\n` +
      `👶 Số con: ${childrenCount}` +
      childrenInfo
  );
}
