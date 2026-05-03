//base by   (AYUB KHAN)
//WhatsApp: +923177473473
//telegram channel: https://t.me/ayubkhan798999

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const settings = require('./settings');

const dbPath = path.join(__dirname, settings.dbName);

// Anti-Ban System
const ANTI_BAN = { maxMessagesPerMin: 30, cooldownTime: 3000, randomDelay: true, antiSpam: true, humanTyping: true };
let messageCount = 0, lastReset = Date.now();
let cooldowns = new Map();

module.exports = async (m, conn) => {
    try {
        const now = Date.now();
        if (now - lastReset > 60000) { messageCount = 0; lastReset = now; }
        messageCount++;
        if (ANTI_BAN.antiSpam && messageCount > ANTI_BAN.maxMessagesPerMin) return;
        if (cooldowns.has(m.sender) && now - cooldowns.get(m.sender) < ANTI_BAN.cooldownTime) return;
        cooldowns.set(m.sender, now);
        setTimeout(() => cooldowns.delete(m.sender), ANTI_BAN.cooldownTime);
        if (ANTI_BAN.randomDelay) await new Promise(r => setTimeout(r, Math.floor(Math.random()*1500)+500));
        if (ANTI_BAN.humanTyping) { await conn.sendPresenceUpdate('composing', m.chat); await new Promise(r => setTimeout(r, Math.floor(Math.random()*1000)+500)); }

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
        const senderName = m.pushName || "User";
        const chatType = m.isGroup ? `[ GROUP ]` : `[ PRIVATE ]`;
        console.log(chalk.bgCyan.black(` ${chatType} `) + chalk.greenBright(` [${senderNumber}] ${senderName} : `) + chalk.white(body));

        const isCmd = settings.prefix.some(p => body.startsWith(p));
        if (!isCmd) return;
        const prefix = settings.prefix.find(p => body.startsWith(p));
        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const text = args.join(' ');

        if (!global.db.users[m.sender]) global.db.users[m.sender] = { name: senderName, hitCount: 0 };
        global.db.users[m.sender].hitCount++;
        if (!global.db.botInfo) global.db.botInfo = {};
        if (!global.db.botInfo.owners) global.db.botInfo.owners = [settings.ownerNumber];
        if (!global.db.botInfo.sudo) global.db.botInfo.sudo = [];
        if (!global.db.botInfo.banned) global.db.botInfo.banned = [];
        if (!global.db.botInfo.settings) global.db.botInfo.settings = { mode:'public', autoRead:true, autoTyping:false, autoRecording:false, alwaysOnline:false, antiCall:true, antiDelete:false, antiEdit:false, antiLink:false, welcome:false, goodbye:false, welcomeMsg:'Welcome @user! 🎉', goodbyeMsg:'Goodbye @user! 👋', prefix:settings.prefix };
        if (!global.db.groups) global.db.groups = {};
        if (m.isGroup && !global.db.groups[m.chat]) global.db.groups[m.chat] = { antiDelete:false, antiEdit:false, muted:false };

        const isOwner = global.db.botInfo.owners.includes(senderNumber);
        const isSudo = global.db.botInfo.sudo.includes(senderNumber);
        const isAdmin = isOwner || isSudo;
        const isBanned = global.db.botInfo.banned.includes(senderNumber);
        const botSettings = global.db.botInfo.settings;
        const quoted = m.quoted || m;

        const Ayubreply = async (teks) => { await conn.sendMessage(m.chat, { text: teks }, { quoted: m }); };
        const saveDb = () => fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
        if (isBanned && !isOwner) return;

        // ==================== MAIN MENU ====================
        if (['menu','help','alive','?','allmenu'].includes(command)) {
            const time = new Date().getHours();
            let wisher = time<12?"☀️ Good Morning":time<15?"🌤️ Good Afternoon":time<19?"🌅 Good Evening":"🌙 Good Night";
            const menuText = `╔═══════════════════════╗
║  🤖 *${settings.botName}*  ║
╚═══════════════════════╝
♛ *Owner:* ${settings.ownerName}
✦ *Prefix:* ${settings.prefix.join('  ')}
🚀 *Version:* 1.0.0
🔥 *Mode:* ${botSettings.mode}

╭══〔 👤 USER INFO 〕══╮
┃ 🧑 *Name:* ${senderName}
┃ 📱 *Number:* ${senderNumber}
┃ 🕐 *Time:* ${wisher}
┃ 📊 *Hits:* ${global.db.users[m.sender].hitCount}
╰══════════════════════╯

╭══〔 📂 MAIN MENU (10) 〕══╮
┃ ⬡ *.menu* - Main Menu
┃ ⬡ *.menu2* - Alt Menu
┃ ⬡ *.help* - Help
┃ ⬡ *.ping* - Speed Test
┃ ⬡ *.ping2* - Ping v2
┃ ⬡ *.owner* - Owner Contact
┃ ⬡ *.fetch* <url> - Fetcher
┃ ⬡ *.repo* - Repository
┃ ⬡ *.githubstalk* <user>
┃ ⬡ *.anime* <name>
╰══════════════════════╯

╭══〔 📂 CATEGORIES 〕══╮
┃ ⬡ *.audio* - Audio (2)
┃ ⬡ *.utility* - Utility (11)
┃ ⬡ *.owner* - Owner (16)
┃ ⬡ *.download* - Download (27)
┃ ⬡ *.group* - Group (28)
┃ ⬡ *.setting* - Settings (49)
┃ ⬡ *.fun* - Fun (102)
┃ ⬡ *.tools* - Tools (151)
╰══════════════════════╯

╔═══════════════════════╗
║  © 2026 AYUB KHAN     ║
╚═══════════════════════╝`;
            try { await conn.sendMessage(m.chat,{image:{url:settings.menuImage||"https://i.ibb.co/CKtrkBBW/cihuy.jpg"},caption:menuText,contextInfo:{forwardingScore:999,isForwarded:true,mentionedJid:[m.sender],forwardedNewsletterMessageInfo:{newsletterName:settings.ownerName,newsletterJid:"120363403320186072@newsletter"}}},{quoted:m}); } catch(e) { await Ayubreply(menuText); }
            return;
        }

        // ==================== MAIN COMMANDS ====================
        if (command === 'menu2') await Ayubreply(`*╭┈───〔 Main Menu 〕┈───⊷*\n*├▢ 📜 Category:* main\n*├▢ 🔢 Total Commands:* 10\n*╰───────────────────⊷*\n*『 MAIN 』*\n╭───────────────────⊷\n*┋ ⬡ ғᴇᴛᴄʜ*\n*┋ ⬡ ʜᴇʟᴘ*\n*┋ ⬡ ᴍᴇɴᴜ*\n*┋ ⬡ ᴍᴇɴᴜ2*\n*┋ ⬡ ᴘɪɴɢ*\n*┋ ⬡ ᴘɪɴɢ2*\n*┋ ⬡ ʀᴇᴘᴏ*\n*┋ ⬡ ᴏᴡɴᴇʀ*\n*┋ ⬡ ɢɪᴛʜᴜʙsᴛᴀʟᴋ*\n*┋ ⬡ ᴀɴɪᴍᴇ*\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        if (command === 'ping') { let s=Date.now(); await Ayubreply('📊 Calculating...'); await Ayubreply(`🏓 Pong!\n⚡ ${Date.now()-s}ms\n🤖 ${settings.botName}`); }
        if (command === 'ping2') { let s=Date.now(); await conn.sendMessage(m.chat,{text:'📊 Test...'}); await Ayubreply(`⚡ PING v2\n📡 ${Date.now()-s}ms\n🌐 Connected`); }
        if (command === 'fetch') { if(!text) return await Ayubreply(`*Usage:* ${prefix}fetch <url>`); try { let r=await axios.get(text); await Ayubreply(`📡 FETCH:\n\`\`\`${JSON.stringify(r.data,null,2).substring(0,4000)}\`\`\``); } catch(e) { await Ayubreply('❌ Failed!'); } }
        if (command === 'repo') await Ayubreply(`📂 REPO\n👤 ${settings.ownerName}\n🤖 ${settings.botName}\n📱 +${settings.ownerNumber}\n📢 https://t.me/ayubkhan798999`);
        if (['owner','creator'].includes(command)) { let v='BEGIN:VCARD\nVERSION:3.0\nFN:'+settings.ownerName+'\nTEL;waid='+settings.ownerNumber+':+'+settings.ownerNumber+'\nEND:VCARD'; await conn.sendMessage(m.chat,{contacts:{displayName:settings.ownerName,contacts:[{vcard:v}]}},{quoted:m}); }
        if (command === 'githubstalk') { if(!text) return await Ayubreply(`*Usage:* ${prefix}githubstalk <user>`); try { let r=await axios.get(`https://api.github.com/users/${text}`); let u=r.data; await conn.sendMessage(m.chat,{image:{url:u.avatar_url},caption:`🐙 ${u.login}\n📛 ${u.name||'N/A'}\n📦 ${u.public_repos}\n👥 ${u.followers}`},{quoted:m}); } catch(e) { await Ayubreply('❌ Not found!'); } }
        if (command === 'anime') { if(!text) return await Ayubreply(`*Usage:* ${prefix}anime <name>`); try { let r=await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`); let a=r.data.data[0]; if(!a) return await Ayubreply('❌ Not found!'); await conn.sendMessage(m.chat,{image:{url:a.images.jpg.large_image_url},caption:`🎬 ${a.title}\n⭐ ${a.score||'N/A'}\n🎭 ${a.type||'N/A'}`},{quoted:m}); } catch(e) { await Ayubreply('❌ Error!'); } }

        // NEW COMMANDS IN MAIN CATEGORY
        if (command === 'getdp' || command === 'getpp') {
            let target;
            if (m.mentionedJid && m.mentionedJid.length > 0) target = m.mentionedJid[0];
            else if (text) target = text.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            else target = m.sender;
            try {
                let pp = await conn.profilePictureUrl(target, 'image');
                await conn.sendMessage(m.chat, { image: { url: pp }, caption: `🖼️ *Profile Picture*\n© ${settings.botName}` }, { quoted: m });
            } catch (e) { await Ayubreply('❌ No profile picture found!'); }
        }
        if (command === 'fullpp') {
            try {
                let pp = await conn.profilePictureUrl(m.sender, 'image');
                await conn.sendMessage(m.chat, { image: { url: pp }, caption: `🖼️ *Full DP*\n© ${settings.botName}` }, { quoted: m });
            } catch (e) { await Ayubreply('❌ No profile picture!'); }
        }

        // ==================== AUDIO MENU (2 commands) ====================
        if (['audio','audiomenu'].includes(command)) {
            await Ayubreply(`*╭┈───〔 Audio Menu 〕┈───⊷*\n*├▢ 📜 Category:* audio\n*├▢ 🔢 Total Commands:* 2\n*╰───────────────────⊷*\n*『 AUDIO 』*\n╭───────────────────⊷\n*┋ ⬡ ᴛᴏᴍᴘ3* - Audio to MP3\n*┋ ⬡ ᴛᴏᴘᴛᴛ* - Audio to PTT\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }
        if (command === 'tomp3') await Ayubreply('🎵 Audio to MP3 feature coming soon!');
        if (command === 'toptt') await Ayubreply('🎤 Audio to PTT feature coming soon!');

        // ==================== VOICE CHANGER COMMANDS ====================
        const voiceEffects = ['bass','blown','deep','earrape','fast','fat','nightcore','reverse','robot','slow','smooth','tupai','girl','girlvoice','baby','chipmunk','helicopter','ghostvoice'];
        if (voiceEffects.includes(command)) {
            const quotedMsg = quoted.message;
            if (!quotedMsg?.audioMessage && !quotedMsg?.videoMessage) return await Ayubreply(`Reply to an audio/video!\n*Usage:* Reply + ${prefix}${command}`);
            const effectNames = { bass:'🔊 Bass Boost', blown:'💨 Blown', deep:'🗣️ Deep Voice', earrape:'📢 Ear Rape', fast:'⚡ Fast', fat:'🍔 Fat Voice', nightcore:'🌙 Nightcore', reverse:'🔄 Reverse', robot:'🤖 Robot', slow:'🐌 Slow', smooth:'✨ Smooth', tupai:'🐿️ Squirrel', girl:'👧 Girl Voice', girlvoice:'👧 Girl Voice', baby:'👶 Baby Voice', chipmunk:'🐿️ Chipmunk', helicopter:'🚁 Helicopter', ghostvoice:'👻 Ghost Voice' };
            await Ayubreply(`🎤 *${effectNames[command] || command}* effect applied!\n\n⚠️ Full processing coming soon!`);
        }

        // ==================== UTILITY MENU (11 commands) ====================
        if (['utility','utilitymenu','util'].includes(command)) {
            await Ayubreply(`*╭┈───〔 Utility Menu 〕┈───⊷*\n*├▢ 📜 Category:* utility\n*├▢ 🔢 Total Commands:* 11\n*╰───────────────────⊷*\n*『 UTILITY 』*\n╭───────────────────⊷\n*┋ ⬡ ᴀʟɪᴠᴇ* - Bot Status\n*┋ ⬡ ᴜᴘᴛɪᴍᴇ* - Uptime\n*┋ ⬡ ᴄᴏɴᴠᴇʀᴛ* <val> <from> <to>\n*┋ ⬡ ᴄᴘᴘ* <num> - Country Info\n*┋ ⬡ sᴛʀᴜᴄᴛᴜʀᴇ* - JSON Structure\n*┋ ⬡ ʀᴀᴡ2* <json> - Format JSON\n*┋ ⬡ ɪᴅ* - Your ID\n*┋ ⬡ ɢᴇᴛʟɪᴅ* @tag - Get ID\n*┋ ⬡ ᴘʀᴀʏᴛɪᴍᴇ* <city>\n*┋ ⬡ ᴄᴀᴘᴛɪᴏɴ* - Caption\n*┋ ⬡ ɢᴇᴛɪᴍᴀɢᴇ* - Get Image\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }
        if (command === 'alive') await Ayubreply(`🤖 *${settings.botName}* is ALIVE!\n📶 Status: Online\n⚡ Version: 1.0.0`);
        if (command === 'uptime') { let u=process.uptime(); await Ayubreply(`⏱️ Uptime: ${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m ${Math.floor(u%60)}s`); }
        if (command === 'id') await Ayubreply(`🆔 Your ID: ${m.sender}`);
        if (command === 'getlid') { let t=m.mentionedJid?.[0]||m.sender; await Ayubreply(`🆔 ID: ${t}`); }
        if (command === 'convert') { if(!text) return await Ayubreply(`*Usage:* ${prefix}convert 100 USD PKR`); await Ayubreply('💱 Currency conversion coming soon!'); }
        if (command === 'cpp') { if(!text) return await Ayubreply(`*Usage:* ${prefix}cpp 923001234567`); await Ayubreply('🌍 Country info coming soon!'); }
        if (command === 'structure') await Ayubreply('📋 JSON Structure feature coming soon!');
        if (command === 'raw2') await Ayubreply('📝 JSON Formatter coming soon!');
        if (command === 'praytime') { if(!text) return await Ayubreply(`*Usage:* ${prefix}praytime Karachi`); await Ayubreply('🕌 Prayer times coming soon!'); }
        if (command === 'caption') await Ayubreply('📝 Caption feature coming soon!');
        if (command === 'getimage') await Ayubreply('🖼️ Get Image feature coming soon!');

        // ==================== OWNER MENU (16 commands) ====================
        if (['owner','ownermenu'].includes(command) && isAdmin) {
            await Ayubreply(`*╭┈───〔 Owner Menu 〕┈───⊷*\n*├▢ 📜 Category:* owner\n*├▢ 🔢 Total Commands:* 16\n*╰───────────────────⊷*\n*『 OWNER 』*\n╭───────────────────⊷\n*┋ ⬡ ᴠᴠ3* <text>\n*┋ ⬡ ᴠᴠ* <text>\n*┋ ⬡ ᴠᴠ2* <text>\n*┋ ⬡ ғᴏʀᴡᴀʀᴅ* <num>|<msg>\n*┋ ⬡ ᴘᴀɪʀ* <num>\n*┋ ⬡ ᴘᴀɪʀ2* <num>\n*┋ ⬡ ʟᴇᴀᴠᴇ*\n*┋ ⬡ ʜɪᴅᴇᴛᴀɢ* <msg>\n*┋ ⬡ ɪᴋ* @tag\n*┋ ⬡ ʙʟᴏᴄᴋ* @tag\n*┋ ⬡ ᴜɴʙʟᴏᴄᴋ* @tag\n*┋ ⬡ ᴜᴘᴅᴀᴛᴇ*\n*┋ ⬡ ᴍɪɴɪ*\n*┋ ⬡ ғᴜʟʟᴘᴘ*\n*┋ ⬡ ᴀᴅᴅᴏᴡɴᴇʀ* <num>\n*┋ ⬡ ᴅᴇʟᴏᴡɴᴇʀ* <num>\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }
        if (command==='addowner'&&isOwner){ if(!text) return await Ayubreply(`*Usage:* ${prefix}addowner <num>`); let n=text.replace(/[^0-9]/g,''); if(global.db.botInfo.owners.includes(n)) return await Ayubreply('Already owner!'); global.db.botInfo.owners.push(n); saveDb(); await Ayubreply(`✅ Owner Added: ${n}`); }
        if (command==='delowner'&&isOwner){ if(!text) return await Ayubreply(`*Usage:* ${prefix}delowner <num>`); let n=text.replace(/[^0-9]/g,''); if(n===settings.ownerNumber) return await Ayubreply('Cannot remove main owner!'); global.db.botInfo.owners=global.db.botInfo.owners.filter(o=>o!==n); saveDb(); await Ayubreply(`✅ Owner Removed: ${n}`); }
        if (command==='block'&&isAdmin){ let t=m.mentionedJid?.[0]||(text?text.replace(/[^0-9]/g,'')+'@s.whatsapp.net':null); if(!t) return await Ayubreply('Tag or enter number!'); await conn.updateBlockStatus(t,'block'); await Ayubreply('✅ Blocked!'); }
        if (command==='unblock'&&isAdmin){ let t=m.mentionedJid?.[0]||(text?text.replace(/[^0-9]/g,'')+'@s.whatsapp.net':null); if(!t) return await Ayubreply('Tag or enter number!'); await conn.updateBlockStatus(t,'unblock'); await Ayubreply('✅ Unblocked!'); }
        if (command==='leave'&&isAdmin&&m.isGroup){ await Ayubreply('👋 Goodbye!'); await conn.groupLeave(m.chat); }
        if (command==='hidetag'&&isAdmin&&m.isGroup){ if(!text) return; try { let meta=await conn.groupMetadata(m.chat); await conn.sendMessage(m.chat,{text,mentions:meta.participants.map(p=>p.id)},{quoted:m}); } catch(e){} }
        if (command==='vv3'&&isAdmin) await Ayubreply(text||'VV3 Message');
        if (command==='vv'&&isAdmin) await Ayubreply(`*${text||'VV Message'}*`);
        if (command==='vv2'&&isAdmin) await Ayubreply(`_${text||'VV2 Message'}_`);
        if (command==='ik'&&isAdmin){ let t=m.mentionedJid?.[0]; if(!t) return await Ayubreply('Tag someone!'); await conn.sendMessage(m.chat,{text:`💀 INSTANT KILL!\n@${t.split('@')[0]} eliminated!`,mentions:[t]},{quoted:m}); }
        if (command==='update'&&isAdmin) await Ayubreply(`📊 Update\n👤 ${settings.ownerName}\n🤖 ${settings.botName}\n📱 +${settings.ownerNumber}`);

        // ==================== DOWNLOAD MENU (27 commands) ====================
        if (['download','dlmenu','dl'].includes(command)) {
            await Ayubreply(`*╭┈───〔 Download Menu 〕┈───⊷*\n*├▢ 📜 Category:* download\n*├▢ 🔢 Total Commands:* 27\n*╰───────────────────⊷*\n*『 DOWNLOAD 』*\n╭───────────────────⊷\n*┋ ⬡ ɢᴅʀɪᴠᴇ* <url>\n*┋ ⬡ ᴅʀᴀᴍᴀ* <name>\n*┋ ⬡ ᴄᴀᴘᴄᴜᴛ* <url>\n*┋ ⬡ ᴀᴘᴋ* <app>\n*┋ ⬡ ғʙ* <url>\n*┋ ⬡ ɪɢᴅʟ* <url>\n*┋ ⬡ ɪɢᴅʟ2* <url>\n*┋ ⬡ ɪɢᴅʟ3* <url>\n*┋ ⬡ ᴍᴇᴅɪᴀғɪʀᴇ* <url>\n*┋ ⬡ ᴅʟɴᴘᴍ* <pkg>\n*┋ ⬡ ᴍᴇɢᴀᴅʟ* <url>\n*┋ ⬡ ᴘɪɴᴛᴇʀᴇsᴛ* <q>\n*┋ ⬡ ᴛᴛᴍᴘ3* <url>\n*┋ ⬡ ɪɢᴍᴘ3* <url>\n*┋ ⬡ ᴛɪᴋᴛᴏᴋ* <url>\n*┋ ⬡ ᴛɪᴋᴛᴏᴋ2* <url>\n*┋ ⬡ ᴛɪᴋᴛᴏᴋ3* <url>\n*┋ ⬡ ʏᴛᴘᴏsᴛ* <url>\n*┋ ⬡ ᴅᴏᴡɴʟᴏᴀᴅ* <url>\n*┋ ⬡ ᴛsᴛɪᴄᴋᴇʀ* <url>\n*┋ ⬡ ᴛɪᴋᴛᴏᴋsᴇᴀʀᴄʜ* <q>\n*┋ ⬡ sᴜʀᴀʜ* <name>\n*┋ ⬡ ᴛᴛs* <lang> <txt>\n*┋ ⬡ ɢɪᴛᴄʟᴏɴᴇ* <url>\n*┋ ⬡ ᴘʟᴀʏ* <song>\n*┋ ⬡ ʏᴛᴠ* <url>\n*┋ ⬡ sᴏɴɢ* <name>\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }
        if (command==='play'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}play <song>`); await Ayubreply(`🎵 Searching: ${text}...`); try { let r=await axios.get(`https://bk9.fun/search/youtube?q=${encodeURIComponent(text)}`); if(r.data.BK9?.length>0) await Ayubreply(`🎵 Found: ${r.data.BK9[0].title}\n🔗 ${r.data.BK9[0].url}`); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='tiktok'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}tiktok <url>`); await Ayubreply('⏳ Downloading...'); try { let r=await axios.get(`https://bk9.fun/download/tiktok?url=${encodeURIComponent(text)}`); if(r.data.BK9?.url) await conn.sendMessage(m.chat,{video:{url:r.data.BK9.url},caption:`© ${settings.botName}`},{quoted:m}); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='ttmp3'||command==='tiktokmp3'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}ttmp3 <url>`); await Ayubreply('⏳ Downloading...'); try { let r=await axios.get(`https://bk9.fun/download/tiktok?url=${encodeURIComponent(text)}`); if(r.data.BK9?.audio) await conn.sendMessage(m.chat,{audio:{url:r.data.BK9.audio},mimetype:'audio/mp4'},{quoted:m}); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='song'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}song <name>`); await Ayubreply(`🎵 Searching: ${text}...`); try { let r=await axios.get(`https://bk9.fun/search/youtube?q=${encodeURIComponent(text)}`); if(r.data.BK9?.length>0) await Ayubreply(`🎵 ${r.data.BK9[0].title}\n🔗 ${r.data.BK9[0].url}`); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (['fb','facebook'].includes(command)){ if(!text) return await Ayubreply(`*Usage:* ${prefix}fb <url>`); await Ayubreply('⏳ Downloading FB video...'); try { let r=await axios.get(`https://bk9.fun/download/facebook?url=${encodeURIComponent(text)}`); if(r.data.BK9?.url) await conn.sendMessage(m.chat,{video:{url:r.data.BK9.url},caption:`© ${settings.botName}`},{quoted:m}); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (['igdl','instagram'].includes(command)){ if(!text) return await Ayubreply(`*Usage:* ${prefix}igdl <url>`); await Ayubreply('⏳ Downloading...'); try { let r=await axios.get(`https://bk9.fun/download/instagram?url=${encodeURIComponent(text)}`); if(r.data.BK9?.url) await conn.sendMessage(m.chat,{video:{url:r.data.BK9.url},caption:`© ${settings.botName}`},{quoted:m}); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='apk'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}apk <app name>`); await Ayubreply(`🔍 Searching APK: ${text}...`); }
        if (command==='tts'){ if(!args.length) return await Ayubreply(`*Usage:* ${prefix}tts en Hello`); await Ayubreply('🗣️ TTS coming soon!'); }
        if (command==='surah'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}surah <name>`); await Ayubreply('📖 Quran Surah coming soon!'); }
        if (command==='ytv'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}ytv <url>`); await Ayubreply('📹 YouTube Video coming soon!'); }
        if (command==='pinterest'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}pinterest <query>`); await Ayubreply(`🔍 Searching: ${text}...`); try { let r=await axios.get(`https://bk9.fun/search/pinterest?q=${encodeURIComponent(text)}`); if(r.data.BK9?.length>0){ let img=r.data.BK9[Math.floor(Math.random()*r.data.BK9.length)]; await conn.sendMessage(m.chat,{image:{url:img},caption:`🖼️ ${text}\n© ${settings.botName}`},{quoted:m}); } } catch(e){ await Ayubreply('❌ Failed!'); } }

        // ==================== GROUP MENU (28 commands) ====================
        if (['group','groupmenu','gmenu'].includes(command)) {
            await Ayubreply(`*╭┈───〔 Group Menu 〕┈───⊷*\n*├▢ 📜 Category:* group\n*├▢ 🔢 Total Commands:* 28\n*╰───────────────────⊷*\n*『 GROUP 』*\n╭───────────────────⊷\n*┋ ⬡ ᴅᴇʟᴇᴛᴇ*\n*┋ ⬡ ᴜɴᴍᴜᴛᴇ*\n*┋ ⬡ ᴍᴜᴛᴇ*\n*┋ ⬡ ᴛᴀɢᴀʟʟ*\n*┋ ⬡ ɢʀᴏᴜᴘsᴛᴀᴛᴜs*\n*┋ ⬡ ᴋɪᴄᴋ*\n*┋ ⬡ ᴘʀᴏᴍᴏᴛᴇ*\n*┋ ⬡ ᴅᴇᴍᴏᴛᴇ*\n*┋ ⬡ ɢᴄᴘᴘ*\n*┋ ⬡ ʀᴇᴠᴏᴋᴇ*\n*┋ ⬡ ʟɪɴᴋ*\n*┋ ⬡ ɢɪɴғᴏ*\n*┋ ⬡ ᴜᴘᴅᴀᴛᴇɢᴅᴇsᴄ*\n*┋ ⬡ ᴜᴘᴅᴀᴛᴇɢɴᴀᴍᴇ*\n*┋ ⬡ ᴘᴏʟʟ*\n*┋ ⬡ ᴏᴜᴛ*\n*┋ ⬡ ɴᴇᴡɢᴄ*\n*┋ ⬡ ᴇɴᴅ*\n*┋ ⬡ ᴊᴏɪɴ*\n*┋ ⬡ ɪɴᴠɪᴛᴇ*\n*┋ ⬡ ᴛᴀɢ*\n*┋ ⬡ ᴀᴄᴄᴇᴘᴛᴀʟʟ*\n*┋ ⬡ ʀᴇᴊᴇᴄᴛᴀʟʟ*\n*┋ ⬡ ʀᴇǫᴜᴇsᴛs*\n*┋ ⬡ ᴀᴄᴄᴇᴘᴛ*\n*┋ ⬡ ʀᴇᴊᴇᴄᴛ*\n*┋ ⬡ ᴀᴅᴅ*\n*┋ ⬡ ᴇᴠᴇʀʏᴏɴᴇ*\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }
        if (command==='kickall'&&isAdmin&&m.isGroup){ try { let meta=await conn.groupMetadata(m.chat); for(let p of meta.participants){ if(p.id!==conn.user.id&&!p.admin){ await conn.groupParticipantsUpdate(m.chat,[p.id],'remove'); await new Promise(r=>setTimeout(r,1000)); } } await Ayubreply('✅ All kicked!'); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='antidelete'&&isAdmin&&m.isGroup){ global.db.groups[m.chat].antiDelete=!global.db.groups[m.chat].antiDelete; saveDb(); await Ayubreply(`${global.db.groups[m.chat].antiDelete?'✅ Anti-Delete ON':'❌ Anti-Delete OFF'}`); }
        if (command==='antiedit'&&isAdmin&&m.isGroup){ global.db.groups[m.chat].antiEdit=!global.db.groups[m.chat].antiEdit; saveDb(); await Ayubreply(`${global.db.groups[m.chat].antiEdit?'✅ Anti-Edit ON':'❌ Anti-Edit OFF'}`); }
        if (command==='hidetag'&&isAdmin&&m.isGroup){ if(!text) return; try { let meta=await conn.groupMetadata(m.chat); await conn.sendMessage(m.chat,{text,mentions:meta.participants.map(p=>p.id)},{quoted:m}); } catch(e){} }
        if (command==='tagall'&&m.isGroup){ try { let meta=await conn.groupMetadata(m.chat); let txt='📢 EVERYONE!\n\n'; meta.participants.forEach((p,i)=>{ txt+=`${i+1}. @${p.id.split('@')[0]}\n`; }); await conn.sendMessage(m.chat,{text:txt,mentions:meta.participants.map(p=>p.id)},{quoted:m}); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='kick'&&isAdmin&&m.isGroup){ let t=m.mentionedJid?.[0]; if(!t) return await Ayubreply('Tag someone!'); try { await conn.groupParticipantsUpdate(m.chat,[t],'remove'); await Ayubreply('✅ Kicked!'); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='promote'&&isAdmin&&m.isGroup){ let t=m.mentionedJid?.[0]; if(!t) return await Ayubreply('Tag someone!'); try { await conn.groupParticipantsUpdate(m.chat,[t],'promote'); await Ayubreply('✅ Promoted!'); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='demote'&&isAdmin&&m.isGroup){ let t=m.mentionedJid?.[0]; if(!t) return await Ayubreply('Tag someone!'); try { await conn.groupParticipantsUpdate(m.chat,[t],'demote'); await Ayubreply('✅ Demoted!'); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='link'&&m.isGroup){ try { let code=await conn.groupInviteCode(m.chat); await Ayubreply(`🔗 https://chat.whatsapp.com/${code}`); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='ginfo'&&m.isGroup){ try { let meta=await conn.groupMetadata(m.chat); await Ayubreply(`📋 *Group Info*\n👥 ${meta.subject}\n📝 ${meta.desc||'No desc'}\n👤 ${meta.participants.length} members`); } catch(e){} }
        if (command==='revoke'&&isAdmin&&m.isGroup){ try { await conn.groupRevokeInvite(m.chat); await Ayubreply('✅ Link revoked!'); } catch(e){} }
        if (command==='add'&&isAdmin&&m.isGroup){ if(!text) return await Ayubreply(`*Usage:* ${prefix}add 92300...`); try { await conn.groupParticipantsUpdate(m.chat,[text.replace(/[^0-9]/g,'')+'@s.whatsapp.net'],'add'); await Ayubreply('✅ Added!'); } catch(e){ await Ayubreply('❌ Failed!'); } }
        if (command==='everyone'&&m.isGroup){ try { let meta=await conn.groupMetadata(m.chat); let txt='📢 @everyone'; await conn.sendMessage(m.chat,{text:txt,mentions:meta.participants.map(p=>p.id)},{quoted:m}); } catch(e){} }
        if (command==='poll'&&m.isGroup){ let parts=text.split('|'); if(parts.length<3) return await Ayubreply(`*Usage:* ${prefix}poll Question|Option1|Option2`); await Ayubreply('📊 Poll feature coming soon!'); }

        // ==================== SETTING MENU (49 commands) ====================
        if (['setting','settings','setmenu'].includes(command) && isAdmin) {
            await Ayubreply(`*╭┈───〔 Setting Menu 〕┈───⊷*\n*├▢ 📜 Category:* setting\n*├▢ 🔢 Total Commands:* 49\n*╰───────────────────⊷*\n*『 SETTING 』*\n╭───────────────────⊷\n*┋ ⬡ sᴇᴛᴘʀᴇғɪx* <char>\n*┋ ⬡ ᴍᴏᴅᴇ* <public/self>\n*┋ ⬡ ʙᴏᴛᴅᴘ*\n*┋ ⬡ ʙᴏᴛɴᴀᴍᴇ*\n*┋ ⬡ ᴏᴡɴᴇʀɴᴀᴍᴇ*\n*┋ ⬡ sᴇᴛᴏᴡɴᴇʀ*\n*┋ ⬡ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ*\n*┋ ⬡ ʀᴇᴊᴇᴄᴛᴍsɢ*\n*┋ ⬡ ᴅᴇʟᴘᴀᴛʜ*\n*┋ ⬡ ᴇᴅɪᴛᴘᴀᴛʜ*\n*┋ ⬡ ʙᴀɴ* *ᴜɴʙᴀɴ* *ʙᴀɴʟɪsᴛ*\n*┋ ⬡ ᴀᴅᴅsᴜᴅᴏ* *ᴅᴇʟsᴜᴅᴏ* *sᴜᴅᴏʟɪsᴛ*\n*┋ ⬡ ᴀɴᴛɪ-ᴄᴀʟʟ* *ᴍᴇɴᴛɪᴏɴʀᴇᴘʟʏ*\n*┋ ⬡ ᴀɴᴛɪᴅᴇʟᴇᴛᴇ* *ᴀɴᴛɪᴇᴅɪᴛ* *ᴀɴᴛɪʟɪɴᴋ*\n*┋ ⬡ sᴇᴛᴡᴇʟᴄᴏᴍᴇ* *sᴇᴛɢᴏᴏᴅʙʏᴇ*\n*┋ ⬡ ᴡᴇʟᴄᴏᴍᴇ* *ɢᴏᴏᴅʙʏᴇ*\n*┋ ⬡ ᴀᴜᴛᴏʀᴇᴀᴄᴛ* *sᴛᴀᴛᴜsᴠɪᴇᴡ*\n*┋ ⬡ ᴀᴜᴛᴏʀᴇᴀᴅ* *ᴀʟᴡᴀʏsᴏɴʟɪɴᴇ*\n*┋ ⬡ ᴀᴜᴛᴏᴛʏᴘɪɴɢ* *ᴀᴜᴛᴏʀᴇᴄᴏʀᴅɪɴɢ*\n*┋ ⬡ ᴀᴜᴛᴏᴅʟ* *ᴀᴜᴛᴏsᴛɪᴄᴋᴇʀ* *ᴀᴜᴛᴏʀᴇᴘʟʏ*\n*┋ ⬡ ᴀᴅᴍɪɴᴀᴄᴛɪᴏɴ* *ᴏᴡɴᴇʀʀᴇᴀᴄᴛ*\n*┋ ⬡ ʀᴇᴀᴄᴛᴇᴍᴏᴊɪs* *ᴏᴡɴᴇʀᴇᴍᴏᴊɪ*\n*┋ ⬡ sᴇᴛᴛɪɴɢ* *ᴇɴᴠʟɪsᴛ* *ᴘʀɪᴠᴀᴄʏ*\n*┋ ⬡ ʙʟᴏᴄᴋʟɪsᴛ* *ɢᴇᴛʙɪᴏ*\n*┋ ⬡ sᴇᴛᴘᴘᴀʟʟ* *sᴇᴛᴏɴʟɪɴᴇ* *sᴇᴛɴᴀᴍᴇ*\n*┋ ⬡ ᴜᴘᴅᴀᴛᴇʙɪᴏ* *ɢʀᴏᴜᴘsᴘʀɪᴠᴀᴄʏ* *ɢᴇᴛᴘʀɪᴠᴀᴄʏ*\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }

        // ==================== FUN MENU (102 commands) ====================
        if (['fun','funmenu'].includes(command)) {
            await Ayubreply(`*╭┈───〔 Fun Menu 〕┈───⊷*\n*├▢ 📜 Category:* fun\n*├▢ 🔢 Total Commands:* 102\n*╰───────────────────⊷*\n*『 FUN 』*\n╭───────────────────⊷\n*┋ ⬡ ᴍᴜᴛʜ* *ᴄʜᴀʀᴀᴄᴛᴇʀ* *ʀɪɴɢᴛᴏɴᴇ*\n*┋ ⬡ sʜɪᴘ* @tag - Ship Meter\n*┋ ⬡ ᴅᴀᴅ* *ᴍᴏᴍ* *sᴏɴ* *ᴅᴀᴜɢʜᴛᴇʀ*\n*┋ ⬡ ʙᴏʏғʀɪᴇɴᴅ* *ɢɪʀʟғʀɪᴇɴᴅ* *ᴛᴡɪɴ*\n*┋ ⬡ ᴘᴀʀᴛɴᴇʀ* *ʙᴏss* *ᴘᴇᴛ*\n*┋ ⬡ ᴋɪɴɢ* *ǫᴜᴇᴇɴ* *ʀɪᴄʜ* *ᴘᴏᴏʀ*\n*┋ ⬡ ʙʜᴀɪ* *ʙᴀʜᴀɴ* *ᴡɪғᴇ* *ʜᴜsʙᴀɴᴅ*\n*┋ ⬡ ᴄʀᴜsʜ* *ғʟɪʀᴛ* *ᴊᴏᴋᴇ* *ǫᴜᴏᴛᴇ*\n*┋ ⬡ ʀᴏᴀsᴛ* *8ʙᴀʟʟ* *ʟᴏᴠᴇᴛᴇsᴛ*\n*┋ ⬡ ʜᴜɢ* *ᴋɪss* *sʟᴀᴘ* *ᴘᴀᴛ* *ʙᴏɴᴋ*\n*┋ ⬡ ᴡᴀᴠᴇ* *sᴍɪʟᴇ* *ᴡɪɴᴋ* *ᴄʀʏ*\n*┋ ⬡ sʜᴀʏᴀʀɪ* *ᴅᴀɴᴄᴇ* *ʜᴀᴘᴘʏ*\n*┋ ⬡ ʙɪᴛᴇ* *ʟɪᴄᴋ* *ʏᴇᴇᴛ* *ɢʟᴏᴍᴘ*\n*┋ ⬡ ᴘᴏᴋᴇ* *ɴᴏᴍ* *ʜɪɢʜғɪᴠᴇ* *ʜᴀɴᴅʜᴏʟᴅ*\n*┋ ⬡ ʙʟᴜsʜ* *ᴄʀɪɴɢᴇ* *sᴍᴜɢ*\n*┋ ⬡ ᴀᴡᴏᴏ* *ᴄᴜᴅᴅʟᴇ* *ʙᴜʟʟʏ*\n*┋ ⬡ ᴋɪʟʟ* *ᴀɴɪᴍᴇɢɪʀʟ1-5*\n*┋ ⬡ ᴄᴏᴍᴘᴀᴛɪʙɪʟɪᴛʏ* *ᴀᴜʀᴀ* *ᴄᴏᴍᴘʟɪᴍᴇɴᴛ*\n*┋ ⬡ ᴇᴍɪx* *ᴘɪᴄᴋᴜᴘ* *ᴄᴀᴋᴇ*\n*┋ ⬡ ᴅᴏɢ* *ᴠᴏᴛɪɴɢ* *ᴇᴍᴏᴊɪ*\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }
        const funRels=['dad','mom','son','daughter','boyfriend','girlfriend','twin','partner','bodyguard','boss','employee','pet','servant','idol','fan','ghost','angel','devil','king','queen','slave','master','genius','fool','rich','poor','bhai','bahan','wife','husband','chacha','chachi','nana','nani','mama','mami','bestfriend','enemy','crush','teacher','student','rival'];
        if(funRels.includes(command)){ let em={dad:'👨',mom:'👩',son:'👦',daughter:'👧',boyfriend:'🧑‍🦱',girlfriend:'👩‍🦳',twin:'👥',partner:'💑',bodyguard:'💂',boss:'👨‍💼',employee:'👷',pet:'🐱',servant:'🧑‍🍳',idol:'🌟',fan:'🤩',ghost:'👻',angel:'😇',devil:'😈',king:'👑',queen:'👸',slave:'🧎',master:'🧙‍♂️',genius:'🧠',fool:'🤪',rich:'💰',poor:'😢',bhai:'🤜🤛',bahan:'👧',wife:'👰',husband:'🤵',chacha:'🧔',chachi:'👩‍🦱',nana:'👴',nani:'👵',mama:'👨',mami:'👩',bestfriend:'🤝',enemy:'🐍',crush:'😍',teacher:'📚',student:'🎒',rival:'⚔️'}; await Ayubreply(`${em[command]||'🔮'} Your *${command}*: _${senderName}'s secret!_`); }
        if(command==='ship'){ let t=m.mentionedJid?.[0]; if(!t) return await Ayubreply('Tag someone!'); let p=Math.floor(Math.random()*101); await Ayubreply(`💘 SHIP\n@${senderNumber} ❤️ @${t.split('@')[0]}\n${'💗'.repeat(Math.floor(p/10))}${'🤍'.repeat(10-Math.floor(p/10))}\n*${p}%*`); }
        if(command==='joke'){ let j=['Why don\'t scientists trust atoms? Because they make up everything!','Why did the scarecrow win an award? He was outstanding in his field!','What do you call a fake noodle? An impasta!']; await Ayubreply(`😂 ${j[Math.floor(Math.random()*j.length)]}`); }
        if(command==='quote'){ try { let r=await axios.get('https://api.quotable.io/random'); await Ayubreply(`📜 _${r.data.content}_\n- ${r.data.author}`); } catch(e){ await Ayubreply('📜 _The best way to predict the future is to create it._ - Abraham Lincoln'); } }
        if(command==='roast'){ let r=['You bring joy—when you leave the room.','If I had a face like yours, I\'d sue my parents.','You\'re proof even Google doesn\'t have all answers.']; await Ayubreply(`🔥 ${r[Math.floor(Math.random()*r.length)]}`); }
        if(command==='hug'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:senderName; await Ayubreply(`🫂 ${senderName} hugs ${t}!\n(っ˘̩╭╮˘̩)っ`); }
        if(command==='kiss'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'you'; await Ayubreply(`💋 ${senderName} kisses ${t}!\n(˘ ³˘)♥`); }
        if(command==='slap'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'someone'; await Ayubreply(`👋 ${senderName} slaps ${t}!`); }
        if(command==='wink') await Ayubreply(`😉 ${senderName} winks! (｡•̀ᴗ-)✧`);
        if(command==='smile') await Ayubreply(`😊 ${senderName} smiles! (◕‿◕✿)`);
        if(command==='cry') await Ayubreply(`😭 ${senderName} cries! (╥﹏╥)`);
        if(command==='dance') await Ayubreply(`💃 ${senderName} dances! ♪┏(・o･)┛♪`);
        if(command==='happy') await Ayubreply(`😊🎉 ${senderName} is HAPPY!`);
        if(command==='flirt') await Ayubreply(`😘 ${senderName} flirts! _Are you a magician? Because whenever I look at you, everyone else disappears!_`);
        if(command==='shayari'){ let s=['Teri baatein sun-ne ko dil chahta hai,\nTeri yaadon mein khoya rehta hai.','Mohabbat nahi hoti humse itni,\nPar teri ik hansi pe qurbaan hain hum.']; await Ayubreply(`📝 ${s[Math.floor(Math.random()*s.length)]}`); }
        if(command==='8ball'){ if(!text) return await Ayubreply('Ask a question!'); let a=['Yes!','No!','Maybe...','Definitely!','Never!','Ask again.']; await Ayubreply(`🎱 Q: ${text}\nA: *${a[Math.floor(Math.random()*a.length)]}*`); }
        if(command==='pat'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'you'; await Ayubreply(`🤚 ${senderName} pats ${t}!`); }
        if(command==='bonk'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'someone'; await Ayubreply(`🔨 ${senderName} bonks ${t}!`); }
        if(command==='wave'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'everyone'; await Ayubreply(`👋 ${senderName} waves at ${t}!`); }
        if(command==='bite'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'someone'; await Ayubreply(`🦷 ${senderName} bites ${t}!`); }
        if(command==='lick'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'someone'; await Ayubreply(`👅 ${senderName} licks ${t}!`); }
        if(command==='yeet'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'someone'; await Ayubreply(`🚀 ${senderName} yeets ${t}!`); }
        if(command==='highfive'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'you'; await Ayubreply(`🖐️ ${senderName} high-fives ${t}!`); }
        if(command==='blush') await Ayubreply(`😊 ${senderName} blushes! (*´ω｀*)`);
        if(command==='cringe') await Ayubreply(`😬 ${senderName} cringes!`);

        // ==================== TOOLS MENU (151 commands) ====================
        if (['tools','toolmenu'].includes(command)) {
            await Ayubreply(`*╭┈───〔 Tools Menu 〕┈───⊷*\n*├▢ 📜 Category:* tools\n*├▢ 🔢 Total Commands:* 151\n*╰───────────────────⊷*\n*『 TOOLS 』*\n╭───────────────────⊷\n*┋ ⬡ ᴄʜᴜᴍɪ* *ʟᴏᴀᴅɪɴɢ* *ᴄᴅ* *ᴡᴛʜʀ*\n*┋ ⬡ ᴛʏᴘᴇ* *sᴘɪɴɴᴇʀ* *ʀᴏᴄᴋᴇᴛ*\n*┋ ⬡ ᴄʟᴏᴄᴋ* *ғɪɴɢ* *ʜᴀᴘᴘʏ* *ʜᴇᴀʀᴛ*\n*┋ ⬡ ᴀɴɢʀʏ* *sᴀᴅ* *sʜʏ* *ᴍᴏᴏɴ*\n*┋ ⬡ ᴄᴏɴғᴜsᴇᴅ* *ɴɪᴋᴀʟ*\n*┋ ⬡ ғᴏɴᴛ-ғᴏɴᴛ105* - Fonts\n*┋ ⬡ sᴛɪᴄᴋᴇʀ* - Make Sticker\n*┋ ⬡ ᴀᴛᴛᴘ* <text> - Text Sticker\n*┋ ⬡ ᴜᴘsᴄᴀʟᴇ1-16* - Upscale\n*┋ ⬡ ᴜɴʙʟᴜʀ* *ʙʟᴜʀғᴀᴄᴇ*\n*┋ ⬡ ʀᴇᴍᴏᴠᴇʙɢ* *ʀᴇᴍᴏᴠᴇʙɢ2*\n*┋ ⬡ ʀᴇᴍɪɴɪ* *ᴇɴʜᴀɴᴄᴇ1-16*\n*┋ ⬡ ᴄᴏʟᴏʀɪᴢᴇ*\n╰───────────────────⊷\n_© 2026 AYUB KHAN_`);
        }
        if(command==='chumi') await Ayubreply(`💋 ${senderName} sends a kiss! (˘ ³˘)♥ CHUMMAAA!`);
        if(command==='loading'){ for(let i=0;i<=100;i+=20){ await Ayubreply(`⏳ ${'█'.repeat(i/10)}${'░'.repeat(10-i/10)} ${i}%`); await new Promise(r=>setTimeout(r,500)); } await Ayubreply('✅ Complete!'); }
        if(command==='clock'){ let d=new Date(); await Ayubreply(`🕐 ${d.toLocaleTimeString()}\n📅 ${d.toDateString()}`); }
        if(command==='heart') await Ayubreply(`💕 ${senderName} sends love!\n❤️💛💚💙💜\n♥(ˆ⌣ˆԅ)`);
        if(command==='happy') await Ayubreply(`😊🎉 ${senderName} is HAPPY!`);
        if(command==='sad') await Ayubreply(`😢💔 ${senderName} is SAD`);
        if(command==='angry') await Ayubreply(`😡🤬 ${senderName} is ANGRY!`);
        if(command==='shy') await Ayubreply(`👉👈 ${senderName} is SHY`);
        if(command==='confused') await Ayubreply(`🤔❓ ${senderName} is CONFUSED`);
        if(command==='attp'){ if(!text) return await Ayubreply(`*Usage:* ${prefix}attp <text>`); try { await conn.sendMessage(m.chat,{video:{url:`https://bk9.fun/maker/attp?text=${encodeURIComponent(text)}`},gifPlayback:true},{quoted:m}); } catch(e){} }

        // ==================== INFO COMMAND ====================
        if (command === 'info') {
            let u=process.uptime();
            await Ayubreply(`🤖 *${settings.botName}*\n👤 ${settings.ownerName}\n📱 +${settings.ownerNumber}\n⏱️ ${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m\n📊 ${Object.keys(global.db.users).length} users\n🔒 Anti-Ban: ON`);
        }
        if (command === 'stats') {
            await Ayubreply(`📊 *Stats*\n👥 Users: ${Object.keys(global.db.users).length}\n👑 Owners: ${global.db.botInfo.owners.length}\n🔨 Banned: ${global.db.botInfo.banned.length}\n🎯 Your Hits: ${global.db.users[m.sender].hitCount}`);
        }

    } catch (e) {
        console.log(chalk.bgRed.white(` [ ERROR ] `) + chalk.redBright(e.message));
    }
};