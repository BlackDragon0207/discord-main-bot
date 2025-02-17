// register-commands.js
const { REST, Routes } = require('discord.js');
require('dotenv').config();
const { readdirSync } = require('fs');

(async () => {
    // REST 클라이언트 초기화
    const rest = new REST({ version: '10' }).setToken(process.env.token);

    // 명령어 파일 불러오기
    const commandFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'));
    console.debug(`명령어 파일을 로드 중: ${commandFiles.length}개의 파일 발견`);

    // 명령어 등록을 위한 배열
    const commands = [];

    // 명령어 파일에서 명령어 데이터 읽기
    for (const file of commandFiles) {
        try {
            const command = require(`./src/commands/${file}`);
            if (command.data && command.data.name) {
                commands.push(command.data.toJSON());
                console.debug(`명령어 데이터 준비 완료: ${command.data.name}`);
            } else {
                console.error(`명령어 파일 구조가 잘못되었습니다: ${file}`);
            }
        } catch (error) {
            console.error(`명령어 데이터 준비 중 오류 발생 (${file}):`, error);
        }
    }

    // 명령어 등록
    try {
        console.log('명령어 등록 중...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.clientId, process.env.guildId), //guildId는 본인이 적용하고 싶다하는 서버 ID를 적어주세요
            { body: commands },
        );
        console.log('명령어 등록 완료');
    } catch (error) {
        console.error('명령어 등록 중 오류 발생:', error);
    }
})();
