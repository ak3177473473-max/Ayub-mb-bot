//base by   (AMMAR H4CK3R)
//WhatsApp: +923195447147
//telegram channel: https://t.me/ammar_devs

const axios = require('axios');
const chalk = require('chalk');
const settings = require('./settings');

module.exports = async (m, conn) => {
    try {
        const type = Object.keys(m.message)[0];
        const msgObj = type === 'ephemeralMessage' ? m.message.ephemeralMessage.message : m.message;
        const actualType = Object.keys(msgObj)[0];

        let body = "";
        if (actualType === 'conversation') body = msgObj.conversation;
        else if (actualType === 'extendedTextMessage') body = msgObj.extendedTextMessage.text;
        else if (actualType === 'imageMessage') body = msgObj.imageMessage.caption;
        else if (actualType === 'videoMessage') body = msgObj.videoMessage.caption;

        body = body ? body.trim() : "";
        if (!body) return;
        const senderNumber = m.sender.split('@')[0];
        const senderName = m.pushName;
        const chatType = m.isGroup ? `[ GROUP ]` : `[ PRIVATE ]`;

        console.log(
            chalk.bgCyan.black(` ${chatType} `) +
            chalk.greenBright(` [${senderNumber}] ${senderName} : `) +
            chalk.white(body)
        );
        const isCmd = settings.prefix.some(p => body.startsWith(p));
        if (!isCmd) return; 
        
        const prefix = settings.prefix.find(p => body.startsWith(p));
        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const text = args.join(' ');
        console.log(chalk.bgBlue.white(` [ COMMAND ] `) + chalk.yellowBright(` Executing: ${prefix}${command} `) + chalk.magentaBright(`from ${senderNumber}`));
        if (!global.db.users[m.sender]) {
            global.db.users[m.sender] = { name: senderName, hitCount: 0 };
        }
        global.db.users[m.sender].hitCount += 1;
        const Ammarreply = async (teks) => {
            await conn.sendMessage(m.chat, { text: teks }, { quoted: m });
            console.log(chalk.bgGreen.black(` [ SUCCESS ] `) + chalk.greenBright(` Reply sent to ${senderNumber} ✅`));
        };

        switch (command) {
          
            case 'menu': 
            case 'help':
            case 'alive':
            case '?':
            case 'allmenu': {
                
                const time = new Date().getHours();
                let ammarTimeWisher = "";
                if (time < 12) ammarTimeWisher = "🌞 Good Morning";
                else if (time < 15) ammarTimeWisher = "🌤️ Good Afternoon";
                else if (time < 19) ammarTimeWisher = "🌥️ Good Evening";
                else ammarTimeWisher = "🌙 Good Night";
                const more = String.fromCharCode(8206);
                const readmore = more.repeat(4001);
                const ammarMenu = `╭━━━━━━[ 𝐀 𝐌 𝐌 𝐀 𝐑 𝐌 𝐃 ]━━━━━━╮
┃ ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ┃ 👤 𝙐𝙨𝙚𝙧 : ${senderName}
┃ ┃ 🕒 𝙏𝙞𝙢𝙚 : ${ammarTimeWisher}
┃ ┃ 👑 𝘿𝙚𝙫  : 𝘼𝙢𝙢𝙖𝙧 𝙃𝟰𝙘𝙠𝟯𝙧
┃ ┃ 🚀 𝙑𝙚𝙧  : 𝟏.𝟎.𝟎
┃ ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${readmore}

╭━━━[ 👑 𝐌 𝐀 𝐈 𝐍  𝐌 𝐄 𝐍 𝐔 ]━━━╮
┃ 𖜚 ➪ *${prefix}menu*
┃ 𖜚 ➪ *${prefix}help*
┃ 𖜚 ➪ *${prefix}ping*
┃ 𖜚 ➪ *${prefix}owner*
┃ 𖜚 ➪ *${prefix}creator*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━[ 🔍 𝐒 𝐄 𝐀 𝐑 𝐂 𝐇 ]━━━━━━╮
┃ 𖜚 ➪ *${prefix}pinterest* _<query>_
┃ 𖜚 ➪ *${prefix}wallpaper* _<query>_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

    𖣘 © 𝟐𝟎𝟐𝟔 𝐀𝐌𝐌𝐀𝐑 𝐃𝐄𝐕𝐗 𖣘`;
                try {
                    await conn.sendMessage(m.chat, {
                        image: { url: "https://i.ibb.co/CKtrkBBW/cihuy.jpg" }, 
                        caption: ammarMenu,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            mentionedJid: [m.sender], 
                            forwardedNewsletterMessageInfo: {
                                newsletterName: settings.ownerName, 
                                newsletterJid: "120363403320186072@newsletter",
                            }
                        }
                    }, { quoted: m });
                    
                    console.log(chalk.bgGreen.black(` [ SUCCESS ] `) + chalk.greenBright(`Menu sent to ${senderNumber} ✅`));
                } catch (err) {
    
                    await conn.sendMessage(m.chat, { text: ammarMenu }, { quoted: m });
                    console.log(chalk.bgYellow.black(` [ WARNING ] `) + chalk.yellowBright(` Image failed but Text Menu sent to ${senderNumber} ✅`));
                }
            }
            break;
      
            case 'owner':
            case 'creator': {
                const vcard = 'BEGIN:VCARD\n' 
                + 'VERSION:3.0\n' 
                + `FN:${settings.ownerName}\n` 
                + `TEL;type=CELL;type=VOICE;waid=${settings.ownerNumber}:+${settings.ownerNumber}\n` 
                + 'END:VCARD';

                await conn.sendMessage(m.chat, { 
                    contacts: { displayName: settings.ownerName, contacts: [{ vcard }] }
                }, { quoted: m });
                console.log(chalk.bgGreen.black(` [ SUCCESS ] `) + chalk.greenBright(` Owner contact sent ✅`));
            }
            break;
            case 'ping': {
                await Ammarreply(`🏓 *Pong!*\n\n🚀 *${settings.botName}* is running perfectly!`);
            }
            break;
            case 'pinterest':
            case 'wallpaper': {
                if (!text) {
                    return await Ammarreply(`❌ What do you want to search?\n\n*Example:* ${prefix + command} Islamic DP`);
                }
                
                await Ammarreply(`⏳ *${settings.botName}* is searching for: ${text}...`);
                
                try {
                    let res = await axios.get(`https://bk9.fun/search/pinterest?q=${encodeURIComponent(text)}`);
                    let json = res.data;
                    
                    if (!json.BK9 || json.BK9.length === 0) {
                        return await Ammarreply('❌ No images found.');
                    }

                    let randomImage = json.BK9[Math.floor(Math.random() * json.BK9.length)];
                    
                    await conn.sendMessage(m.chat, { 
                        image: { url: randomImage }, 
                        caption: `🖼️ *Here is your Wallpaper/Pin*\n\n_© ${settings.botName}_` 
                    }, { quoted: m });

                    console.log(chalk.bgGreen.black(` [ SUCCESS ] `) + chalk.greenBright(` Image sent to ${senderNumber} ✅`));

                } catch (err) {
                    console.log(chalk.bgRed.white(` [ ERROR ] `) + chalk.redBright(` Pinterest Error: ${err.message}`));
                    await Ammarreply('❌ Failed to fetch image. API is down.');
                }
            }
            break;

        }
    } catch (e) {
        console.log(chalk.bgRed.white(` [ ERROR ] `) + chalk.redBright(e.message));
    }
};