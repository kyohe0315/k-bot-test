// dotenvパッケージを使って環境変数を読み込む（ローカル環境で使用する場合）
require('dotenv').config();

// Discord.jsをインポート
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// 環境変数からトークンを取得する
const TOKEN = process.env.DISCORD_TOKEN;

// Botが起動したときの処理
client.once('ready', () => {
    console.log('Bot is online!');
});

// メッセージを受け取ったときの処理
client.on('messageCreate', message => {
    if (message.content === 'ping') {
        message.channel.send('pong');
    }
});

// Botにログイン
client.login(TOKEN);
