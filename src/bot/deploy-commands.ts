import { REST, Routes } from "discord.js";
import * as marry from "./commands/marry.js";
import * as room from "./commands/room.js";
import * as children from "./commands/children.js";
import * as nameChild from "./commands/nameChild.js";

const token = process.env.DISCORD_TOKEN!;
let clientId = process.env.DISCORD_CLIENT_ID!;

if (clientId.includes("client_id=")) {
  const match = clientId.match(/client_id=(\d+)/);
  if (match) clientId = match[1];
} else if (clientId.includes("discord.com")) {
  const match = clientId.match(/(\d{17,20})/);
  if (match) clientId = match[1];
}

console.log(`Using Client ID: ${clientId}`);

const commands = [
  marry.data.toJSON(),
  marry.acceptData.toJSON(),
  marry.rejectData.toJSON(),
  room.renameData.toJSON(),
  room.divorceData.toJSON(),
  room.statusData.toJSON(),
  children.childrenData.toJSON(),
  children.feedData.toJSON(),
  children.sleepBabyData.toJSON(),
  children.comfortData.toJSON(),
  children.playData.toJSON(),
  children.healData.toJSON(),
  children.futureData.toJSON(),
  nameChild.data.toJSON(),
];

const rest = new REST().setToken(token);

(async () => {
  console.log(`Registering ${commands.length} slash commands...`);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log("✅ All slash commands registered globally!");
})();
