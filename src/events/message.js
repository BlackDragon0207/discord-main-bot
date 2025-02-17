const { Events, EmbedBuilder } = require('discord.js'); // 필요한 모듈 import

// 메시지가 수신되면 호출되는 이벤트 핸들러
module.exports = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        // 봇이 보낸 메시지는 무시
        if (message.author.bot) return;

        // 출첵 채널 ID를 지정합니다. 채널 ID를 여기에 입력하세요
        const CHECK_CHANNEL_ID = '1331965623139307621';

        // 출첵 채널에서만 동작하도록 설정
        if (message.channel.id === CHECK_CHANNEL_ID) {
            // 메시지 내용이 '!출첵' 또는 '!출석'이 아닌 경우
            if (message.content.trim() !== '!출첵' && message.content.trim() !== '!출석') {
                try {
                    // 1초 후에 메시지 삭제
                    setTimeout(async () => {
                        try {
                            await message.delete();
                            console.log(`메시지를 삭제했습니다: ${message.content}`);

                            // 5초 후에 주의 임베드 메시지 전송
                            const warningMessage = await message.channel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('#ff0000')
                                        .setTitle('주의!')
                                        .setDescription(`이 채널에서는 \`!출첵\` 또는 \`!출석\` 외의 메시지를 보낼 수 없습니다. ${message.author}님의 메시지가 삭제되었습니다.`)
                                        .setFooter({ text: '서버 규칙에 따라 출첵 채널에서 해당 명령어 외의 메시지는 삭제됩니다.' })
                                        .setTimestamp()
                                ]
                            });

                            // 5초 후에 경고 메시지 삭제
                            setTimeout(async () => {
                                try {
                                    await warningMessage.delete();
                                    console.log('경고 메시지를 삭제했습니다.');
                                } catch (error) {
                                    console.error('경고 메시지를 삭제하는 도중 문제가 발생했습니다:', error);
                                }
                            }, 5000); // 5초 = 5000밀리초

                        } catch (error) {
                            console.error('메시지를 삭제하는 도중 문제가 발생했습니다:', error);
                        }
                    }, 1000); // 1초 = 1000밀리초

                } catch (error) {
                    console.error('메시지를 처리하는 도중 문제가 발생했습니다:', error);
                }
            }
        }
    });
};
