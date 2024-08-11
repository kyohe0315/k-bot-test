const discord = require('discord.js');
const client = new discord.Client();
//const {Client,GatewayIntentBits} = require('discord.js');

const noticeChannelId = "954873746857005096";
const debugChannelId = "1022093564995436594";

const mainChannelId = '932595932464291872';
const voiceChannelId = '930348999645483111';

// 転送元のギルドIDとチャンネルID
const sourceGuildId = '851037687577706546';
const sourceChannelId = '1261217940112539714';

// 転送先のギルドID
const destinationGuildId = '930348999196676167';
const destinationChannelId = '932595932464291872';

const TOKEN = process.env.DISCORD_TOKEN;

client.on('message', async message => {
    if (message.channel.id === sourceChannelId) {
        const destinationChannel = client.channels.cache.get(destinationChannelId);
        if (!destinationChannel) {
            console.error('Destination channel not found');
            return;
        }

        try {
            const sentMessage = await destinationChannel.send(message.content);
            console.log(`メッセージが転送されました: ${sentMessage.content}`);
        } catch (error) {
            console.error('メッセージの転送に失敗しました:', error);
        }
    }
});

const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 30;


const checkInterval = 5 * 60 * 1000; // 5分ごとにチェック
let VC = null;

client.on('ready', () => {
    console.log(`Bot準備完了～`);
    client.user.setPresence({ activity: { name: '第２の人生' } });

    // 定期的なチェック　　　　
    setInterval(async () => {
        console.log('定期チェック中...');

        const mainChannel = client.channels.cache.get(mainChannelId);
        if (!mainChannel) {
            console.log('メインチャンネルが見つかりません');
            return;
        }

        // ボイスチャンネルの状態を取得
        const voiceChannel = client.channels.cache.get(voiceChannelId);
        if (!voiceChannel) {
            console.log('ボイスチャンネルが見つかりません');
            return;
        }

        // ボイスチャンネルに誰もいない場合
        if (voiceChannel.members.size === 0) {
            try {
                // メインチャンネルのメッセージ履歴を取得
                const messages = await mainChannel.messages.fetch({ limit: 100 });
                
                // "通話が開始されました！"メッセージを削除
                const startCallMessage = messages.find(msg => msg.content.includes("chatroom1にて通話が開始されました！"));
                if (startCallMessage) {
                    await startCallMessage.delete();
                    console.log('通話開始メッセージを削除しました');
                }
                
                // "お疲れ様でした！:relieved:"メッセージをフィルタリング
                const endCallMessages = messages.filter(msg => msg.content.includes("お疲れ様でした！:relieved:"));

                if (endCallMessages.size > 1) {
                    // 最新のメッセージを除いて削除
                    const messagesToDelete = endCallMessages.array().slice(1);
                    for (const message of messagesToDelete) {
                        await message.delete();
                        console.log('「お疲れ様でした！:relieved:」メッセージを削除しました');
                    }
                } else {
                    console.log('削除対象の「お疲れ様でした！:relieved:」メッセージがありません');
                }
            } catch (error) {
                console.error('メッセージの削除に失敗しました', error);
            }
        } else {
            console.log('ボイスチャンネルにメンバーがいます');
        }
    }, checkInterval);
});


client.on('voiceStateUpdate', async (oldState, newState) => {
    const voiceChannel = client.channels.cache.get(voiceChannelId);

    // 通話開始
    if (!oldState.channelID && newState.channelID === voiceChannelId) {
        if (voiceChannel && voiceChannel.members.size === 1) {
            const mainChannel = client.channels.cache.get(mainChannelId);
            if (mainChannel) {
                VC = await mainChannel.send("chatroom1にて通話が開始されました！\nhttps://discord.gg/PpugjHBgDB");
                console.log('通話開始メッセージを送信しました');
            } else {
                console.log('メインチャンネルが見つかりません');
            }
        }
    }

    // 通話終了
    if (oldState.channelID === voiceChannelId && voiceChannel && voiceChannel.members.size === 0) {
        if (VC) {
            try {
                await VC.delete();
                VC = null;
                console.log('通話開始メッセージを削除しました');
            } catch (error) {
                console.error('メッセージの削除に失敗しました', error);
            }
        }

        const mainChannel = client.channels.cache.get(mainChannelId);
        if (mainChannel) {
            await mainChannel.send(`お疲れ様でした！${':relieved:'}`);
            console.log('お疲れ様メッセージを送信しました');
        } else {
            console.log('メインチャンネルが見つかりません');
        }
    }
});



const reactionsMap = {
  '🥺': '🥺',
  '🧐': '🧐',
  '🤔': '🤔',
  '😭': '😭',
  '☺️': '☺️',
  '😍': '😍',
  '🤣': '🤣',
  '😌': '😌',
  '🥰': '🥰',
  '🤪': '🤪',
  '🤓': '🤓',
  '😪': '😪',
  '🙄': '🙄',
  '🤭': '🤭',
  '😏': '😏',
  '😢': '😢',
  '😤': '😤',
  '😠': '😠',
  '😡': '😡',
  '😚': '😚',
  '😙': '😙',
  '🥱': '🥱',
  '😴': '😴',
  '😅': '😅',
  '😎': '😎',
  'mint_': '✨',
};

client.on('message',async message =>{
  if (message.author.id === client.user.id || message.author.bot){
    return;
  }
  
  for (const emoji in reactionsMap) {
    if (message.content.includes(emoji)) {
      message.react(reactionsMap[emoji])
        .then(() => console.log(`リアクション:${reactionsMap[emoji]}`))
        .catch(console.error);
    }
  }

async function handleMatchingMessage(pattern, response, channelID, deleteDelay = 0) {
  try {
    if (message.content.match(pattern)) {
      await sendMsg(channelID, response);
      if (deleteDelay > 0) {
        const sentMessage = await message.channel.send(response);
        await sentMessage.delete({ timeout: deleteDelay });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error handling message:', error);
    return false;
  }
}

  
    const patterns = [
  { pattern: /K-bot|k-bot/,
    response: ["はいはいなんでしょうか？",
               "ちなみに「メンション+質問」の形式で質問すると最新AIが質問の答えを教えてくれるよ！"]},
      
      
//人の名前
  { pattern: /きょへ。?は/,
    response: ["ピカ知識レート2500　ピカチュウ窓主",
              "https://cdn.discordapp.com/attachments/1022093564995436594/1086669279233069076/kyohe.gif"]},
  { pattern: /きょへ。?さんは/,
    response: "きょへさんに何か用かい？メンションすると良いよ。彼は暇人だからね" },
  { pattern: /たっつんは/,
    response: ["⠀　　    ゆ\n⠀　  あ  で\n⠀ゆ  あ  た\n⠀で  ゆ  ま\n⠀た  で  ご\n⠀ま  た\n⠀ご  ま\n⠀　  ご",
              "https://zukan.pokemon.co.jp/zukan-api/up/images/index/596b399e3c5786fc8bf8856adf3f7cf5.png"] },
  { pattern: /へこにゃんは/,
    response: "百合好き76才　現役JK" },
  { pattern: /うみは/,
    response: "うみばよ!!" },
  { pattern: /たまっぴは/,
    response: "めんこい" },
  { pattern: /あっとるは/,
    response: "裏世界探索のプロ!!" },
  { pattern: /かえは/,
    response: "探求心、追求心が高くて沢山質問してくるので今後もっと成長する！" },
  { pattern: /Hiroは|Hiro母さんは/,
    response: "時々抜けてるけど今後に期待してます" },
  { pattern: /こんは|こんにゃくは|konnyakuは/,
    response: "トリリンガルな期待の新星！（？）笑" },
  { pattern: /ことは|小兎は/,
    response: "「ことは」で反応するのどうしたらいいと思う？" },
  { pattern: /こまは/,
    response: "美容室に行ってswitchを買う子（???????）" },
  { pattern: /しぃちゃんは/,
    response: "こんドロの紅一点" },
  { pattern: /ふゆさくらは/,
    response: "イケボぶっぱ厨" },
  { pattern: /くらげは|海月は/,
    response: "魑魅魍魎ちゃんがどうしたって？" },
  { pattern: /てんちゃんは/,
    response: "この鯖の声かわ代表" },
  { pattern: /まりむーは/,
    response: "弊社の癒し担当です" },
  { pattern: /こーやは/,
    response: "最近みませんね" },
  { pattern: /ワドやんは/,
    response: "僕の鯖のやばいヤツ" },
  { pattern: /ズーマーは|ズマは/,
    response: "ロリコンコンコンです" },
  { pattern: /ゆなしばは/,
    response: "あんまよく分かってないｗ" },
  { pattern: /ばんちょは/,
    response: "Sky知識豊富　キャリー上手い。こんばんちょ。" },
  // { pattern: /emicは|emic.は/,
  //   response: "面白いことが好きな子。元気で素直" },
  { pattern: /emicは|emic.は/,
    response: "相手に合わせて自分を変えるのが上手。苦手な人でもうまくやっていける社交性や愛嬌あり。少々お人好しで、頼まれたら断れなく、困っている人は放っておけない。人に尽くすのが好き。誰かが喜ぶなら、つい自分が損をしてでも奉仕してしまう。平和主義な一面もあり、衝突を避けるためなら自分が折れることも多いはず。また、とても積極的で何をするにもチャレンジ精神旺盛に取り組む。挑戦する度に知識や経験を吸収していき、必要な時に活かすことができる。しっかり者のようで案外抜けたところもある天然タイプです。" },
  { pattern: /ハゲは/,
    response: "たっつんだよ。" },
  { pattern: /タカ氏は/,
    response: "優しい　穏やか　優しい　頭がいい　優しい　上手い　安い　早い" },
  { pattern: /ルイは|るいは/,
    response: "オチリが好きな変態さん" },
  { pattern: /ロンは|ろんは/,
    response: "僕ッ子" },
  { pattern: /unknownは|unknöwnは/,
    response: "自分で打つな" },
  { pattern: /unkonowは/,
    response: "いやそれ誤字ってう〇こナウになってるやんｗ" },
  { pattern: /フィルは/,
    response: "よく知りません" },
  { pattern: /スニャイブ/,
    response: "スニャイブ じゃなくて スニャイ ヴ ですよ？ねえ？スニャイブ君？" },
  { pattern: /くみちょうは/,
    response: "頑張っててえらいといつも思ってます" },
  { pattern: /さーどちゃん|サードちゃん|さどちゃん|サドちゃん/,
    response: "https://cdn.discordapp.com/attachments/1022093564995436594/1217037624385212436/3rd_slow.mp4" },
  { pattern: /のわゆは/,
    response: "最近ログインしてるの見ないカモ" },
  { pattern: /ななしは/,
    response: "お風呂RTA世界記録保持者" },
  { pattern: /一縷は/,
    response: "なにわをてんねん！の生みの親…だったような気がしてる" },
        
      
//----------------------------------------------------------------------------------------------------      
//スマブラ系
  { pattern: /先行入力は/,
    response: "1.通常の先行入力：次の動作が可能になる９F前までに入力されたアクション\n2.押しっぱなし先行入力：次の動作が可能になる3F前までホールドされたアクション" },
  { pattern: /反転空後のコツは/,
    response: "兎にも角にも練習練習練習。" },
  { pattern: /空ダのコツは/,
    response: ["この動画がオススメ！",
               "https://youtu.be/4JAx3ZkWPfs"] },
        
      
//----------------------------------------------------------------------------------------------------      
//スマブラのピカチュウ関係
  { pattern: /ピカチュウは/,
    response: "かわいい" },
  { pattern: /ピカチュウの弱|ピカの弱/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuJab.gif",
              "判定：2~3F　全体：17F　不利：12~13F"]},
  { pattern: /ピカチュウの横強上|ピカの横強上/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuFTiltUp.gif",
               "判定：6~8F　全体：29F　不利：13F　（上シフト）"] },
  { pattern: /ピカチュウの横強下|ピカの横強下/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuFTiltDown.gif",
               "判定：6~8F　全体：29F　不利：15F　（下シフト）"] },
  { pattern: /ピカチュウの横強|ピカの横強/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuFTilt.gif",
               "判定：6~8F　全体：29F　不利：14F　（無シフト）"] },
  { pattern: /ピカチュウの上強|ピカの上強/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuUTilt.gif",
               "判定：7~13F　全体：26F　不利：13F(背面) / 7~10F（正面）"] },
  { pattern: /ピカチュウの下強|ピカの下強/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuDTilt.gif",
               "判定：7~8F　全体：18F　不利4F　←つまりガーキャン空中攻撃はまず不可能"] },
  { pattern: /ピカチュウのDA|ピカのDA|ピカチュウのダッシュアタック|ピカのダッシュアタック|ピカチュウのda|ピカのda/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuDashAttack.gif",
               "判定：6~8/9~12F　全体：35F　不利：11F"] },
  { pattern: /ピカチュウの横スマ|ピカの横スマ/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuFSmash.gif",
               "判定：15~16/17~19(SS)/20~29F　全体：53F　不利：27/24/~24F　全然飛ばない"] },
  { pattern: /ピカチュウの上スマ|ピカの上スマ/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuUSmash.gif",
               "判定：10~12/13~14/15~17F　全体：44F　不利：24F　ガーキャン掴みより早いヨ"] },
  { pattern: /ピカチュウの下スマ|ピカの下スマ/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuDSmash.gif",
               "判定：8~9/11~12/14~15/17~18/20~21/23F　全体：65F　不利：39F　弱すぎｗ"] },
  { pattern: /ピカチュウのダッシュ掴み|ピカのダッシュ掴み/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuDashGrab.gif",
               "判定：11~12F　全体：44F"] },
  { pattern: /ピカチュウの振り向き掴み|ピカの振り向き掴み|ピカチュウのふりむき掴み|ピカのふりむき掴み/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuPivotGrab.gif",
               "判定：12~13F　全体：39F"] },
  { pattern: /ピカチュウの掴み打撃|ピカの掴み打撃|ピカチュウの掴み攻撃|ピカの掴み攻撃/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuPummel.gif",
               "判定：1F　全体：5F"] },
  { pattern: /ピカチュウの掴み|ピカの掴み|ピカチュウのその場掴み|ピカのその場掴み/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuGrab.gif",
               "判定：7~8F　全体：36F"] },
  { pattern: /ピカチュウの空前|ピカの空前/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuFAir.gif",
               "判定：11~25(Rehit:3)/27F　全体：41F　着地隙：12F　不利：9~12F(降り)   or   12F(sj最速急降下無し)   or   7F(sj最速+24F目で急降下 or sjしてから8F目で出す)"] },
  { pattern: /ピカチュウの空N|ピカの空N/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuNAir.gif",
               "判定：3~6/9~12/15~18/21~22F　全体：38F　着地隙：9F　不利：7~12F(降り)   or   19F(sj最速)   or   13~18F(sj最速+急降下)"] },
  { pattern: /ピカチュウの空後|ピカの空後/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuBAir.gif",
               "https://ultimateframedata.com/hitboxes/pikachu/PikachuBAirLanding.gif",
               "判定：4~5/8~9/12~13/16~17/20~21/24~25/1~2(LF)F　全体：43F　着地隙：(LF)18F　不利：12F(降り)   or   16F(sj最速+急降下無し)   or   15F(sj最速+36F目に急降下)   or   12F(sj最速+最速急降下)"] },
  { pattern: /ピカチュウの空上|ピカの空上/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuUAir.gif",
               "判定：4~6/7~8F　全体：26F　着地隙：14F　不利：11~約20F(降り)   or   19F(sj最速)   or   14F(sjしてから22F目で出す：本当て)   or   11F(sjしてから22F目で出す：カス当て)"] },
  { pattern: /ピカチュウの空下|ピカの空下/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuDAir.gif",
               "https://ultimateframedata.com/hitboxes/pikachu/PikachuDAirLanding.gif",
               "判定：14~15/16~26/1~2F　全体：47F　着地隙：(LF)22F　不利：16F(降り)   or   23F(sj最速)     ※(sj最速+最速急降下によるLFまでの間の不利は7F)"] },
  { pattern: /ピカチュウのNB|ピカのNB|ピカチュウのnb|ピカのnb/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuThunderjoltAerial.gif",
               "判定18~52(最短)：F　全体：74(最短) / 21(衝突後)F 不利：2~15F"] },
  { pattern: /ピカチュウの横B|ピカの横B|ピカチュウの横b|ピカの横b/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuSkullBash.gif",
               "判定18~52(最短)：F　全体：74(最短) / 21(衝突後)F 不利：2~15F"] },
  { pattern: /ピカチュウの上B|ピカの上B|ピカチュウの上b|ピカの上b|ピカチュウの石火|ピカの石火|ピカチュウの電光|ピカの電光/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuQuickAttack.gif",
               "判定：15~19/29~33F　全体：(43)/(57)F　着地隙：24F　不利：21~34(１段目) / 20~24(２段目着地)F"] },
  { pattern: /ピカチュウの下B|ピカの下B|ピカチュウの下b|ピカの下b|ピカチュウの雷|ピカの雷|ピカチュウのかみなり|ピカのかみなり/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuThunder.gif",
               "https://ultimateframedata.com/hitboxes/pikachu/PikachuThunderHit.gif",
               "判定：13~15/21~23(稲妻) / 16~85/24~93(稲妻持続)F　全体：86(未接触) / 41(接触：地上) / 35(接触：空中)F　全身無敵：1~10(接触：地上) / 1~8(接触：空中)　不利：26(地上) / 20(空中)F"] },
  { pattern: /ピカチュウの前投げ|ピカの前投げ/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuFThrow.gif",
               "判定：11/15/19/23/30F　全体：45F"] },
  { pattern: /ピカチュウの下投げ|ピカの下投げ/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuDThrow.gif",
               "判定：29F　全体：51F"] },
  { pattern: /ピカチュウの上投げ|ピカの上投げ/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuUThrow.gif",
               "判定：14/16F　全体：35F"] },
  { pattern: /ピカチュウの後ろ投げ|ピカの後ろ投げ/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/PikachuBThrow.gif",
               "判定：26 全体：49F"] },
  { pattern: /ピカチュウの攻撃あがり|ピカの攻撃あがり|ピカチュウの攻撃上がり|ピカの攻撃上がり/,
    response: ["https://ultimateframedata.com/hitboxes/pikachu/pikachuGetupAttackU.gif",
               "https://ultimateframedata.com/hitboxes/pikachu/pikachuGetupAttackD.gif",
               "https://ultimateframedata.com/hitboxes/pikachu/pikachuTripAttack.gif",
               "https://ultimateframedata.com/hitboxes/pikachu/pikachuLedgeAttack.gif"] },
  { pattern: /ピカチュウの崖掴み|ピカの崖掴み/,
    response: ["https://ultimateframedata.com/ledgegrabs/Pikachu%20Ledgegrab%201.png",
               "https://ultimateframedata.com/ledgehangs/PikachuLedgehang.gif"] },
  { pattern: /ピカチュウのステータス|ピカのステータス|ピカチュウの体重|ピカの体重|ピカチュウの重さ|ピカの重さ/,
    response: "体重：79(79位)　歩行速度：1.302(13位)　走行速度：2.039(20位)　空中速度：0.957(66位)　走行移行前F 12(73位)　落下速度：1.55(53位)　急降下速度：2.48(51位)" },
      
//----------------------------------------------------------------------------------------------------      
//きょへ系のやつ
  { pattern: /きょへ。?の原罪マップ|きょへ。?原罪マップ|きょへ。?さんの原罪マップ/,
    response: ["https://youtu.be/Ew921TnFoaw?si=Ic79rsavyEZPTokJ",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/kyoheVer.jpg?v=1683557962502" ]},
  { pattern: /きょへ。?の性癖|きょへ。?さんの性癖/,
    response: "https://cdn.discordapp.com/attachments/932594717529604116/1022114482878685264/IMG_5258.png" },
  { pattern: /きょへ。?の年収|きょへ。?さんの年収/,
    response: "年収なんと2億!!おめでとうございます！ありがとうございます！" },
  { pattern: /きょへ。?の月収|きょへ。?さんの月収/,
    response: "月収なんと0.2万円!!" },
  { pattern: /おい！きょへ！/,
    response: "Yeah Ｉ'ｍ boring man..." },
  { pattern: /きょへさんは喋らないんですか|きょへさん喋らないんですか|きょへさんは喋らないの？|きょへさん喋らないの？/,
    response: "文字なんて打ってないでまずはあなたがミュート解除してみませんか？" },
  { pattern: /きょへにいこんにちは/,
    response: "くらげちゃんこんにちは！" },
  { pattern: /きょへにいこんばんは/,
    response: "くらげちゃんこんばんは！" },
  { pattern: /きょへにいやぁやぁ|きょへにいやあやあ/,
    response: "くらげちゃんやあやあ！ｗ" },
  { pattern: /きょへ。?さんの体操/,
    response: ["昔の跳馬の映像あったよ",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/160824_155613.mov?v=1702759298994"]},
  { pattern: /きょへ。?さんハートください|きょへ。?さんハート下さい/,
    response: `いいよ。後で送っておくね。<@${`530155393117192203`}>` },
  { pattern: /きょへ。?の身長|きょへ。?さんの身長/,
    response: "180㎝までもう少し" },
  { pattern: /きょへ。?の体重|きょへ。?さんの体重/,
    response: "大学の頃からずっと64kg" },
  { pattern: /きょへ。?の住所|きょへ。?さんの住所/,
    response: "ピカチュウ王国の神殿内"},
  { pattern: /きょへ。?の住所|きょへ。?さんの住所/,
    response: "ピカチュウ王国"},
  { pattern: /あっときょへ/,
    response: ["せめてメンションしろスニャ",
               `はぁ…。さっさと来い<@${`530155393117192203`}>`]},
      
//----------------------------------------------------------------------------------------------------      
//sky　羽
  { pattern: /孤島の羽|孤島の翼|孤島の光の翼|孤島の光の子|孤島の枚数/,
    response: "９枚\n→(メインエリア➄＋試練➃)" },
  { pattern: /草原の羽|草原の翼|草原の光の翼|草原の光の子|草原の枚数/,
    response: "２4枚\n→(蝶々の住処➂＋洞窟➁＋鳥の巣➁＋浮島➃＋神殿上部➁＋楽園➇＋草原連邦➂)" },
  { pattern: /雨林の羽|雨林の翼|雨林の光の翼|雨林の光の子|雨林の枚数/,
    response: "１９枚\n→(最初のエリア➁＋小川➃＋ツリーハウス➁＋神殿前➂＋神殿奥➀＋晴れ間エリア➁＋晴れ間地下エリア➃＋風の街道➀)" },
  { pattern: /峡谷の羽|峡谷の翼|峡谷の光の翼|峡谷の光の子|峡谷の枚数/,
    response: "１７枚\n→(スライダー左列➀＋スケートリンク➁＋天球儀➁＋空レース➁＋陸レース➀＋レース後半➀＋神殿前➀＋神殿内➀＋夢見➂＋劇場➀＋隠者➁)" },
  { pattern: /捨て地の羽|捨て地の翼|捨て地の光の翼|捨て地の光の子|捨て地の枚数/,
    response: "１８枚\n→(秘宝の座礁➁＋最初のエリア➁＋エビ１匹エリア➁＋エビ４匹エリア➃＋座礁船➂＋神殿前➁＋神殿内➀＋忘れられた方舟➁)" },
  { pattern: /書庫の羽|書庫の翼|書庫の光の翼|書庫の光の子|書庫の枚数/,
    response: "１5枚\n→(地下➁＋１階➀＋３階➀＋４階➁＋５階➀＋最上階➀＋保存庫➀＋星月夜の砂漠➂＋三日月オアシス➂)" },
  { pattern: /暴風域の羽|暴風域の光の翼|暴風域の光の子|暴風域の枚数|原罪の翼|原罪の光の翼|原罪の光の子|原罪の枚数/,
    response: "１０枚\n→(第一エリア➀＋第二エリア➈)" },
  { pattern: /光の翼の総数は|羽の総数は|光の羽の総数は|全エリアの羽|全エリアの羽|全エリアの翼|全エリアの光の翼|全エリアの光の子|全ての枚数|全ての翼|全ての光の翼|全ての光の子|全ての枚数|全翼|全光の翼|全光の子|全枚数|光の子の合計は/,
    response: "合計118枚\n→(孤島9 + 草原24 + 雨林19 + 峡谷17 + 捨て地18 + 書庫15 + 暴風域10 + 追想6)" },
      
//----------------------------------------------------------------------------------------------------      
//sky　火種
  { pattern: /火種のスプレッド|火種の量|火種一覧|火種表|光のかけら一覧|光のかけら表|光のカケラ表|光の欠片表|ひかりのかけら表/,
    response: "https://docs.google.com/spreadsheets/d/1Y5nDH81N3rpbvWhwSY_DgvTCA2mXAKeF2-RmorIN2WE/edit#gid=1739335542" },
  { pattern: /ホームの光のカケラ|ホームの光のかけら|ホームの火種/,
    response: "23個" },
  { pattern: /花鳥卿の光のかけら|花鳥卿の火種/,
    response: "23個" },
  { pattern: /孤島の光のかけら|孤島の火種/,
    response: "885個" },
  { pattern: /試練の光のかけら|試練の火種/,
    response: "水106 + 地115 + 風200 + 火200" },
  { pattern: /草原の光のかけら|草原の火種/,
    response: "691 + 151(亀の背中の闇花51 + ←を焼いた後に出る地上の貝100) + 水中の貝α(200前後)" },
  { pattern: /貝の光のかけら|貝の火種/,
    response: "【楽園夕日時の貝】\n　  大：30\n小(開)：30\n小(閉)：10～20" },
  { pattern: /雨林の光のかけら|雨林の火種/,
    response: "897(日,月,水,金)/898(火,木,土)個" },
  { pattern: /峡谷の光のかけら|峡谷の火種/,
    response: "882 + 劇場の花α + 隠者レース150+α" },
  { pattern: /捨て地の光のかけら|捨て地の火種/,
    response: "545(月,水,金)/546(火,木,土)/660個(日)　+ 貝ｘ" },
  { pattern: /書庫の光のかけら|書庫の火種/,
    response: "801個" },
  { pattern: /原罪の光のかけら|原罪の火種|暴風域の光のかけら|暴風域の火種/,
    response: "一個もないよ！(天空にはあるよ)" },
  { pattern: /天空の光のかけら|天空の火種/,
    response: "最大で225　（精霊/フレに触れると5。精霊最大30体、フレ最大15人" },
  { pattern: /劇場の演奏|劇場の楽譜|劇場の音楽|音楽堂の演奏|音楽堂の楽譜|音楽堂の音楽/,
    response: "上手く出来れば100個(結果次第では50)" },
  { pattern: /ウニ焼きの光のかけら|ウニ焼きの火種/,
    response: "250～350/10分　上限1011個" },
  { pattern: /ウナギの光のかけら|ウナギの火種/,
    response: "500/約12.5分 上限500個" },
  { pattern: /パンの光のかけら|パンの火種|パン焼きの光のかけら|パン焼きの火種|ぱんの光のかけら|ぱんの火種|ぱん焼きの光のかけら|ぱん焼きの火種/,
    response: "約600個/10分 上限1000個" },
      
//----------------------------------------------------------------------------------------------------      
//古いネタ・ネットネタ系
  { pattern: /今北産業/,
    response: "遅かったね～やっと来たか～。…1行以上喋る事ないよ。" },
  { pattern: /kwsk/,
    response: "俺も聞きたい。頼む" },
  { pattern: /wktk/,
    response:["+　　　+",
              "　 ∧＿∧ +　　+",
              "（0゜･∀･）  ﾜｸﾜｸ　+",
              "（0ﾟ つと)　+ ﾃｶﾃｶ",
              "と＿_）＿）　 +　+"]},
  { pattern: /ガクブル|gkbr/,
    response: "((( ；ﾟДﾟ)))" },
  { pattern: /もちつけ/,
    response: "うっす。\nhttps://cdn.discordapp.com/attachments/1022093564995436594/1217024733170761728/GreenKirby.gif" },
  { pattern: /リア充/,
    response: "爆はt.........応援してます♡" },
  { pattern: /くぁwせdrftgyふじこlp/,
    response: "令和世代に通じないってそれｗ" },
  { pattern: /ggrks/,
    response: "弊社はggrksサービスを応援しております。\nhttps://www.google.com/?gws_rd=ssl" },
  { pattern: /飯テロ/,
    response: "便乗します\nhttps://cdn.discordapp.com/attachments/1022093564995436594/1217024722395594822/Binzyou.jpg" },
  { pattern: /お邪魔します|おじゃまします/,
    response: "邪魔するなら帰って～" },
  { pattern: /はいよー/,
    response: "からの～？" },
  { pattern: /知らんけど/,
    response: "知らんよな。知らんけど。" },
  { pattern: /時すでにお寿司/,
    response: "ネタの賞味期限切れなのよｗ　…寿司だけにね!!!!" },
  { pattern: /かにかに/,
    response: "タラバガニ～かにかにズワイガニ～" },
  { pattern: /ヨシ！/,
    response: "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/genba-neko-yoshi.mov?v=1702753147187" },
  { pattern: /ハッピー|Happy/,
    response: "https://tenor.com/view/happy-happy-happy-happy-happy-cat-happy-dancing-cat-gif-716006509349864265" },

      
//----------------------------------------------------------------------------------------------------      
//特定の文言地雷系
  { pattern: "ｳｵｵｵｵｱｱｱｱ|ｱﾞｱﾞｱﾞｱﾞ",
    response: "うるさいぞズマ" },
  { pattern: /興奮した？/,
    response: "すみません、興奮して止まらなくなっちゃいました" },
  { pattern: /知らんがな|知らんて|知らないよ|知らないって/,
    response: "いやそれくらい簡単だろ…知っておけよ…。" },
  { pattern: /ｴﾍﾍ/,
    response: "(´>∀<｀)ゝ))ｴﾍﾍ" },
  { pattern: /誰がハゲだ|誰がハゲじゃ/,
    response: "鏡見てから出直してこいｗ" },
  { pattern: /カービィ?/,
    response: "https://cdn.discordapp.com/attachments/932595932464291872/1088570386255454368/kabiiiiiiiii.gif" },
  { pattern: /おい！/,
    response: "なに！！" },
  { pattern: /カードちょうだい|カードくれ/,
    response: "まずは30万振り込んでね" },
  { pattern: /振り込んだ/,
    response: "証拠はどこよ証拠は！見せなさい！" },
  { pattern: /証拠だ|これが証拠|はい証拠/,
    response: "は？PDFで送れ" },
  { pattern: /shovel blueは|shovelblueは/,
    response: "頻繁に重たくなるからスニャイヴォットを使おう！" },
  { pattern: /shovel redは|shovelredは/,
    response: "赤い。" },
  { pattern: /shovel greenは|shovelgreenは/,
    response: "そもそも呼びかけに反応しない時があるｗ" },
  { pattern: /hey k-bot|ヘイk-bot|へいk-bot|heyケーボット|ヘイケーボット|へいケーボット|heyけーぼっと|ヘイけーぼっと|へいけーぼっと/,
    response: "すみません。よくSiriません。" },
  { pattern: /OK k-bot|オッケーk-bot|おっけーk-bot|おっけーケーボット|オッケーケーボット|オッケーボット|おっけーけーぼっと|オッケーけーぼっと|おっけーぼっと/,
    response: "すみませ…黙れ小僧！" },
  { pattern: /働けー?bot|働k-bot|働けーぼっと|働けーボット|働ケーボット/,
    response: "すみません、ちょっとだけーボーットしてました。" },
  { pattern: /捨て地の?キャンマラ/,
    response: "捨て地で…キャンマラ…？？？そんなものは無いよ…。" },
  { pattern: /充電が３％|充電が3％|充電が３%|充電が3%|充電３％|充電3％|充電３%|充電3%/,
    response: "まだまだ充電せんでも余裕だね。焦らなくていいよ。" },
  { pattern: /充電が２％|充電が2％|充電が２%|充電が2%|充電２％|充電2％|充電２%|充電2%/,
    response: "まだ充電せんでも大丈夫よ。焦らず焦らず。。" },
  { pattern: /充電が１％|充電が1％|充電が1%|充電１％|充電1％|充電1%/,
    response: "今すぐ充電しろ or 諦めろ" },
  { pattern: /( *ˊᵕˋ)ɢᵒᵒᵈ ɴⁱᵍᑋᐪ/,
    response: "しぃちゃんさんおやすみ～" },
  { pattern: /ｹﾗｹﾗ/,
    response: "(´∀｀*)ｹﾗｹﾗ" },
  { pattern: /ｿｫｰｯ/,
    response: "知る人ぞ知るk-botの黒歴史の文字列『ｿｫｰｯ』" },
  { pattern: /HA☆HA☆HA☆/,
    response: "ばんちょさん笑ってるｗ" },
  { pattern: /おやうみなさい/,
    response: "おやうみじゃねーよ" },
  { pattern: /おやうみやさい/,
    response: "うるさいぞ。ティッシュ。" },
  { pattern: /スプラやりたい/,
    response: "思い立ったが吉日よ　https://store-jp.nintendo.com/list/software/70010000046394.html" },
  { pattern: /完璧です/,
    response: "ありがとうございます！何が？" },
  { pattern: /たっつんの頭/,
    response: "割ったら中から黄身が出てきますから気を付けてくださいね…。" },
  { pattern: /まるみや|マルミヤ|丸美屋/,
    response: ["チャッチャッチャ　丸美屋　の　まぜこみわかめ～♪",
               "https://www.marumiya.co.jp/"] },
  { pattern: /麻婆豆腐|マーボー豆腐/,
    response: "https://i.ytimg.com/vi/Myqnk5iOb30/mqdefault.jpg" },
  { pattern: /沖縄は/,
    response: "沖縄といえば…なにが有名？" },
  { pattern: /サーターアンダギー/,
    response: "あー知ってる知ってる、おにぎりみたいなやつでしょ？" },
  { pattern: /シーサー/,
    response: "確かに、シーサーとは沖縄のハチ公！ってよく聞くよねえ～" },
  { pattern: /沖縄そば/,
    response: "地名+そばって言えば原産ぽっくなるのずるくない？ 北海道牛乳も名産にしていい？" },
  { pattern: /ちんすこう/,
    response: "結局ちんすこうって何？魚の名前？" },
  { pattern: /琉球王国/,
    response: "ズマ氏の出身国じゃないですかwww" },
  { pattern: /たっつんハゲ|たっつんはげ/,
    response: "https://discord.com/channels/930348999196676167/932595932464291872/1064546142941102133" },
  { pattern: /なるほど～/,
    response: "あ～この言い方はスニャちゃかてんちゃんさんだけど、統計学的にきっとスニャちゃかな？" },
  { pattern: /ピカチュウ使いは/,
    response: "惹かれ合う。ドドン。" },
  { pattern: /最近の若いのは/,
    response: "あんたも若いだろ" },
  { pattern: /タマゴは|たまごは|🥚は/,
    response: "たっつん" },
  { pattern: /ロリコンです/,
    response: "いいえ、あなたはロリコンコンコンです。" },
  { pattern: /スカイ窓主|Sky窓主|sky窓主/,
    response: "いやピカチュウ窓主ですけど…。" },
  { pattern: /おはようございます☀/,
    response: "seiさんおはようございます☀" },
  { pattern: /死んだ|死にました/,
    response: "https://tenor.com/view/dancing-coffin-dancing-pallbearers-funeral-dance-gif-16837090" },
  { pattern: /なるほも/,
    response: "seiさんはホモ？OKOK" },
  { pattern: /あたりまえ体操/,
    response: "ネタ古くない？ｗ" },
  { pattern: /寝たくない/,
    response: "駄々こねずに寝ろ！！" },
  { pattern: /カツオ/,
    response: "https://i.pinimg.com/236x/29/07/30/290730c4f2a2a2b59bea0118b63c7a7c.jpg" },
  { pattern: /寝るのだ/,
    response: "https://i.pinimg.com/originals/6c/83/b2/6c83b24dc9279cd33e59957af32569a1.jpg" },
  { pattern: /Www/,
    response: "WwWwWwWwWwWwWwWw　This is grass" },
  { pattern: /最古のツイート/,
    response: "https://twitter.com/gmexNK/status/408449010718879744?t=dQPiCpMRMFVLR8AYhOTiNQ&s=19" },
  { pattern: /想像の斜め上/,
    response: "『想像の斜め上』…とは、興味深い表現をするね。ただ、それだと曖昧だからその程度や範囲はどのようなものなのか、少し詳しく教えてほしいなあ？想像の座標に対してどの方向に対して斜め上を言っているんでしょうか。そもそも向いている座標によって斜めって変わりますし、そもそも斜めの定義って人それぞれだと思いますが基準に対して何度ズレたら斜めと呼びますか？いやそもそも想像って正面とか基準とかそんな概念があるんですかね？そこのところ今一度擦り合わせをしたうえで……" },
  { pattern: /シュミレーション/,
    response: "シュミレーションじゃなくてシミュレーションだよ" },
  { pattern: /コミニュケーション/,
    response: "コミニュケーションじゃなくてコミュニケーションだよ！コミュニはコミュニだからコミュニはコミニュじゃないよ！コミュニがコミニュと間違えないようにコミュニコミニュコミュニコミニュと復唱して覚えよう！！" },
  { pattern: /くそかわいい|クソかわいい|くそ可愛い|クソ可愛い/,
    response: "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/389ab7d086cefbef.mp4?v=1702825472889" },

      
//----------------------------------------------------------------------------------------------------      
//オススメの〇〇系
  { pattern: /オ?ススメのキャンマラルート|オ?ススメのキャンマラ/,
    response: "このルートがオススメ！　\nhttps://youtu.be/FA6heQJNHEU?si=5-Ndg5qkGZKvCUIW" },
  { pattern: /お?ススメのYouTuber?|オ?ススメのチャンネル|オ?ススメの動画|おすすめの動画|おすすめのYouTuber?|おすすめのチャンネル/,
    response: "天才のチャンネルを紹介\nhttps://www.youtube.com/channel/UCf3RsOFeg5MdGv_UJLZE5iw" },
  { pattern: /オ?ススメのbot|お?ススメのBot|オ?ススメのボット|お?ススメのボット/,
    response: "そりゃあ…天才が生み出した天才のBot...。その名もK-bot!!!"},
  { pattern: /オ?ススメのホラゲー|お?すすめのホラゲー/,
    response: "これなんかおススメよ！　https://kusoi.site/2020/06/18/pien-g01/" },
  { pattern: /オ?ススメの服窓主|お?すすめの服窓主|オ?ススメの副窓主|お?すすめの副窓主/,
    response: "https://x.com/Pikashou0414" },
  { pattern: /オ?ススメの窓主|オ?ススメのまどぬし|お?すすめの窓主|お?すすめのまどぬし/,
    response: ["聞くまでも無いやろがい！！！",
               "おれ。\nhttps://www.youtube.com/channel/UCIcsBVzRT-Hvz6bdM13rvfQ"]},
  { pattern: /お?ススメの?羽マラ|お?ススメの?羽集め|羽マラの?やり方|羽マラの?解説|羽マラの?動画|羽マラの?ルート|羽マラの?ショトカ/,
    response: "世界的な天才が羽マラの動画アップしてたよ\nhttps://youtu.be/iD1P9bAW8WY" },
  { pattern: /オ?ススメのお菓子|オ?ススメのおかし|おすすめのお菓子|おすすめのおかし/,
    response: "カルビー 堅あげポテト BIG うすしお味 150g×12袋　Amazonリンクも貼っとくよ♡ \nhttps://x.gd/zmiKo" },
  { pattern: /オ?ススメの曲は|おすすめの曲は/,
    response: "共感できる系の曲ならコレ　\nhttps://youtu.be/BhQDqdCHZOI" },
  { pattern: /オ?ススメの飲み物|おすすめの飲み物|オ?ススメのジュース|おすすめのジュース/,
    response: "共感できる系の曲ならコレ　\nhttps://youtu.be/BhQDqdCHZOI" },
  { pattern: /オ?ススメの紙コップ|おすすめの紙コップ/,
    response: ["そんな事聞く人あなたくらいですよ？",
               "https://askul.c.yimg.jp/img/product/3L1/2308828_3L1.jpg"]},
  { pattern: /オ?ススメのショトカ|おすすめのショトカ/,
    response: "個人的には試練のおんロケショトカが期待値高くてオススメ。\nあとは、無難に書庫のおんロケショトカ" },
  { pattern: /オ?ススメのケープ|おすすめのケープ/,
    response: "あなたなら\n　どんなケープも\n　　似合うわよ\n\n季語無し" },
  { pattern: /オ?ススメの食べ物|オ?ススメのたべもの|おすすめのたべもの|おすすめの食べ物/,
    response: ["☆ 海・鮮・丼 ☆",
               "https://omocoro.jp/assets/uploads/2019/04/1554466114d9ein.jpg"]},
  { pattern: /オ?ススメのパソコン|おすすめのパソコン|オ?ススメのPC|おすすめのPC/,
    response:"M2 or M3 チップ搭載してるMacBookPro、メモリは8GB以上。WindowsならCPUがi7、メモリは8GB以上。でもあなたのやりたい事次第。"},
      
      
//----------------------------------------------------------------------------------------------------      
//sky系
      
  { pattern: /今日の?デイリー|今日の?シーズンキャンドル|今日の?大キャン/,
    response: ["黒沢さんのツイートはこちら\n👇　　　👇　　　👇\nhttps://x.com/sky_box0324?s=20\n",
               "9bitの情報はこちら\n👇　　　👇　　　👇\nhttps://9-bit.jp/skygold/6593"]},
  { pattern: /原罪マップ/,
    response: ["これを見な",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/kyoheVer.jpg?v=1683557962502"]},
  { pattern: /９BIT|９bit|9bit|9BIT|9Bit|9-bit/,
    response: "https://9-bit.jp/skygold" },
  { pattern: /てすてすてすと/,
    response: "https://cdn.discordapp.com/attachments/954865403006451752/1216850076878766283/SKY_20240309_234527_.jpg" },
  { pattern: /skyは|Skyは/,
    response: "skyについてだね！HPのリンクを貼っておくから見てみるといいよ!!\nhttps://www.skygroup.jp/" },
  { pattern: /風の試練の?ショトカ|風の試練の?裏入り?口|風の試練の?裏入場/,
    response: "👇過去の栄光はコチラ👇\nhttps://youtu.be/XTi26--jdgc?si=ZFMNwtO3Co-QG6EI" },
  { pattern: /水の試練の?ショトカ|水の試練の?裏入り?口|水の試練の?裏入場/,
    response: "👇過去の栄光はコチラ👇\nhttps://youtu.be/IUUbNGUlI3A" },
  { pattern: /地の試練の?ショトカ|地の試練の?裏入り?口|地の試練の?裏入場/,
    response: "👇過去の栄光はコチラ👇\nhttps://youtu.be/sSxkP6s-zAU" },
  { pattern: /火の試練のショトカ1|火の試練のショトカ１/,
    response: "https://youtu.be/v3pO7sbAvXM?si=ym9Az4Jtz8kVkhS9" },
  { pattern: /火の試練のショトカ2|火の試練のショトカ２/,
    response: "https://youtu.be/4JynriDGxYc?si=hhFeWS5VK3i6TPQq" },
  { pattern: /火の試練のショトカ3|火の試練のショトカ３/,
    response: "https://youtu.be/4JynriDGxYc?si=hhFeWS5VK3i6TPQq" },
  { pattern: /火の試練のショトカ4|火の試練のショトカ４|火の試練の裏入り口|火の試練の裏入場/,
    response: "https://youtu.be/4JynriDGxYc?si=hhFeWS5VK3i6TPQq" },
  { pattern: /火の試練のショトカ5|火の試練のショトカ５/,
    response: "https://youtu.be/pXKG1NfmHL4?si=Z7uAfEbRfT40aFko" },
  { pattern: /火の試練の?ショトカ/,
    response: "火の試練のショトカ1～5のどれがいい？\n\n1. 王道ルート\n2. おんロケルート\n3. 一本道ルート\n4. 裏入り口ルート（修正済）\n5. ソロ安定ルート\n\n火の試練のショトカ（数字）　の形式で入力してね\n例→「火の試練のショトカ1」" },
  { pattern: /トビウオの?解説|トビウオの?動画|トビウオの?やり方|とびうおの?解説|とびうおの?動画|とびうおの??やり方/,
    response: "https://youtu.be/E9eEicAsZh4?si=jOqMpQn2khK7my93" },
  { pattern: /めんどくさい時の?キャンマラ|めんどい時の?キャンマラ|めんどい時用キャンマラ|めんどくさい時用の?キャンマラ/,
    response: "https://youtu.be/VDJFrFNd-BE?si=_7u0O50uUG8qZHTJ\nhttps://docs.google.com/spreadsheets/d/12lRf_nvsWpwEEGgJAMew3pd16w8yf-Fco7WuSrbGa2s/edit?usp=sharing" },
  { pattern: /キャンマラめんどくさい|キャンマラめんどい|18本キャンマラ/,
    response: "そんなあなたにはこのキャンマラがオススメ！ \nhttps://youtu.be/VDJFrFNd-BE?si=_7u0O50uUG8qZHTJ" },
  { pattern: /変態キャンマラ|へんたいキャンマラ/,
    response: "ふ～っふっふ…！！\nhttps://youtu.be/746mahW8Ivs?si=vsGE5WrvyRLIwqlB" },
  { pattern: /ソロ19本キャンマラ|19本キャンマラ/,
    response: "ソロ用19本キャンマラルートはこちら！　\n(サブありが見たければ「サブあり19本」って入れてね！)　\nhttps://youtu.be/FA6heQJNHEU?si=R-bdyLMLPH7CH6g_" },
  { pattern: /サブあり19本キャンマラ|サブありキャンマラ|サブキャンマラ|サブ19本キャンマラ|サブあり19本/,
    response: "https://youtu.be/FulRMyT8ubw?si=BBmDAfc0hyfQYFjn" },
  { pattern: /灰キャンRTA|灰キャン世界最速|最速灰キャン|灰キャン最速/,
    response: "ふ～っふっふ…！！\nhttps://youtu.be/Ba4QDCN0S-4?si=IkF47khEy-I2skA4" },
  { pattern: /効率よくキャンマラする方法|効率良くキャンマラする方法|効率の?いいキャンマラ|効率の?良いキャンマラ/,
    response: "https://youtu.be/nUo5MxjTq1Q?si=NktbPxbMQYgmgIh7" },
  { pattern: /原罪のルート|原罪のショトカ|原罪の動画/,
    response: "https://youtu.be/Ew921TnFoaw?si=Ic79rsavyEZPTokJ" },
  { pattern: /ペンギンの?取?り方|ペンギンの?とり方|ペンギンの?取?かた|ペンギンの?解説|ペンギンの?動画/,
    response: "これで取れるよ\nhttps://youtu.be/cxksGI_H3SI" },
  { pattern: /映画暗黒龍|暗黒龍の?映画|暗黒龍の?動画/,
    response: "ふっふっふ……。\nhttps://youtu.be/r9S3GdQQlxE" },
  { pattern: /映画雀|雀の?映画|雀の?動画|映画すずめ|すずめの?映画|すずめの?動画|映画スズメ|スズメの?映画|スズメの?動画/,
    response: "ふっふっふ……。\nhttps://youtu.be/fZamVz7LZU0" },
  { pattern: /闇のかけらの?場所|闇のカケラの?場所|闇の欠片の?場所|シャードの?場所|シャードどこ？|シャードどの?エリア|今日の?シャード|今日の?闇の/,
    response: "今日のシャードはここ！　\nhttps://9-bit.jp/skygold/23767/" },
  { pattern: /垂直飛?びの?やり方|垂直飛?びの?解説|垂直飛?びの?動画/,
    response:["👇　コントローラー勢はこちら　👇\nhttps://youtu.be/YrT7Dy3OGMo?si=fZ5dI1GLX4cReTia",
              ".\n\n👇　スマホ勢はこちら　👇　\nhttps://youtu.be/vy4rG2rZKcM?si=1OvSyO4wD78HPeDB"]},
  { pattern: /デイリーライトの?使い方|デイリーライトの?解説|デイリーライトの?動画/,
    response: "https://youtu.be/mm-KlYLtb-8?si=cLwUFJNwd7WyZmFI" },
  { pattern: /火種必要数|光のカケラ必要数|光のかけら必要数|火種表|光のかけら表|光のかけら表|デイリーライトの?表/,
    response: "https://cdn.discordapp.com/attachments/1002997996855754943/1187964375798128780/e5f8620dd439bd75.png" },
  { pattern: /ターボジャンプ/,
    response: "これやね。https://twitter.com/2hily_/status/1762483268761313679?t=-4miRA_kuN8OhJ3biHloNg&s=19" },
  { pattern: /15本キャンマラ|おぷるさんコラボ|コラボ動画/,
    response: "https://youtu.be/epPPfpmS99M" },
  { pattern: /楽園の?ルート|楽園の?キャンマラル|楽園の動画/,
    response: "https://youtu.be/rNgUpMXk2AQ" },
  { pattern: /レコキャンの?使い方|レコキャンの?動画|レコキャンの?テク|レコキャンの?時短テク|シェアメモの?使い方|シェアメモの?動画|シェアメモの?テク|シェアメモの?時短テク/,
    response: "https://youtu.be/rNgUpMXk2AQ" },
  { pattern: /孤島の?精霊一覧|孤島の?全ての精霊|孤島の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Koto-all.png?v=1711574878049/"]},
  { pattern: /草原の?精霊一覧|草原の?全ての精霊|草原の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Sogen-all.png?v=1711574877247"]},
  { pattern: /雨林の?精霊一覧|雨林の?全ての精霊|雨林の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Urin-all.png?v=1711574876227"]},
  { pattern: /峡谷の?精霊一覧|峡谷の?全ての精霊|峡谷の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Kyokoku-all.png?v=1711574875272"]},
  { pattern: /捨て?地の?精霊一覧|捨て?地の?全ての精霊|捨て?地の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Suteti-all.png?v=1711574874537"]},
  { pattern: /書庫の?精霊一覧|書庫の?全ての精霊|書庫の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Syoko-all.png?v=1711574878830"]},
      
      

/*      
//----------------------------------------------------------------------------------------------------     
//精霊の場所（各エリア一覧など）
  { pattern: /精霊の?場所|精霊さんの?場所|精霊どこ|精霊さんどこ/,
    response: "知りたい精霊さんの場所は？　\n例→「先導する星読み」「ギタパパ」「指さしエモ」\nもしくは「孤島の精霊一覧」のようなフォーマットで入力してね" },
  { pattern: /孤島の?精霊一覧|孤島の?全ての精霊|孤島の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Koto-all.png?v=1711574878049/"]},
  { pattern: /草原の?精霊一覧|草原の?全ての精霊|草原の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Sogen-all.png?v=1711574877247"]},
  { pattern: /雨林の?精霊一覧|雨林の?全ての精霊|雨林の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Urin-all.png?v=1711574876227"]},
  { pattern: /峡谷の?精霊一覧|峡谷の?全ての精霊|峡谷の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Kyokoku-all.png?v=1711574875272"]},
  { pattern: /捨て?地の?精霊一覧|捨て?地の?全ての精霊|捨て?地の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Suteti-all.png?v=1711574874537"]},
  { pattern: /書庫の?精霊一覧|書庫の?全ての精霊|書庫の?全精霊/,
    response: ["こちらをご覧ください。（9-bit様より引用）",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/Syoko-all.png?v=1711574878830"]},
      
//----------------------------------------------------------------------------------------------------      
//孤島（恒常）
  { pattern: /先導する星読み|先導精霊|先導エモ|手招き精霊|手招きエモ/,
    response: ["【先導する星読み】\n孤島のジャンプ台？の下",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/sendo?v=1711574404738",
               "https://9-bit.jp/skygold/8494/"]},
  { pattern: /指差すキャンドル職人|指さし精霊|指さしエモ/,
    response: ["【指差すキャンドル職人】\n孤島の左奥、チュートリアル洞窟の中",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/yubisasu.image.png?v=1711574321807",
               "https://9-bit.jp/skygold/8510/"]},
  { pattern: /固辞する航行者|いやいや精霊|いやいやエモ|バツ精霊|バツエモ|断り?精霊|断り?エモ|拒否する精霊|拒否するエモ/,
    response: ["【固辞する航行者】\n孤島の神殿左下の洞窟(孤島の精霊を2人以上解放している必要あり)",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/iyaiya?v=1711574482180",
               "https://9-bit.jp/skygold/8517/"]},
//孤島（再訪）
  { pattern: /おませな漂流者|おませポーズ|おませな?ポーズ|おませ精霊/,
    response: ["【おませな漂流者】\n孤島右奥、光の子がいる洞窟や、なだらかな砂丘を越えた先",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/omase?v=1711628336238",
               "https://9-bit.jp/skygold/5093/"]},
  { pattern: /おんぶする光探究者|おんぶの?精霊|おんぶの?エモ/,
    response: ["【おんぶする光探究者】\n孤島左の洞窟入口（雨林の精霊を3人以上解放している必要あり）",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222883634441359501/eventitem01-125x125.jpg",
               "https://9-bit.jp/skygold/5130/"]},
  { pattern: /音と舞う幼子|リズムに乗る精霊|リズムに乗るエモ|ブギーダンス/,
    response: ["【音と舞う幼子】\n孤島右奥の蝶々の丘の2人扉入口にいる。（因みにこれブギーダンスって言うらしい）",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222884964899618848/seirei_omoi_01.png",
               "https://9-bit.jp/skygold/5179/"]},
  { pattern: /一座の進行役|ようこそエモ|ようこその?精霊|行ってらっしゃいエモ|いってらっしゃい精霊/,
    response: ["【一座の進行役】\n孤島の中央付近にある大きな三角形の岩の根本、裏側にいる。",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222885564823506997/emote149-150x150.jpg",
               "https://9-bit.jp/skygold/6037/"]},
  { pattern: /水の預言者|深呼吸の?エモ|深呼吸の?精霊|水の精霊|水の?試練の?精霊|息を吸うエモ|息を吸う精霊/,
    response: ["【水の預言者】\n孤島の奥のエリア「預言者の石窟」の一番左の洞窟内",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222886868052349018/emote_y03.jpg",
               "https://9-bit.jp/skygold/9463/"]},
  { pattern: /地の預言者|ほこり払いの?エモ|ほこり払いの?精霊|地の?試練の?精霊|肩を払うエモ|ごみを払うエモ|ゴミを払うエモ/,
    response: ["【地の預言者】\n孤島の奥のエリア「預言者の石窟」の左から２番目の洞窟内",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222887657768484994/emote_y01.jpg",
               "https://9-bit.jp/skygold/9500/"]},
  { pattern: /風の預言者|バランスの?エモ|バランスの?精霊|風の?試練の?精霊|倒立エモ|逆立ちエモ|さかだちエモ/,
    response: ["【風の預言者】\n孤島の奥のエリア「預言者の石窟」の右から２番目の洞窟内",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222888109868322978/emote_y04.jpg",
               "https://9-bit.jp/skygold/9498/"]},
  { pattern: /火の預言者|胸をたたくエモ|胸をたたく精霊|火の?試練の?精霊|むねをたたくエモ|むねをたたく精霊|胸を叩くエモ|胸を叩く精霊|火鉢の精霊|袴の精霊|はかまの精霊/,
    response: ["【火の預言者】\n孤島の奥のエリア「預言者の石窟」の一番右の洞窟内",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222889304305569812/emote_y02.jpg",
               "https://9-bit.jp/skygold/9494/"]},
  { pattern: /活発すぎる頑張り屋|鉄棒の?エモ|鉄棒の?精霊|懸垂エモ|けんすいエモ/,
    response: ["【活発すぎる頑張り屋】\n孤島→ならいの大岩内。左奥の指さしエモ洞窟の天井",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222893004210176091/passage48.jpg",
               "https://9-bit.jp/skygold/30740/"]},
  { pattern: /物憂げなとぼとぼ歩き|とぼとぼの?エモ|とぼとぼの?精霊|テンション低い歩き/,
    response: ["【物憂げなとぼとぼ歩き】\n孤島→ならいの大岩内。中央奥、ジャンプ台の右",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222893003967037470/passage47.jpg",
               "https://9-bit.jp/skygold/30739/"]},
  { pattern: /ぐるぐる回るいたずらっ子|ぐるぐるエモ|グルグルエモ|くるくるエモ|クルクルエモ|ころころエモ|コロコロエモ/,
    response: ["【ぐるぐる回るいたずらっ子】\n孤島→ならいの大岩内。右奥、蝶々の丘のふもと、低い位置雲の近く",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222893003715383449/passage46.jpg",
               "https://9-bit.jp/skygold/30738/"]},
  { pattern: /風変わりなひとり好き|リフティングの?エモ|リフティングの?エモ|蹴鞠エモ|けまりエモ/,
    response: ["【風変わりなひとり好き】\n孤島→ならいの大岩内。右奥、蝶々の丘のふもと、低い位置雲の近く",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222893003480367165/passage45.jpg",
               "https://9-bit.jp/skygold/30737/"]},
      
//----------------------------------------------------------------------------------------------------      
//草原（恒常）
  { pattern: /蝶々使い|蝶々の?エモ|ちょうちょの?エモ|オレンジケープの?精霊/,
    response: ["【蝶々使い】\n草原の最初のエリア、中央奥の丸い大岩の中",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222914226197233711/emote22_07.jpg",
               "https://9-bit.jp/skygold/8526/"]},
  { pattern: /鳥の語り部|鳥の声の?精霊|きょへ。?さんの声の精霊|アスパラの?精霊|たまねぎの?精霊|アスパラヘアーの?精霊|たまねぎヘアーの?精霊/,
    response: ["【鳥の語り部】\n草原の鳥の巣エリア。右上高い位置の島、塔のふもと",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222914226423857162/emote22_83.jpg",
               "https://9-bit.jp/skygold/8607/"]},
  { pattern: /手を振る鐘の造り手|手を振るエモ|手をふるエモ|手を振る精霊|手をふる精霊|バイバイの?エモ|ばいばいの?エモ/,
    response: ["【手を振る鐘の造り手】\n草原、塔が３つあるエリア(神殿前)の中央の島、やや左の通路の近く",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222914226633314364/emote22_10.jpg",
               "https://9-bit.jp/skygold/8573/"]},
  { pattern: /寝不足の造船師|寝不足の?エモ|寝不足の?精霊|あくびの?エモ|あくびしてい?るエモ|眠た?いエモ|眠た?い精霊/,
    response: ["【寝不足の造船師】\n草原、塔が３つあるエリア(神殿前)の中央の島、２人扉の中",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222914226847350895/emote22_12.jpg",
               "https://9-bit.jp/skygold/8587/"]},
  { pattern: /笑う光採取者|爆笑の?エモ|爆笑するエモ|爆笑の?精霊|爆笑する精霊|ハープの?精霊|ハープの?エモ/,
    response: ["【笑う光採取者】\n草原、塔が３つあるエリア(神殿前)の右の島の中。２人扉の手前",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222914227300208650/emote22_11.jpg",
               "https://9-bit.jp/skygold/8597/"]},
  { pattern: /式典の礼拝者|掲げる?エモ|キャンドルの?エモ|キャンドルを上げるエモ/,
    response: ["【式典の礼拝者】\n草原、塔が３つあるエリア(神殿前)の右の島の中からオレオエリアへ行き、ギミックを起動させて全てのキャンドルに火を付けたら解放できる。",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222914227568771174/emote22_14.jpg",
               "https://9-bit.jp/skygold/8610/"]},
  { pattern: /疲弊した荷積み人|疲れたエモ|疲れた精霊|疲弊エモ|疲弊精霊|拭うエモ|ぬぐうエモ/,
    response: ["【疲弊した荷積み人】\n草原、左側洞窟エリアの中。星の封印が施された横穴の先にいる",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1222914227787006002/emote22_13.jpg",
               "https://9-bit.jp/skygold/8613/"]},
//草原（再訪）
  { pattern: /屈伸する導師|太陽礼拝エモ|もこもこケープ精霊|両手を?あげるエモ/,
    response: ["【屈伸する導師】\n草原、左側洞窟エリアの中。洞窟に入って左側の隅っこに暮らしてる",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1225233153174802482/emote22_61.jpg",
               "https://9-bit.jp/skygold/5098/"]},
  { pattern: /ダブルタッチの光採取者|ダブルタッチの?エモ|ダブルタッチの?精霊|ハイタッチの?エモ|ハイタッチの?精霊|フルートの?精霊|笠の精霊|フルートが貰える精霊|笠が貰える精霊|フルートが取?れる精霊|笠が取?れる精霊/,
    response: ["【ダブルタッチの光採取者】\n草原の鳥の巣エリア。正面にある一番大きな浮島、奥に建つ小さな塔の裏側に回るといる。",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1225233153401032835/friendt11.jpg",
               "https://9-bit.jp/skygold/5141/"]},
  { pattern: /紙ふぶき好きのいとこ|クラッカーの?エモ|クラッカーの?精霊|紙吹雪の?エモ|紙吹雪の?精霊|紙ふぶきの?エモ|紙ふぶきの?精霊|おめでとうエモ|赤いリボンの?精霊/,
    response: ["【紙ふぶき好きのいとこ】\n草原の最初のエリア、中央奥の丸い大岩の上、沢山の光を集める精霊",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1225233153678118912/emote22_38.jpg",
               "https://9-bit.jp/skygold/5170/"]},
  { pattern: /祝祭の旋舞家|ダンスの?エモ|旗が貰える精霊|旗がもらえる精霊|旗が取れる精霊|旗がとれる精霊|土エモ|パイナップルヘア/,
    response: ["【祝祭の旋舞家】\n草原の鳥の巣エリア。エリアチェンジしてすぐ一番手前の浮島の下にいる。",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1225233153937903786/emote22_40.jpg",
               "https://9-bit.jp/skygold/6045/"]},
  { pattern: /引っ込み思案な読書家/,
    response: ["【引っ込み思案な読書家】\n草原の楽園のエリア、手前の浮島の側面にいる。",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1225233154181304320/emote22_99.jpg",
               "https://9-bit.jp/skygold/7872/#google_vignette"]},
  { pattern: /ハイキングする気難し屋|不機嫌な?エモ|ふきげんな?エモ|ペアデッキチェア|怒るエモ|怒りエモ/,
    response: ["【ハイキングする気難し屋】\n",
               "https://cdn.discordapp.com/attachments/1222143691570024530/1225233154437288067/sanc11.jpg",
               "https://9-bit.jp/skygold/7876/"]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
      
//----------------------------------------------------------------------------------------------------      
//雨林（恒常）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
//雨林（再訪）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
      
//----------------------------------------------------------------------------------------------------      
//峡谷（恒常）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
//峡谷（再訪）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["【】\n",
               "",
               ""]},
      
//----------------------------------------------------------------------------------------------------      
//捨て地（恒常）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
//捨て地（再訪）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
      
//----------------------------------------------------------------------------------------------------      
//書庫（恒常）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
//書庫（再訪）
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
  { pattern: /あああ|あああ|あああ|あああ|あああ/,
    response: ["",
               "",
               ""]},
               
//----------------------------------------------------------------------------------------------------      
*/

];


if (message.content.includes("スニャイヴは")) {
    try {
        // 最初のメッセージを送信
        let initialMessage = await message.channel.send("天才小学生プログラマー");

        // 一定時間待機してからメッセージを編集
        setTimeout(async () => {
            // メッセージを編集
            await initialMessage.edit("~~ 天才小学生プログラマー ~~");

            // さらに待機してからメッセージを削除
            setTimeout(async () => {
                await initialMessage.delete();
                
                // 最後のメッセージを送信
                message.channel.send("すみませんただのガキでした。");
            }, 3500); // メッセージを編集した後、3.5秒後に削除
        },2500); // メッセージを送信してから2秒後に編集
    } catch (error) {
        console.error('メッセージの処理中にエラーが発生しました:', error);
    }
}
  if (message.content.match(/seiは|せいは/)){
    let text1 = await message.channel.send("せいさんはですね・・・。");
    let text2 = await message.channel.send("言いたい事たくさんあるんですよ。");
    await text2.delete({ timeout: 3500 });
    let text3 = await message.channel.send("結構長くなるので覚悟してくださいね？");
    await text3.delete({ timeout: 3500 });
    let text4 = await message.channel.send("何から話そうかな。"); 
    await text4.delete({ timeout: 3500 });
    let text5 = await message.channel.send("まずは僕と青酸がはじめて出会った日の事ですが、");
    await text5.delete({ timeout: 3500 });
    let text6 = await message.channel.send("あれはまだ僕たちが高3だった頃…の2年前…。");
    await text6.delete({ timeout: 3500 });
    await text1.delete({ timeout: 500 });
    let text7 = await message.channel.send("続きは課金してね！♡");
    return;
  }
  if (message.content.match(/うえからみたっつん|上からみたっつん|上ら見たっつん|うえから見たっつん/)){
   let tattsun = ["https://cdn.discordapp.com/attachments/1007569901457780827/1066748844974555256/7e761eb540b3d144.mp4",
                  "https://cdn.discordapp.com/attachments/1007569901457780827/1066748925719105578/402b6a73c6da4df7.mp4",
                  "https://cdn.discordapp.com/attachments/1007569901457780827/1066748961689440326/127f3ecd5b797dcc.mp4",
                  "https://cdn.discordapp.com/attachments/1007569901457780827/1066750192747028530/e0cb6e42fac93ce7.mp4",
                  "https://cdn.discordapp.com/attachments/1072643515248549968/1183499885736104047/c8821e1e8e87b669.mp4",
                  "https://cdn.discordapp.com/attachments/1072643515248549968/1183499179989938247/1.mp4?",];
   lottery(message.channel.id, tattsun);
   return;
  }
  if (message.content.match(/今日のラッキーカラー/)){
   let lucky= ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F",];
   omikuji(message.channel.id,lucky);
   let text = "Googleで調べてみてね！！\nhttps://www.google.com";
   sendMsg(message.channel.id,text);
   return;
  }
  if (message.content.match(/しんどい|疲れた|つかれた|疲れました|つかれました/)){
    let arr = ["https://twitter.com/purinharumaki/status/1236262228581466112?s=20&t=Bg1hXcIolEEil7_xlZLR5w",
               "https://twitter.com/BornAKang/status/1574125489110728705?s=20&t=WDmSSyUE4Rm50mU-staUaQ",
               "https://twitter.com/aoihk_118/status/1561345302120271872?s=20&t=WDmSSyUE4Rm50mU-staUaQ",  
               "https://twitter.com/neparutennis/status/1574905632380968960?s=20&t=k3C0Dl0NG8mbtwaiK5K5oA",
               "https://twitter.com/shouldhaveaduck/status/1574819532052766720?s=20&t=k3C0Dl0NG8mbtwaiK5K5oA",
               "https://twitter.com/purinharumaki/status/1236262228581466112?s=20&t=WDmSSyUE4Rm50mU-staUaQ",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/XiaoYing_Video_1468200848374.mp4?v=1702753816734",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/RPReplay_Final1656442030.mov?v=1702753818389",
               "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/trim.EC1B9271-A86A-4BCE-BD4F-3AA97650813C.mov?v=1702753819841"];
    lottery(message.channel.id, arr);
    let text = "これ見て笑えよ";
    sendMsg(message.channel.id, text);
    return;
  }
  for (const { pattern, response } of patterns) {
  if (await handleMatchingMessage(pattern, response, message.channel.id)) {
    return;
  }
}
  if (message.content.match("死ね|アホ|あほ|クソ|くそ|バカ|ばか")){
    let text1 = await message.channel.send("おい！");
    let text2 = await message.channel.send("そんなこと言うなよ！");
    let text3 = await message.channel.send("‥‥‥‥‥‥");
    await text3.delete({ timeout: 3000 });
    let text4 = await message.channel.send("ｸｿｶﾞ");
    await text4.delete({ timeout: 400 });
    return;
  }
  if (message.content.match("VC開始|ボイチャ開始|VCスタート|ボイチャスタート")){
    let text1 = await message.channel.send("chatroom1にて通話が開始されました！\nhttps://discord.gg/PpugjHBgDB");
    await message.delete({ timeout: 200 });
    return;
  }
  if (message.content.match("うんこ|💩|ウンコ|ウンチ|うんｔ")){
    let text1 = await message.channel.send("う");
    let text2 = await message.channel.send("ん");
    let text3 = await message.channel.send("こ");
    let text4 = await message.channel.send("だ");
    let text5 = await message.channel.send("な");
    let text6 = await message.channel.send("♪");
    await text1.delete({ timeout: 700 });
    await text2.delete({ timeout: 100 });
    await text3.delete({ timeout: 100 });
    await text4.delete({ timeout: 100 });
    await text5.delete({ timeout: 100 });
    await text6.delete({ timeout: 100 });
    return;
  }
  if (message.content.match(/！おみくじ|!おみくじ/) ||
     (message.mentions.has(client.user) && message.content.match(/おみくじ/))){
    sendReply(message,"");
    let arr = [ 
               "㊗✨🎊すっごーーーい大吉！！🎊✨㊗",
               "✨✨かなり大吉✨✨",
               "✨吉だね！✨",
               "中吉だなぁ～👍🏻",
               "残念~ 小吉~www",
               "凶！",
               "大凶。背後には気を付けろよ・・・。",
               "きょへ様を崇めよ",
               "たっつんは泳いでいます。ここで"
               ]
    let GIFGIF = [
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/%E3%81%8A%E3%82%81%E3%81%A7%E3%81%A8%E3%81%86-%E5%AC%89%E3%81%97%E3%81%84.gif?v=1677096667773",
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/%E3%81%8A%E3%82%81%E3%81%A7%E3%81%A8%E3%81%86-%E5%AC%89%E3%81%97%E3%81%84%20(1).gif?v=1677096670342",
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/5c1d0bec96c0080c863ce98c199066dc.gif?v=1677098206251",
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/1160fb4501bd0bab8e82ec8f1c959e26.gif?v=1677098029491",
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/%E3%81%99%E3%81%94%E3%81%84-%E6%8B%8D%E6%89%8B.gif?v=1677096665281",
      "https://cdn.discordapp.com/attachments/932595932464291872/1078024865031913543/b23a176962cdbe5b.gif",
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/%EF%BC%91%EF%BC%92%EF%BC%93.gif?v=1677098585621",
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/o0365019912329969675.gif?v=1677096910953",
      "https://cdn.glitch.global/68ce99b8-0619-4731-b98b-b5d54a5d616e/people_0008_pool.gif?v=1677096924065"
                 ]
    let weight = [6,9,12,15,9,6,4,3,1];
    lotteryByWeight(message.channel.id, arr, GIFGIF, weight);
   
    try {
    await message.delete({ timeout: 1000 });
　　 } catch (error) {
    console.error('メッセージの削除中にエラーが発生しました:', error);
　　 }

    
    return;
  }
  else if (message.mentions.has(client.user)){
    sendReply(message, ["お金を入れてね！カードが貰えるよ！","あと、最新AIへの質問はスニャボットにメンションしてね。間違えてんじゃないわよ"]);
    return;
  }
});


if (process.env.DISCORD_BOT_TOKEN == undefined) {
    console.log('DISCORD_BOT_TOKENが設定されていません。');
    process.exit(0);
}

client.login(TOKEN);

function lottery(channelId, arr) {
    let random = Math.floor(Math.random() * arr.length);
    sendMsg(channelId, arr[random]);
}

function omikuji(channelId, arr) {
    let colorC = "";
    for (let i = 0; i < 6; i++) {
        let random = Math.floor(Math.random() * arr.length);
        colorC += arr[random];
    }
    sendMsg(channelId, "今日のラッキーカラーはこちら！→ #" + colorC);
}

function lotteryByWeight(channelId, arr, GIFGIF, weight) {
    let totalWeight = weight.reduce((acc, val) => acc + val, 0);
    let random = Math.floor(Math.random() * totalWeight);
    for (let i = 0; i < weight.length; i++) {
        if (random < weight[i]) {
            Double(channelId, arr[i], GIFGIF[i]);
            return;
        } else {
            random -= weight[i];
        }
    }
    console.log("lottery error");
}

function sendReply(message, text){
  message.reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

function sendMsg(channelId, text, option = {}) {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        console.error(`Channel with ID ${channelId} not found.`);
        return;
    }

    channel.send(text, option)
        .then(sentMessage => {
            console.log(`メッセージ送信成功: ${text}`);
            // ここで送信したメッセージに対する後続の処理を行う場合
        })
        .catch(error => {
            console.error(`メッセージ送信エラー: ${text}`, error);
        });
}

function Double(channelId,text1,text2){　
  sendMsg(channelId,text1)
  sendMsg(channelId,text2)
}

function dobot(channelId,text1){
  sendMsg(channelId,text1)
}
