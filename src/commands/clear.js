const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('청소')
        .setDescription('채널의 메시지를 삭제합니다 (1개 ~ 99개)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('삭제할 메시지를 숫자로 입력해주세요')
                .setRequired(true)),
    async execute(interaction) {
        // 권한 확인: "MANAGE_MESSAGES"를 사용
        if (!interaction.member.permissions.has("MANAGE_MESSAGES")) {
            return interaction.reply({
                content: '이 명령어를 사용할 권한이 없습니다.',
                ephemeral: true // 호출자에게만 보이도록 설정
            });
        }

        const amount = interaction.options.getInteger('amount');

        // 입력된 숫자 검증
        if (amount > 100) {
            return interaction.reply({
                content: '한 번에 100개 이상의 메시지를 삭제할 수 없습니다.',
                ephemeral: true
            });
        }

        if (amount < 1) {
            return interaction.reply({
                content: '최소 1개의 메시지는 삭제해야 합니다.',
                ephemeral: true
            });
        }

        // 메시지 삭제 작업
        try {
            const fetchedMessages = await interaction.channel.messages.fetch({ limit: amount });

            // 14일 이상된 메시지를 필터링
            const filteredMessages = fetchedMessages.filter(msg => {
                // 현재 시간과 메시지 생성 시간의 차이를 계산
                const now = Date.now();
                const messageAge = now - msg.createdTimestamp;
                // 14일(1209600000 밀리초) 이상된 메시지는 필터링
                return messageAge < 1209600000;
            });

            // 메시지가 없을 경우
            if (filteredMessages.size === 0) {
                return interaction.reply({
                    content: '삭제할 수 있는 메시지가 없습니다. 14일 이상 지난 메시지는 삭제할 수 없습니다.',
                    ephemeral: true
                });
            }

            await interaction.channel.bulkDelete(filteredMessages);

            // 피드백 메시지 전송
            await interaction.reply({
                content: `${filteredMessages.size}개의 메시지가 삭제되었습니다!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('메시지 삭제 중 오류 발생:', error);
            await interaction.reply({
                content: '메시지 삭제 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    },
};
