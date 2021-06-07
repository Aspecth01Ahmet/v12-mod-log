const Discord = require("discord.js");
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const moment = require("moment");
const { Client, Util } = require("discord.js");
const fs = require('fs');
const db = require("quick.db");
const http = require("http");
const express = require("express");
require("./util/eventLoader.js")(client);
const request = require("request");
const app = express();

//------------------Loga Mesaj Atma------------------\\

app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Tamamdır.");
  response.sendStatus(200);
});

//------------------Loga Mesaj Atma------------------\\

//----------------Projeyi Aktif Tutma----------------\\

app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

//----------------Projeyi Aktif Tutma----------------\\

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`${message}`);
};

//----------------Komut Algılayıcısı----------------\\

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});
client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  
  //----------------Komut Algılayıcısı----------------\\

  //---------------Perms Yerleştirmeleri--------------\\
  
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if ((message.author.id === ayarlar.sahip)) permlvl = 4;
  return permlvl;
};

//---------------Perms Yerleştirmeleri--------------\\

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});


client.login(ayarlar.token);



//__________________________________________TANIM__________________________________________//
const logs = require('discord-logs');
logs(client);
//__________________________________________TANIM__________________________________________//

//______________________________________KANAL SİLİNDİ______________________________________//
client.on("channelDelete",async (channel) => {
let modlog = await db.fetch(`log_${channel.guild.id}`);
if (!modlog) return;

const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**#${channel.name}**(\`${channel.id}\`) Adlı Kanal Silindi.\n\n **__Silen Kişi__** **<@${entry.executor.id}>** (\`${entry.executor.id}\`) \n\n **__Silinen Kanal Türü__** : **${channel.type}**`)
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED");
return client.channels.cache.get(modlog).send(embed);
});

//______________________________________KANAL SİLİNDİ______________________________________//

//_____________________________________KANAL OLUŞTURMA_____________________________________//
client.on("channelCreate", async function(channel)  {
let modlog = await db.fetch(`log_${channel.guild.id}`);
if (!modlog) return;

const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**#${channel.name}**(\`${channel.id}\`) Adlı Kanal Oluşturuldu.\n\n **__Oluşturan Kişi__** **<@${entry.executor.id}>** (\`${entry.executor.id}\`) \n\n **__Oluşturulan Kanal Türü__** : **${channel.type}**`)
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED");
return client.channels.cache.get(modlog).send(embed);
});
//_____________________________________KANAL OLUŞTURMA_____________________________________//

//____________________________________KANAL GÜNCELLENDİ____________________________________//

client.on("channelUpdate", async function(oldChannel, newChannel) {

let modlog = await db.fetch(`log_${oldChannel.guild.id}`);
if (!modlog) return;

const entry = await oldChannel.guild.fetchAuditLogs({type : "CHANNEL_UPDATE"}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**#${oldChannel.name}**(\`${oldChannel.id}\`) Adlı Kanal'da Değişiklik Yapıldı.\n\n **__Yapan Kişi__** : **<@${entry.executor.id}>**(\`${entry.executor.id}\`) \n\n **__Değişiklik Yapılan Kanal Türü__** : ${oldChannel.type}`)
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED");
return client.channels.cache.get(modlog).send(embed);
});

//____________________________________KANAL GÜNCELLENDİ____________________________________//

//_____________________________________KANAL SABİTLEME_____________________________________//

client.on("channelPinsUpdate", async function(channel) {

let modlog = await db.fetch(`log_${channel.guild.id}`);
if (!modlog) return;

const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**#${channel.name}**(\`${channel.id}\`) adlı kanal'da Sabitlemelerde Değişiklik Tespit Edildi.\n\n **__Yapan Kişi__** : <@${entry.executor.id}>(\`${entry.executor.id}\`)`)
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED");

  return client.channels.cache.get(modlog).send(embed);

});

//_____________________________________KANAL SABİTLENME_____________________________________//

//__________________________________KANAL AÇIKLAMA DEĞİŞME__________________________________//

client.on("guildChannelTopicUpdate", async(channel, oldTopic, newTopic) => {

let modlog = await db.fetch(`log_${channel.guild.id}`);
if (!modlog) return;

const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")   
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription('**Kanal Açıklaması Güncellendi**')
.addField("__Eski Durum__ ", `\`\`\`${oldTopic}\`\`\``, true)
.addField("__Yeni Durum__", `\`\`\`${newTopic}\`\`\``, true)

 client.channels.cache.get(modlog).send(embed);
     
});
//__________________________________KANAL AÇIKLAMA DEĞİŞME__________________________________//

//_____________________________________EMOJİ OLUŞTURMA______________________________________//


client.on("emojiCreate", async function(emoji) {

let modlog = await db.fetch(`log_${emoji.guild.id}`);
if (!modlog) return;

const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_CREATE'}).then(audit => audit.entries.first());

let emojis = emoji;

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")   
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`Sunucuya Yeni Bir Emoji Eklendi => (${emoji}) \n\n **__Emojiyi Ekleyen Kişi__** : **<@${entry.executor.id}>**(\`${entry.executor.id}\`)`)

return client.channels.cache.get(modlog).send(embed);

});

//_____________________________________EMOJİ OLUŞTURMA______________________________________//

//_______________________________________EMOJİ SİLME________________________________________//

client.on("emojiDelete", async function(emoji) {

let modlog = await db.fetch(`log_${emoji.guild.id}`);
if (!modlog) return;

const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_DELETE'}).then(audit => audit.entries.first());

let emojis = emoji;

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")   
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**${emoji.name}** (\`${emoji.id}\`) Adlı Emoji Sunucudan Silindi.\n\n **__Silen Kişi__** : **<@${entry.executor.id}> ** (\`${entry.executor.id}\`)`)

return client.channels.cache.get(modlog).send(embed);

});

//_______________________________________EMOJİ SİLME________________________________________//

//_____________________________________EMOJİ GÜNCELLEME_____________________________________//

client.on("emojiUpdate", async function(oldEmoji, newEmoji) {

let modlog = await db.fetch(`log_${oldEmoji.guild.id}`);
if (!modlog) return;

const entry = await oldEmoji.guild.fetchAuditLogs({type: 'EMOJI_UPDATE'}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")   
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`Bir Emoji Güncellendi Güncellenen Emoji => **${newEmoji}**(\`${newEmoji.id}\`) \n\n **__Emojiyi Güncelleyen Kişi__** :** <@${entry.executor.id}>**(\`${entry.executor.id}\`)`)

  return client.channels.cache.get(modlog).send(embed);

});

//_____________________________________EMOJİ GÜNCELLEME_____________________________________//

//___________________________________KULLANICI YASAKLANMA___________________________________//


client.on("guildBanAdd", async(guild, user) => {

let modlog = await db.fetch(`log_${guild.id}`);
if (!modlog) return;

const entry = await guild.fetchAuditLogs({type: "MEMBER_BAN"}).then(audit => audit.entries.first());
let embed = new Discord.MessageEmbed()
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setThumbnail(user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")   
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`**${user.username}**(\`${user.id}\`) Adlı Kullanıcı Sunucudan Banlandi\n\n **__Banlayan Kişi__** **<@${entry.executor.id}>**(\`${entry.executor.id}\`) \n**__Banlama Sebebi__** : \`\`\`${entry.reason}\`\`\``)

client.channels.cache.get(modlog).send(embed)

})

//___________________________________KULLANICI YASAKLANMA___________________________________//

//__________________________________KULLANICI YASAK KALKMA__________________________________//

client.on("guildBanRemove", async(guild, user, message) => {

let modlog = await db.fetch(`log_${guild.id}`);
if (!modlog) return;

const entry = await guild.fetchAuditLogs({type: "MEMBER_BAN_REMOVE"}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setThumbnail(user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED") 
.setDescription(`**${user.username}**(\`${user.id}\`) Adlı Kullanıcının Banı Açıldı.\n\n **__Banını Açan Kişi__** : **<@${entry.executor.id}>**(\`${entry.executor.id}\`)`)

client.channels.cache.get(modlog).send(embed)

})

//__________________________________KULLANICI YASAK KALKMA__________________________________//

//______________________________________MESAJ SİLİNME_______________________________________//

client.on("messageDelete", async function(message) {

if (message.author.bot || message.channel.type == "dm") return;

let modlog = await db.fetch(`log_${message.guild.id}`);
if (!modlog) return;

let embed = new Discord.MessageEmbed()
.setThumbnail(message.author.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")   
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${message.author.tag}`,`${message.author.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.addField(`__Mesaj Silindi !__`,`**Kullanıcı :** <@${message.author.id}> (${message.author.tag}) \n**Kanal :** <#${message.channel.id}> (${message.channel.name}) \n\n**Mesaj :** __${message.content}__`, false)

return client.channels.cache.get(modlog).send(embed);

});

//______________________________________MESAJ SİLİNME_______________________________________//

//_____________________________________MESAJ GÜNCELLEME_____________________________________//

client.on("messageUpdate", async function(oldMessage, newMessage) {

if (newMessage.author.bot || newMessage.channel.type == "dm") return;

let modlog = await db.fetch(`log_${newMessage.guild.id}`);
if (!modlog) return;

let main = await oldMessage.fetch();

if (oldMessage.content === newMessage.content) return;

let message = newMessage;

let embed = new Discord.MessageEmbed()
.setThumbnail(newMessage.author.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")
.setFooter(`Eylemi Gerçekleştiren: ${newMessage.author.tag}`,`${newMessage.author.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.addField("Eski Mesajı",`\`${oldMessage.content}\``)
.addField("Yeni Mesajı",`\`${newMessage.content}\``)
.setDescription(`<#${message.channel.id}> Adlı Kanal'da Bir Mesaj Düzenlendi.\n Düzenleyen : **${main.author}**\n Düzenlenen Mesaj İçin: [TIKLA](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);

return client.channels.cache.get(modlog).send(embed);

});

//_____________________________________MESAJ GÜNCELLEME_____________________________________//

//_____________________________________ÇOKLU MESAJ SİLME____________________________________//

client.on("messageDeleteBulk", async function(messages) {

let modlog = await db.fetch(`log_${messages.array()[0].guild.id}`);
if (!modlog) return;

let embed = new Discord.MessageEmbed()
.setThumbnail(messages.array()[0].author.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")   
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setFooter(`Eylemi Gerçekleştiren: ${messages.array()[0].author.tag}`,`${messages.array()[0].author.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**${messages.array()[0].author.username}**(\`${messages.array()[0].author.id}\`) Adlı Kullanıcı **${messages.size}** adet Mesaj Sildi! ** \n\n Sildiği Kanal :<#${messages.array()[0].channel.id}>**`);

return client.channels.cache.get(modlog).send(embed);

});

//_____________________________________ÇOKLU MESAJ SİLME____________________________________//

//____________________________________MESAJA EMOJİ EKLENDİ__________________________________//


client.on("messageReactionAdd", async function(messageReaction, user) {


let message;
  try {
    message = await messageReaction.fetch();
  } catch (err) {
    message = messageReaction;
  }
let modlog = await db.fetch(`log_${message.message.guild.id}`);
if (!modlog) return;

let embed = new Discord.MessageEmbed()
.setThumbnail(user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")
.setFooter(`Eylemi Gerçekleştiren: ${user.tag}`,`${user.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`\`Bir Mesaja Tepki Eklendi !\``)
.addField("Mesaj Bilgileri",`**__ID__** : ${message.message.id}\n**__Mesaj__** : ${message.message.content || "Mesaj Bilgisi Yok"}\n**__Yapan__** : ${message.message.author.username ||"Bulunamadı!"}`)
.addField("Emoji Bilgileri",`**__Ekleyen Kişi__** : ${user.username}\n**__Kişi ID__** : ${user.id}\n**__Emoji__** : ${message._emoji}`)

  return client.channels.cache.get(modlog).send(embed);

});

//____________________________________MESAJA EMOJİ EKLENDİ__________________________________//

//___________________________________MESAJDAN EMOJİ SİLİNDİ_________________________________//


client.on("messageReactionRemove", async function(messageReaction, user) {

let message;
  try {
    message = await messageReaction.fetch();
  } catch (err) {
    message = messageReaction;
  }
let modlog = await db.fetch(`log_${message.message.guild.id}`);
if (!modlog) return;
  let embed = new Discord.MessageEmbed()
.setThumbnail(user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("RED")
.setFooter(`Eylemi Gerçekleştiren: ${user.tag}`,`${user.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`\`Bir Mesajdan Tepki Kaldırıldı !\``)
.addField("Mesaj Bilgileri",`**__ID__** : ${message.message.id}\n**__Mesaj__** : ${message.message.content ||"Mesaj Bilgisi Yok"}\n**__Yapan__** : ${message.message.author.username ||"Yok"}`)
.addField("Tepki Bilgisi",`**__Tepkiyi Kaldıran__** : ${user.username}\n**__IDI__** : ${user.id}\n**__Emoji__** : ${message._emoji}`)
  
  return client.channels.cache.get(modlog).send(embed);

});

//___________________________________MESAJDAN EMOJİ SİLİNDİ_________________________________//

//______________________________________ROL OLUŞTURMA_______________________________________//


client.on("roleCreate",async function(role) {

let modlog = await db.fetch(`log_${role.guild.id}`);
if (!modlog) return;

const entry = await role.guild.fetchAuditLogs().then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor('#FAF3F3')
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`**${role.name}**(\`${role.id}\`) (\`${role.hexColor}\`) Adlı Rol Oluşturuldu!\n\n **__Oluşturan Kişi__** : <@${entry.executor.id}> (\`${entry.executor.id}\`)`)

  return client.channels.cache.get(modlog).send(embed);

});

//______________________________________ROL OLUŞTURMA_______________________________________//

//_______________________________________ROL SİLİNME________________________________________//

client.on("roleDelete", async function(role) {

let modlog = await db.fetch(`log_${role.guild.id}`);
if (!modlog) return;

const entry = await role.guild.fetchAuditLogs().then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor('#FAF3F3')
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`**${role.name}**(\`${role.id}\`) (\`${role.hexColor}\`) Adlı Rol Silindi!\n\n**__Silen Kişi__** : <@${entry.executor.id}> (\`${entry.executor.id}\`)`)

  return client.channels.cache.get(modlog).send(embed);

});

//_______________________________________ROL SİLİNME________________________________________//

//____________________________________DAVET OLUŞTURULDU_____________________________________//


client.on("inviteCreate", async function (message)  {

let modlog = await db.fetch(`log_${message.guild.id}`);
if (!modlog) return;

const entry = await message.guild.fetchAuditLogs({type: 'INVITE_CREATE'}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor('AQUA')
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`**__Davet Link__** : ${message} \n\n**__Daveti Oluşturan__** :** <@${entry.executor.id}>**(\`${entry.executor.id}\`)`)

 return client.channels.cache.get(modlog).send(embed);

});

//____________________________________DAVET OLUŞTURULDU_____________________________________//

//______________________________________DAVET SİLİNDİ_______________________________________//


client.on("inviteDelete",async function (message) {

let modlog = await db.fetch(`log_${message.guild.id}`);
if (!modlog) return;

const entry = await message.guild.fetchAuditLogs({type: 'INVITE_DELETE'}).then(audit => audit.entries.first());

let embed = new Discord.MessageEmbed()
.setThumbnail(entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor('AQUA')
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription (`**__Silinen Davet Linki__** : ${message} \n\n **__Daveti Silen Kişi__** : **<@${entry.executor.id}>**(\`${entry.executor.id}\`)`)

 return client.channels.cache.get(modlog).send(embed);

  });

//______________________________________DAVET SİLİNDİ_______________________________________//

//___________________________________KULLANICI ROL VERME____________________________________//

client.on("guildMemberRoleAdd",async (member, role) => {

let modlog = await db.fetch(`log_${member.guild.id}`);
if (!modlog) return;

const entry = await member.guild.fetchAuditLogs({type: ''}).then(audit => audit.entries.first());
 
let embed = new Discord.MessageEmbed()
.setThumbnail(member.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor('PURPLE')
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`<@${member.user.id}> **Adlı Kullanıcının Rolleri Güncellendi !**`)
.addField("Verilen Rol:",`✅ ${role}`, false)
.addField(`Rolü Veren Kişi`, `**<@${entry.executor.id}>**(\`${entry.executor.id}\`)`, false)

client.channels.cache.get(modlog).send(embed);
        
});

//___________________________________KULLANICI ROL VERME____________________________________//

//___________________________________KULLANICI ROL ALMA_____________________________________//

client.on("guildMemberRoleRemove", async(member, role) => {

let modlog = await db.fetch(`log_${member.guild.id}`);
if (!modlog) return;

const entry = await member.guild.fetchAuditLogs({type: ''}).then(audit => audit.entries.first());
 
let embed = new Discord.MessageEmbed()
.setThumbnail(member.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor('PURPLE')
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`<@${member.user.id}> **Adlı Kullanıcının Rolleri Güncellendi !**`)
.addField("Alınan Rol:", `⛔ ${role}`, true)
.addField(`Rolü Alan Kişi`, `**<@${entry.executor.id}>**(\`${entry.executor.id}\`)`)
               
client.channels.cache.get(modlog).send(embed);
        
});


//___________________________________KULLANICI ROL ALMA_____________________________________//

//________________________________TAKMA ADI GÜNCELLEŞTİRME__________________________________//

client.on("guildMemberNicknameUpdate", async(member, oldNickname, newNickname) => {

let modlog = await db.fetch(`log_${member.guild.id}`);
if (!modlog) return;

const entry = await member.guild.fetchAuditLogs({type: ''}).then(audit => audit.entries.first());
 
let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor('GOLD')
.setFooter(`Eylemi Gerçekleştiren: ${entry.executor.tag}`,`${entry.executor.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`<@${member.user.id}> **Adlı Kullanıcın Takma Adı Güncellendi !** \n\n**__Değiştiren Kişi__** : **<@${entry.executor.id}>**(\`${entry.executor.id}\`)`)
.addField("Eski İsim: ", `\`\`\`${oldNickname ? oldNickname : member.user.username}\`\`\``, true)
.addField("Yeni İsim: ", `\`\`\`${newNickname ? newNickname: member.user.username}\`\`\``, true)
.setThumbnail(member.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))

client.channels.cache.get(modlog).send(embed);
    
});


//________________________________TAKMA ADI GÜNCELLEŞTİRME__________________________________//

//___________________________________BOOST BASMA MESAJ______________________________________//


client.on("guildMemberBoost", async(member) => {

let modlog = await db.fetch(`log_${member.guild.id}`);
if (!modlog) return;
 
let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("#8CFED8")
.setFooter(`Eylemi Gerçekleştiren: ${member.user.tag}`,`${member.user.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**<@${member.user.id}>**(\`${member.user.id}\`) **Adlı Kullanıcı Sunucuya Boost Bastı !**`)
.setThumbnail(member.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
    
  client.channels.cache.get(modlog).send(embed);
});

//___________________________________BOOST BASMA MESAJ______________________________________//

//___________________________________BOOST ÇEKME MESAJ______________________________________//

client.on("guildMemberUnboost", async(member) => {

let modlog = await db.fetch(`log_${member.guild.id}`);
if (!modlog) return;

let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("#8CFED8")
.setFooter(`Eylemi Gerçekleştiren: ${member.user.tag}`,`${member.user.avatarURL({ dynamic: true, format: "png", size: 1024 })}`)
.setDescription(`**<@${member.user.id}>**(\`${member.user.id}\`) **Adlı Kullanıcı Boostunu Çekti !**`)
.setThumbnail(member.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
             
  client.channels.cache.get(modlog).send(embed);
});

//___________________________________BOOST ÇEKME MESAJ______________________________________//

//________________________________BOOST LEVEL ÇIKIŞ MESAJ___________________________________//

client.on("guildBoostLevelUp", async(guild, oldLevel, newLevel) => {

let modlog = await db.fetch(`log_${oldLevel.guild.id}`);
if (!modlog) return;

let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("#8CFED8")
.setDescription(`**Sunucunun Boost Seviyesi Arttı !**`)
.addField("Eski Level: ", `\`\`\`${oldLevel}\`\`\``, true)
.addField("Yeni Level: ", `\`\`\`${newLevel}\`\`\``, true)
         
  client.channels.cache.get(modlog).send(embed);
});

//________________________________BOOST LEVEL ÇIKIŞ MESAJ___________________________________//

//_________________________________BOOST LEVEL İNİŞ MESAJ___________________________________//


client.on("guildBoostLevelDown", async(guild, oldLevel, newLevel) => {

let modlog = await db.fetch(`log_${oldLevel.guild.id}`);
if (!modlog) return;

let embed = new Discord.MessageEmbed()
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setColor("#8CFED8")
.setDescription(`**Sunucunun Boost Seviyesi Düştü !!**`)
.addField("Eski Level: ", `\`\`\`${oldLevel}\`\`\``, true)
.addField("Yeni Level: ", `\`\`\`${newLevel}\`\`\``, true)

  client.channels.cache.get(modlog).send(embed);
});

//_________________________________BOOST LEVEL İNİŞ MESAJ___________________________________//

//_____________________________________BÖLGE DEĞİŞİM________________________________________//


client.on('guildRegionUpdate',async (guild, oldRegion, newRegion) => {

let modlog = await db.fetch(`log_${oldRegion.guild.id}`);
if (!modlog) return;
    
const oldUpper = oldRegion.charAt(0).toUpperCase() + oldRegion.substring(1);
const newUpper = newRegion.charAt(0).toUpperCase() + oldRegion.substring(1);
          
let embed = new Discord.MessageEmbed()
.setColor('YELLOW')
.setThumbnail(oldRegion.iconURL.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`**Sunucu Bölgesi Değiştirildi !** `)
.addField("Eski Bölge ", `\`\`\`${oldUpper}\`\`\``, true)
.addField("Yeni Bölge ", `\`\`\`${newUpper}\`\`\``, true)
            
  client.channels.cache.get(modlog).send(embed);
});

//_____________________________________BÖLGE DEĞİŞİM________________________________________//

//___________________________________AFK KANAL DEĞİŞİM______________________________________//

client.on("guildAfkChannelAdd", async(guild, afkChannel) => {
  
let modlog = await db.fetch(`log_${afkChannel.guild.id}`);
if (!modlog) return;
  
let embed = new Discord.MessageEmbed()
.setColor('YELLOW')
.setAuthor(client.user.username, client.user.avatarURL({ dynamic: true, format: "png", size: 1024 }))
.setDescription(`**AFK Kanalı Eklendi !!** `)
.addField('AFK Kanalı:', afkChannel, false)
            
  client.channels.cache.get(modlog).send(embed);
});

//___________________________________AFK KANAL DEĞİŞİM______________________________________//
