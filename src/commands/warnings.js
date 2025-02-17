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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('경고확인')
        .setDescription('유저의 경고 기록을 확인합니다.')
        .addUserOption(option => option.setName('유저').setDescription('경고 기록을 확인할 유저를 선택하세요.').setRequired(true)),

    async execute(interaction) {
        // 명령어가 길드 내에서 실행되었는지 확인
        if (!interaction.guild) {
            return interaction.reply({ content: '이 명령어는 서버에서만 사용할 수 있습니다.', ephemeral: true });
        }

        // 관리자 권한 체크
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: '이 명령어를 사용할 권한이 없습니다.', ephemeral: true });
        }

        // 유저 옵션 추출
        const user = interaction.options.getUser('유저');

        // 경고 데이터 리로드
        loadWarnings();

        // 해당 유저의 경고 기록이 있는지 확인
        const userWarnings = warnings[user.id];

        if (!userWarnings || userWarnings.count === 0) {
            return interaction.reply({ content: `${user.tag}님은 경고 기록이 없습니다.`, ephemeral: true });
        }

        // 유저의 경고 기록 가져오기
        const warningCount = userWarnings.count;
        const warningReasons = userWarnings.reasons.length > 0
            ? userWarnings.reasons.map((reason, index) => `사유 #${index + 1}: ${reason}`).join('\n')
            : '사유 없음';

        // 임베드 메시지로 경고 기록 보여주기
        const embed = new EmbedBuilder()
            .setTitle(`⚙️ 경고 기록 확인`)
            .setColor(0xffcc00)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '누적된 경고 횟수', value: `${warningCount}개` },
                { name: '경고 목록', value: warningReasons }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
