const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 경고 파일 경로
const warningsFilePath = path.join(__dirname, '..', 'warnings.json');

// 경고 데이터를 파일에서 불러오기
let warnings = {};
function loadWarnings() {
    if (fs.existsSync(warningsFilePath)) {
        warnings = JSON.parse(fs.readFileSync(warningsFilePath, 'utf-8'));
    } else {
        warnings = {};
    }
}

// 경고 데이터를 파일에 저장하는 함수
function saveWarnings() {
    fs.writeFileSync(warningsFilePath, JSON.stringify(warnings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('경고초기화')
        .setDescription('유저의 경고 기록을 초기화합니다.')
        .addUserOption(option => option.setName('유저').setDescription('경고 기록을 초기화할 유저를 선택하세요.').setRequired(true)),

    async execute(interaction) {
        // 관리자 권한이 있는지 확인
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '경고 초기화 명령어를 사용할 권한이 없습니다.', ephemeral: true });
        }

        // 유저 옵션 추출
        const user = interaction.options.getUser('유저');

        // 경고 데이터 리로드
        loadWarnings();

        // 해당 유저의 경고 기록이 있는지 확인
        if (!warnings[user.id]) {
            return interaction.reply({ content: `${user.tag}님은 경고 기록이 없습니다.`, ephemeral: true });
        }

        // 경고 기록 초기화
        delete warnings[user.id];

        // 경고 데이터를 파일에 저장
        saveWarnings();

        // 특정 채널에 임베드 메시지 전송
        const channel = await interaction.client.channels.fetch('952284021533048892'); // 채널 ID를 입력하세요
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('🔄 경고 기록 초기화')
                .setColor(0x00ff00)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '유저', value: `<@${user.id}>` },
                    { name: '결과', value: '경고 기록이 초기화되었습니다.' }
                )
                .setTimestamp();

            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('채널에 임베드를 보내는 도중 문제가 발생했습니다:', error);
            }
        } else {
            console.error('채널을 찾을 수 없습니다.');
        }

        // 사용자의 채널에 임베드 메시지 전송
        await interaction.reply({ content: '경고 기록이 초기화되었습니다.', ephemeral: true });
    }
};
