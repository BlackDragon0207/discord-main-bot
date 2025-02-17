const { AttachmentBuilder, ActivityType, Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const path = require('path');
const { readdirSync, writeFileSync, readFileSync, existsSync, watchFile } = require('fs');
require('dotenv/config');
const checkInHandler = require('./src/events/message');
const memberEventsHandler = require('./src/events/member');
const axios = require('axios');
const xml2js = require('xml2js');
const { google } = require('googleapis');
const youtube = google.youtube('v3');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
    ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.debug(`명령어 파일을 로드 중: ${commandFiles.length}개의 파일 발견`);

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            console.debug(`명령어 로드 완료: ${command.data.name}`);
        } else {
            throw new Error(`명령어 파일 구조가 잘못되었습니다: ${file}`);
        }
    } catch (error) {
        console.error(`명령어 파일 로드 실패 (${file}):`, error);
        sendErrorLog(`명령어 파일 로드 실패 (${file}): ${error.message}`);
    }
}

const logsPath = path.join(__dirname, 'src', 'logs');
readdirSync(logsPath).forEach(file => {
    if (file.endsWith('.js')) {
        require(path.join(logsPath, file))(client);
    }
});

client.once('ready', async () => {
    checkInHandler(client);
    memberEventsHandler(client);
    const messages = ['즐거운 시간 되세요!', '함께 해주셔서 감사합니다!'];
    let current = 0;

    setInterval(() => {
        client.user.setPresence({
            activities: [{ name: `${messages[current]}`, type: ActivityType.Watching }],
            status: 'idle',
        });
        current = (current + 1) % messages.length;
    }, 7500);

    console.log(`${client.user.tag}로 로그인 되었습니다!`);
    console.debug(`현재 서버에 연결된 길드 수: ${client.guilds.cache.size}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.debug(`명령어 실행 요청: ${interaction.commandName}`);
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.debug(`명령어를 찾을 수 없음: ${interaction.commandName}`);
        return;
    }
    try {
        await command.execute(interaction);
        console.debug(`명령어 실행 성공: ${interaction.commandName}`);
    } catch (error) {
        console.error(`명령어 실행 중 오류 발생: ${interaction.commandName}`, error);
        sendErrorLog(`명령어 실행 중 오류 발생: ${error.message}\n\n명령어: ${interaction.commandName}`);
        await interaction.reply({ content: '명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
    }
});

client.login(process.env.token).then(() => {
    console.log('봇이 성공적으로 로그인 되었습니다.');
}).catch(error => {
    console.error('로그인 중 오류 발생:', error);
});

const YOUTUBE_CHANNEL_ID = 'UCm-43e3QtutTBrlD-MuUM1A';
const CHECK_INTERVAL = 300000;
const LAST_VIDEO_ID_FILE = path.join(__dirname, 'lastVideoId.txt');
const VIDEO_INFO_FILE = path.join(__dirname, 'videoInfo.json');
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const logChannelId = '1331963775376687127';
const parser = new xml2js.Parser();

let lastVideoId = null;

function saveLastVideoId(videoId) {
    writeFileSync(LAST_VIDEO_ID_FILE, videoId, 'utf8');
}

function loadLastVideoId() {
    return existsSync(LAST_VIDEO_ID_FILE) ? readFileSync(LAST_VIDEO_ID_FILE, 'utf8') : null;
}

function saveVideoInfo(video) {
    const videoInfo = {
        videoId: video.videoId,
        title: video.title,
        publishedAt: video.publishedAt,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl
    };
    writeFileSync(VIDEO_INFO_FILE, JSON.stringify(videoInfo, null, 2), 'utf8');
}

function isVideoIdInJson(videoId) {
    if (existsSync(VIDEO_INFO_FILE)) {
        const data = readFileSync(VIDEO_INFO_FILE, 'utf8');
        const videoInfo = JSON.parse(data);
        return videoInfo.videoId === videoId;
    }
    return false;
}

async function checkLatestVideo() {
    try {
        const response = await axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`);
        const result = await parser.parseStringPromise(response.data);
        const latestVideo = result.feed.entry[0];
        const videoId = latestVideo['yt:videoId'][0];
        const videoTitle = latestVideo.title[0];
        const publishedAt = new Date(latestVideo.published[0]);
        const description = latestVideo['media:group'][0]['media:description'][0];
        const thumbnailUrl = latestVideo['media:group'][0]['media:thumbnail'][0].$.url;
        const now = new Date();

        console.log(`현재 videoId: ${videoId}, 이전 videoId: ${lastVideoId}`);
        console.log(`업로드 시간: ${publishedAt}, 현재 시간: ${now}`);

        if (isVideoIdInJson(videoId)) {
            console.log(`비디오 ID ${videoId}는 이미 JSON 파일에 존재합니다.`);
            return null;
        }

        if (videoId !== lastVideoId && (now - publishedAt) <= TWENTY_FOUR_HOURS) {
            lastVideoId = videoId;
            saveLastVideoId(videoId);
            saveVideoInfo({ videoId, title: videoTitle, publishedAt, description, thumbnailUrl });
            return { videoId, title: videoTitle, description, publishedAt, thumbnailUrl };
        }

        return null;
    } catch (error) {
        console.error('유튜브 RSS 피드 확인 중 오류 발생:', error.message);
        await sendErrorLog('유튜브 RSS 피드 확인 중 오류 발생: ' + error.message);
        return null;
    }
}

async function sendVideoNotification(video) {
    try {
        const ytchannel = client.channels.cache.get('1331966057795031122');
        if (ytchannel && ytchannel.isTextBased()) {
            const title = video.title || '제목 없음';
            const url = `https://www.youtube.com/watch?v=${video.videoId}`;
            const thumbnailUrl = video.thumbnailUrl || 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.png';
            const { data: thumbnailData } = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
            const thumbnailAttachment = new AttachmentBuilder(thumbnailData, { name: 'thumbnail.jpg' });

            await ytchannel.send({
                content: `[ <@&1331962732387242025> ]\n\n흑룡 BLACKDRAGON 채널에 영상이 업로드 되었습니다!\n제목 : ${title}\n링크 : ${url}`,
                files: [thumbnailAttachment],
                embeds: [new EmbedBuilder()
                    .setTitle(title)
                    .setURL(url)
                    .setDescription('-# 본 알림은 실제 알림과 **5분 ~ 20분** 까지 딜레이가 있습니다.')
                    .setImage('attachment://thumbnail.jpg')
                    .setColor(0xFF0000)
                    .setTimestamp(new Date(video.publishedAt))
                    .setFooter({ text: '새로운 유튜브 영상 알림' })
                ]
            });
        }
    } catch (error) {
        console.error('유튜브 영상 알림 전송 중 오류 발생:', error.message);
        await sendErrorLog('유튜브 영상 알림 전송 중 오류 발생: ' + error.message);
    }
}

async function sendErrorLog(message) {
    try {
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('오류 발생')
                .setDescription(message)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('로그 채널에 메시지 전송 중 오류 발생:', error);
    }
}

function watchVideoInfoFile() {
    watchFile(VIDEO_INFO_FILE, { interval: 1000 }, (curr, prev) => {
        console.log(`JSON 파일 변경 감지: ${VIDEO_INFO_FILE}`);
        const videoId = getVideoIdFromFile();
        if (videoId && isVideoIdInJson(videoId)) {
            console.log(`이미 JSON 파일에 존재하는 비디오 ID: ${videoId}`);
        }
    });
}

function getVideoIdFromFile() {
    if (existsSync(VIDEO_INFO_FILE)) {
        const data = readFileSync(VIDEO_INFO_FILE, 'utf8');
        const videoInfo = JSON.parse(data);
        return videoInfo.videoId;
    }
    return null;
}

const YOUTUBE_API_KEYS = [
    'AIzaSyAam10CyRVbELAG-qCLOHc4YRbeCbDqlLA',
    'AIzaSyDo-UCg9RxHkdx-_poNeJZpP3hcdG8rYzY',
    'AIzaSyAivWMOBmfv74fky1NfWo0VMIp71uE4YGo'
];
let currentApiKeyIndex = 0;

const VOICE_CHANNEL_IDS = {
    subscribers: '1331959325496709202',
    videos: '1331959396955324426',
    views: '1331959613872017470'
};

function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

async function getYoutubeStats() {
    let apiKey = YOUTUBE_API_KEYS[currentApiKeyIndex];
    try {
        const response = await youtube.channels.list({
            part: 'statistics',
            id: YOUTUBE_CHANNEL_ID,
            key: apiKey
        });

        const stats = response.data.items[0].statistics;
        return {
            subscriberCount: stats.subscriberCount || '0',
            videoCount: stats.videoCount || '0',
            viewCount: stats.viewCount || '0'
        };
    } catch (error) {
        console.error(`Error fetching YouTube stats with API key ${apiKey}:`, error);
        currentApiKeyIndex = (currentApiKeyIndex + 1) % YOUTUBE_API_KEYS.length;
        console.log(`Switching to API key ${YOUTUBE_API_KEYS[currentApiKeyIndex]}`);
        return getYoutubeStats();
    }
}

async function updateVoiceChannelNames() {
    const stats = await getYoutubeStats();
    if (!stats) return;

    const { subscriberCount, videoCount, viewCount } = stats;

    try {
        const subscriberChannel = await client.channels.fetch(VOICE_CHANNEL_IDS.subscribers);
        await subscriberChannel.setName(`🔴 구독자 | ${formatNumber(subscriberCount)}명`);

        const videosChannel = await client.channels.fetch(VOICE_CHANNEL_IDS.videos);
        await videosChannel.setName(`🎬 영상 | ${formatNumber(videoCount)}개`);

        const viewsChannel = await client.channels.fetch(VOICE_CHANNEL_IDS.views);
        await viewsChannel.setName(`📈 조회수 | ${formatNumber(viewCount)}회`);

        console.log(`음성 채널 이름 업데이트 완료: 구독자(${formatNumber(subscriberCount)}), 영상(${formatNumber(videoCount)}), 조회수(${formatNumber(viewCount)})`);
    } catch (error) {
        console.error('Error updating voice channel names:', error);
    }
}

client.once('ready', async () => {
    lastVideoId = loadLastVideoId();

    const video = await checkLatestVideo();
    if (video) {
        await sendVideoNotification(video);
    }

    setInterval(async () => {
        const video = await checkLatestVideo();
        if (video) {
            await sendVideoNotification(video);
        }
    }, CHECK_INTERVAL);

    watchVideoInfoFile();
    await updateVoiceChannelNames();
    setInterval(updateVoiceChannelNames, 30 * 60 * 1000);
});

