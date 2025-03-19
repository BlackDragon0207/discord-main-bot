// logs/chatLogs.js
const { EmbedBuilder } = require('discord.js');

// 로그를 전송할 채널 ID와 특정 서버 ID 설정
const chatLogChannelId = "1331965454079623220"
const targetGuildId = process.env.guildId;


module.exports = function(client) {
    // 메시지 수정 로그
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        // 메시지가 수정된 서버가 특정 서버가 아닌 경우 반환
        if (oldMessage.guild.id !== targetGuildId) return;

        if (oldMessage.partial || newMessage.partial) return;
        if (oldMessage.content === newMessage.content) return;

        const logChannel = client.channels.cache.get(chatLogChannelId);
        if (logChannel && logChannel.isTextBased()) {
            const messageLink = `https://discord.com/channels/${oldMessage.guild.id}/${oldMessage.channel.id}/${oldMessage.id}`;

            const embed = new EmbedBuilder()
                .setTitle('✅ 메시지 수정 로그')
                .setColor('#FFFF00')
                .setDescription(`<@${oldMessage.author.id}> (${oldMessage.author.tag}) 이(가) 메시지를 수정했습니다:`)
                .addFields(
                    { name: '> **채널**', value: `<#${oldMessage.channel.id}> (${oldMessage.channel.id})` },  // 채팅방 멘션 및 ID
                    { name: '> **메시지**', value: `[바로가기](${messageLink})` },  // 메시지 바로가기 링크
                    { name: '> **수정전 내용**', value: `${oldMessage.content || '없음'}` },  // 이전 메시지
                    { name: '> **수정후 내용**', value: `${newMessage.content || '없음'}` },  // 새로운 메시지
                )
                .setThumbnail(oldMessage.author.displayAvatarURL({ dynamic: true }))  // 프로필 이미지 추가
                .setFooter({ text: `메세지가 수정 되었습니다` })  // 채널 ID 정보 추가
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    });

    // 메시지 삭제 로그
    client.on("messageDelete", async (message) => {
        // 메시지가 존재하지 않으면 함수 종료
        if (!message) return;
    
        // 봇이 보낸 메시지인지 확인 (message.author가 null일 수 있음)
        if (!message.author || message.author.bot) return;

        const logChannel = client.channels.cache.get(chatLogChannelId);
        if (logChannel && logChannel.isTextBased()) {
            const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;

            const embed = new EmbedBuilder()
                .setTitle('❌ 메시지 삭제 로그')
                .setColor('#FF0000')
                .setDescription(`<@${message.author.id}> (${message.author.tag})가 메시지를 삭제했습니다.`)
                .addFields(
                    { name: '> **채널**', value: `<#${message.channel.id}> (${message.channel.id})` },  // 채팅방 멘션 및 ID
                    { name: '> **내용**', value: `${message.content || '내용 없음'}` },  // 삭제된 메시지
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))  // 사용자 프로필 이미지 추가
                .setFooter({ text: `메세지가 삭제 되었습니다.` })  // 채널 ID 정보 추가
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    });
};
