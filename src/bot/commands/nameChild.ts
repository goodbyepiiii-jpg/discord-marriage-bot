import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { nameChild } from "../childSystem.js";

export const data = new SlashCommandBuilder()
  .setName("name_child")
  .setDescription("📝 Đặt tên cho em bé mới sinh")
  .addStringOption((opt) =>
    opt.setName("name").setDescription("Tên của em bé").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = interaction.user;
  const guildId = interaction.guildId!;
  const name = interaction.options.getString("name", true).trim();

  if (name.length < 1 || name.length > 32) {
    await interaction.editReply("❌ Tên bé phải từ 1-32 ký tự!");
    return;
  }

  const result = nameChild(user.id, guildId, name);
  await interaction.editReply(result.message);
}
