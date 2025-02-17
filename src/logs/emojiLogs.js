// logs/emojiLogs.js
const { EmbedBuilder } = require('discord.js');

// 로그를 전송할 채널 ID와 특정 서버 ID 설정
const reactionLogChannelId = "1331965454079623220"
const targetGuildId = process.env.guildId;

module.exports = function(client) {
    // 이모티콘 반응 추가 로그
    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return; // 봇의 반응은 무시

        // 서버가 특정 서버가 아닌 경우 반환
        if (reaction.message.guild.id !== targetGuildId) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('에러 발생:', error);
                return;
            }
        }

        const logChannel = client.channels.cache.get(reactionLogChannelId);
        if (logChannel && logChannel.isTextBased()) {
            const messageLink = `https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}`;

            const embed = new EmbedBuilder()
                .setTitle('👍 이모티콘 반응 추가 로그')
                .setColor('#00FF00')
                .setDescription(`<@${user.id}> (${user.tag}) 이(가) 메시지에 반응을 추가했습니다.`)
                .addFields(
                    { name: '> **채널**', value: `<#${reaction.message.channel.id}> (${reaction.message.channel.id})` },  // 채팅방 멘션 및 ID
                    { name: '> **내용**', value: `[바로가기](${messageLink})` },  // 메시지 바로가기 링크
                    { name: '> **이모티콘**', value: `${reaction.emoji.name}` },  // 추가된 이모티콘
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))  // 사용자 프로필 이미지 추가
                .setFooter({ text: `이모티콘이 추가되었습니다.` })  // 메시지 수정
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    });

    // 이모티콘 반응 제거 로그
    client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot) return; // 봇의 반응은 무시

        // 서버가 특정 서버가 아닌 경우 반환
        if (reaction.message.guild.id !== targetGuildId) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the reaction:', error);
                return;
            }
        }

        const logChannel = client.channels.cache.get(reactionLogChannelId);
        if (logChannel && logChannel.isTextBased()) {
            const messageLink = `https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}`;

            const embed = new EmbedBuilder()
                .setTitle('👎 이모티콘 반응 제거 로그')
                .setColor('#FF0000')
                .setDescription(`<@${user.id}> (${user.tag}) 이(가) 메시지에서 반응을 제거했습니다.`)
                .addFields(
                    { name: '> **채널**', value: `<#${reaction.message.channel.id}> (${reaction.message.channel.id})` },  // 채팅방 멘션 및 ID
                    { name: '> **내용**', value: `[바로가기](${messageLink})` },  // 메시지 바로가기 링크
                    { name: '> **이모티콘**', value: `${reaction.emoji.name}` },  // 제거된 이모티콘
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))  // 사용자 프로필 이미지 추가
                .setFooter({ text: `이모티콘이 제거되었습니다.` })  // 메시지 수정
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    });
};
