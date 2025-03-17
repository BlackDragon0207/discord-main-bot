
const { checkLatestVideoAndShorts } = require('./youtubeNotifier');

async function startYoutubeNotifier() {
    console.log('유튜브 알림 기능 시작!');

    await checkLatestVideoAndShorts();

    setInterval(async () => {
        await checkLatestVideoAndShorts();
    }, 5 * 60 * 1000); // 5분마다 실행
}

module.exports = { startYoutubeNotifier };
