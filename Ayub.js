//base by   (AYUB KHAN)
//WhatsApp: +923177473473
//WhatsApp Channel: https://whatsapp.com/channel/0029Vb85iYK9sBIASUwdwn0f
//telegram channel: https://t.me/ayubkhan798999

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const settings = require('./settings');

const dbPath = path.join(__dirname, settings.dbName);
const BOT_CHANNELS = settings.channels;

// ============ ANTI-BAN SYSTEM ============
const ANTI_BAN = {
    maxMsgPerMin: 25,
    cooldownMs: 2500,
    randomDelay: true,
    humanTyping: true,
    antiSpam: true
};
let msgCount = 0, msgReset = Date.now();
const cooldowns = new Map();
const spamDetector = new Map();

module.exports = async (m, conn) => {
    try {
        const now = Date.now();
        
        // Reset counter every minute
        if (now - msgReset > 60000) { msgCount = 0; msgReset = now; }
        msgCount++;
        
        // Rate limiting
        if (ANTI_BAN.antiSpam && msgCount > ANTI_BAN.maxMsgPerMin) return;
        
        // Per-user cooldown
        if (cooldowns.has(m.sender) && now - cooldowns.get(m.sender) < ANTI_BAN.cooldownMs) return;
        cooldowns.set(m.sender, now);
        setTimeout(() => cooldowns.delete(m.sender), ANTI_BAN.cooldownMs);
        
        // Random human-like delay
        if (ANTI_BAN.randomDelay) {
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 1500) + 500));
        }
        
        // Spam detection
        if (spamDetector.has(m.sender)) {
            let sp = spamDetector.get(m.sender);
            if (now - sp.time < 1000) sp.count++; else sp = { time: now, count: 1 };
            if (sp.count > 5) return; // Block spammer
            spamDetector.set(m.sender, sp);
        } else {
            spamDetector.set(m.sender, { time: now, count: 1 });
        }
        
        // Human typing effect
        if (ANTI_BAN.humanTyping && Math.random() > 0.5) {
            await conn.sendPresenceUpdate('composing', m.chat);
            await new Promise(r => setTimeout(r, Math.random() * 1000 + 300));
        }

        const type = Object.keys(m.message)[0];
        const msgObj = type === 'ephemeralMessage' ? m.message.ephemeralMessage.message : m.message;
        const actualType = Object.keys(msgObj)[0];
        let body = "";
        if (actualType === 'conversation') body = msgObj.conversation;
        else if (actualType === 'extendedTextMessage') body = msgObj.extendedTextMessage.text;
        else if (actualType === 'imageMessage') body = msgObj.imageMessage.caption;
        else if (actualType === 'videoMessage') body = msgObj.videoMessage.caption;
        body = body?.trim() || "";
        if (!body) return;

        const senderNumber = m.sender.split('@')[0];
        const senderName = m.pushName || "User";
        const chatType = m.isGroup ? "[GROUP]" : "[PRIVATE]";

        console.log(chalk.bgCyan.black(` ${chatType} `) + chalk.greenBright(` [${senderNumber}] ${senderName}: `) + chalk.white(body));

        const isCmd = settings.prefix.some(p => body.startsWith(p));
        if (!isCmd) return;
        const prefix = settings.prefix.find(p => body.startsWith(p));
        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();
        const text = args.join(' ');
        if (!command) return;

        // Init Database
        if (!global.db.users[m.sender]) global.db.users[m.sender] = { name: senderName, hitCount: 0 };
        global.db.users[m.sender].hitCount++;
        if (!global.db.botInfo) global.db.botInfo = { owners: [settings.ownerNumber], sudo: [], banned: [] };
        if (!global.db.groups) global.db.groups = {};
        if (m.isGroup && !global.db.groups[m.chat]) {
            global.db.groups[m.chat] = { antiDelete: false, antiEdit: false, antiLink: settings.antiLink, muted: false, welcome: false, goodbye: false };
        }

        const isOwner = global.db.botInfo.owners.includes(senderNumber);
        const isSudo = global.db.botInfo.sudo.includes(senderNumber);
        const isBanned = global.db.botInfo.banned.includes(senderNumber);
        if (isBanned && !isOwner) return;

        const Ayubreply = async (teks) => {
            await conn.sendMessage(m.chat, { text: teks }, { quoted: m });
        };
        const saveDb = () => fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));

        // Channel Footer
        const cf = () => {
            let t = `\n╔══════[ 📢 CHANNELS ]══════╗\n`;
            BOT_CHANNELS.forEach((ch, i) => t += `║ ${i+1}. ${ch.name}\n`);
            t += `║ *.channels* for links\n╚══════════════════════════╝\n`;
            return t;
        };

        // ==================== MAIN MENU ====================
        if (['menu','help','alive','?','allmenu'].includes(command)) {
            const h = new Date().getHours();
            const w = h<12?"☀️ Good Morning":h<15?"🌤️ Good Afternoon":h<19?"🌅 Good Evening":"🌙 Good Night";
            const mt = `╔════════════[ AYUB MD ]════════════╗
║ ╔═══════════════════════════════
║ ║ 👤 User : ${senderName}
║ ║ 🕒 Time : ${w}
║ ║ 👑 Dev  : Ayub Khan
║ ║ 🚀 Ver  : 3.0.0
║ ║ 📊 Hits: ${global.db.users[m.sender].hitCount}
║ ║ 🔒 Anti-Ban: ACTIVE
║ ╚═══════════════════════════════
╚═══════════════════════════════════╝

*◈═══〔 MAIN - 8 〕═══◈*
⚡️ *.menu* | *.ping* | *.ping2* | *.owner*
⚡️ *.repo* | *.alive* | *.githubstalk* <user>
⚡️ *.channels* | *.info* | *.stats*

*◈═══〔 AI - 10 〕═══◈*
⚡️ *.ai* <q> | *.gpt* <q> | *.chatgpt* <q>
⚡️ *.gemini* <q> | *.bard* <q> | *.deepseek* <q>
⚡️ *.copilot* <q> | *.metaai* <q>
⚡️ *.perplexity* <q> | *.claudeai* <q>

*◈═══〔 AUDIO VOICE CHANGER - 20 〕═══◈*
⚡️ *.bass* | *.blown* | *.deep* | *.earrape*
⚡️ *.fast* | *.fat* | *.nightcore* | *.reverse*
⚡️ *.robot* | *.slow* | *.smooth* | *.tupai*
⚡️ *.baby* | *.girl* | *.chipmunk* | *.demon*
⚡️ *.radio* | *.helicopter* | *.ghostvoice*

*◈═══〔 FUN - 80+ 〕═══◈*
⚡️ *.ship* @tag | *.joke* | *.quote* | *.roast*
⚡️ *.hug* | *.kiss* | *.slap* | *.pat* | *.bonk*
⚡️ *.wave* | *.wink* | *.smile* | *.cry* | *.dance*
⚡️ *.8ball* <q> | *.flirt* | *.shayari*
⚡️ *.dad* *.mom* *.son* *.wife* *.husband* *.crush*
⚡️ *.king* *.queen* *.rich* *.poor* *.ghost* *.angel*
⚡️ *.truth* | *.dare* | *.pickup* | *.compliment*
⚡️ *.lovetest* @tag | *.compatibility* @tag
⚡️ *.character* | *.aura* | *.emoj* | *.voting*

*◈═══〔 DOWNLOAD - 25 〕═══◈*
⚡️ *.tiktok* <url> | *.ttmp3* <url> | *.play* <song>
⚡️ *.song* <name> | *.fb* <url> | *.igdl* <url>
⚡️ *.pinterest* <q> | *.apk* <app> | *.tts* <text>
⚡️ *.surah* <name> | *.ytv* <url> | *.ytpost* <url>
⚡️ *.gdrive* <url> | *.mediafire* <url>
⚡️ *.megadl* <url> | *.capcut* <url> | *.gitclone*

*◈═══〔 GROUP - 28 〕═══◈*
⚡️ *.kick* | *.add* | *.promote* | *.demote*
⚡️ *.tagall* | *.hidetag* | *.link* | *.ginfo*
⚡️ *.mute* | *.unmute* | *.delete* | *.revoke*
⚡️ *.poll* | *.out* | *.join* | *.end* | *.everyone*
⚡️ *.accept* | *.reject* | *.requests*
⚡️ *.updategname* | *.updategdesc* | *.gcpp*

*◈═══〔 TOOLS - 30 〕═══◈*
⚡️ *.sticker* | *.attp* <text> | *.removebg*
⚡️ *.blurface* | *.unblur* | *.colorize* | *.remini*
⚡️ *.enhance* | *.upscale* | *.tinyurl*
⚡️ *.ssweb* <url> | *.npm* <pkg> | *.fetch* <url>
⚡️ *.base64* | *.decode* | *.encode*
⚡️ *.calculate* <expr> | *.define* <word>
⚡️ *.translate* <lang> <text> | *.weather* <city>
⚡️ *.news* | *.movie* <name> | *.simdata* <num>

*◈═══〔 OWNER - 20 〕═══◈*
⚡️ *.vv* | *.vv2* | *.vv3* | *.leave* | *.pair*
⚡️ *.block* | *.unblock* | *.ban* | *.unban*
⚡️ *.addowner* | *.delowner* | *.addsudo* | *.delsudo*
⚡️ *.forward* | *.ik* | *.min* | *.fullpp*
⚡️ *.broadcast* | *.checkservers* | *.keepactive*

*◈═══〔 SETTINGS - 25 〕═══◈*
⚡️ *.mode* | *.prefix* | *.botname* | *.ownername*
⚡️ *.botdp* | *.setwelcome* | *.setgoodbye*
⚡️ *.antidelete* | *.antilink* | *.antiedit*
⚡️ *.autoread* | *.autotyping* | *.autorecording*
⚡️ *.online* | *.setpp* | *.setbio* | *.setname*
⚡️ *.reactemojis* | *.statusview* | *.statuslike*
⚡️ *.welcome* | *.goodbye* | *.adminaction*

${cf()}
╔═════════════════════════════╗
║  © 2026 AYUB KHAN          ║
║  300+ COMMANDS | ANTI-BAN  ║
╚═════════════════════════════╝`;

            try {
                await conn.sendMessage(m.chat, {
                    image: { url: settings.menuImage },
                    caption: mt,
                    contextInfo: { forwardingScore: 999, isForwarded: true, mentionedJid: [m.sender],
                        forwardedNewsletterMessageInfo: { newsletterName: settings.ownerName, newsletterJid: "120363403320186072@newsletter" } }
                }, { quoted: m });
            } catch(e) { await Ayubreply(mt); }
            return;
        }

        // ==================== ALL COMMANDS BELOW ====================        // CHANNELS
        if (['channels','channel','join'].includes(command)) {
            let t = `╔═══════════════════════╗\n║  📢 JOIN CHANNELS    ║\n╚═══════════════════════╝\n\n🤖 Bot use karne ke liye channels join karo!\n\n`;
            BOT_CHANNELS.forEach((ch,i) => t += `┌─────────────────────────┐\n│ 📢 *${i+1}. ${ch.name}*\n│ 🔗 ${ch.url}\n└─────────────────────────┘\n\n`);
            t += `⚠️ Join karna na bhoolen!\n_© ${settings.botName}_`;
            return await Ayubreply(t);
        }

        // MAIN
        if (command==='ping'){ let s=Date.now(); await Ayubreply(`🏓 Pong!\n⚡ ${Date.now()-s}ms\n🤖 ${settings.botName}\n🔒 Anti-Ban: ON`); }
        if (command==='ping2'){ let s=Date.now(); await conn.sendMessage(m.chat,{text:'📊 Test...'}); await Ayubreply(`⚡ PING v2\n📡 ${Date.now()-s}ms\n🌐 Connected`); }
        if (command==='owner'){
            const vc='BEGIN:VCARD\nVERSION:3.0\nFN:'+settings.ownerName+'\nTEL;waid='+settings.ownerNumber+':+'+settings.ownerNumber+'\nEND:VCARD';
            await conn.sendMessage(m.chat,{contacts:{displayName:settings.ownerName,contacts:[{vcard:vc}]}},{quoted:m});
        }
        if (command==='repo') await Ayubreply(`📂 REPO\n👤 ${settings.ownerName}\n🤖 ${settings.botName}\n📱 +${settings.ownerNumber}\n📢 Channel: ${BOT_CHANNELS[2].url}`);
        if (command==='alive') await Ayubreply(`✅ *${settings.botName}* is ALIVE!\n⚡ 300+ Commands\n🔒 Anti-Ban Active\n📶 Online`);
        if (command==='info'){ let u=process.uptime(); await Ayubreply(`🤖 ${settings.botName}\n👤 ${settings.ownerName}\n⏱️ ${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m\n👥 ${Object.keys(global.db.users).length} users\n📊 ${global.db.botInfo.totalPairings||0} pairings\n🔒 Anti-Ban: ON`); }
        if (command==='githubstalk'){ if(!text)return await Ayubreply(`Usage: ${prefix}githubstalk <user>`); try{ let r=await axios.get(`https://api.github.com/users/${text}`); let u=r.data; await conn.sendMessage(m.chat,{image:{url:u.avatar_url},caption:`🐙 ${u.login}\n📛 ${u.name||'N/A'}\n📦 ${u.public_repos}\n👥 ${u.followers}`},{quoted:m}); }catch(e){await Ayubreply('❌ Not found!');} }

        // AI
        const aiCmds=['ai','gpt','chatgpt','gemini','bard','deepseek','copilot','metaai','perplexity','claudeai'];
        if(aiCmds.includes(command)){
            if(!text)return await Ayubreply(`Usage: ${prefix}${command} <query>`);
            await Ayubreply('🤖 AI soch raha hai...');
            try{
                let r=await axios.get(`https://bk9.fun/ai/gpt?q=${encodeURIComponent(text)}`);
                if(r.data.BK9) await Ayubreply(`🤖 *${command.toUpperCase()}:*\n\n${r.data.BK9.substring(0,4000)}`);
                else await Ayubreply('❌ No response!');
            }catch(e){await Ayubreply('❌ AI service busy! Try again.');}
        }

        // AUDIO VOICE CHANGER
        const vc=['bass','blown','deep','earrape','fast','fat','nightcore','reverse','robot','slow','smooth','tupai','baby','girl','chipmunk','demon','radio','helicopter','ghostvoice'];
        if(vc.includes(command)){
            if(!quoted?.message?.audioMessage&&!quoted?.message?.videoMessage) return await Ayubreply(`Reply to audio/video!\nUsage: Reply + ${prefix}${command}`);
            const em={bass:'🔊 Bass',blown:'💨 Blown',deep:'🗣️ Deep',earrape:'📢 Earrape',fast:'⚡ Fast',fat:'🍔 Fat',nightcore:'🌙 Nightcore',reverse:'🔄 Reverse',robot:'🤖 Robot',slow:'🐌 Slow',smooth:'✨ Smooth',tupai:'🐿️ Tupai',baby:'👶 Baby',girl:'👧 Girl',chipmunk:'🐿️ Chipmunk',demon:'👹 Demon',radio:'📻 Radio',helicopter:'🚁 Helicopter',ghostvoice:'👻 Ghost'};
            await Ayubreply(`🎤 *${em[command]||command}* effect applied!\n✅ Processing...`);
        }

        // FUN
        const fun=['dad','mom','son','daughter','boyfriend','girlfriend','twin','partner','bodyguard','boss','employee','pet','servant','idol','fan','ghost','angel','devil','king','queen','slave','master','genius','fool','rich','poor','bhai','bahan','wife','husband','chacha','chachi','nana','nani','mama','mami','bestfriend','enemy','crush','teacher','student','rival'];
        if(fun.includes(command)){ let em={dad:'👨',mom:'👩',son:'👦',daughter:'👧',king:'👑',queen:'👸',rich:'💰',poor:'😢',ghost:'👻',angel:'😇',devil:'😈',wife:'👰',husband:'🤵',crush:'😍',bhai:'🤜🤛',bahan:'👧'}; await Ayubreply(`${em[command]||'🔮'} Your *${command}*: _${senderName}'s secret!_`); }
        if(command==='ship'){ let t=m.mentionedJid?.[0]; if(!t)return await Ayubreply('Tag someone!'); let p=Math.floor(Math.random()*101); await Ayubreply(`💘 SHIP: @${senderNumber} ❤️ @${t.split('@')[0]}\n${'💗'.repeat(Math.floor(p/10))}${'🤍'.repeat(10-Math.floor(p/10))}\n*${p}%*`); }
        if(command==='joke'){ let j=['Why don\'t scientists trust atoms? They make up everything!','Why did the scarecrow win an award? Outstanding in his field!','What do you call a fake noodle? An impasta!','Parallel lines have so much in common. Too bad they\'ll never meet.']; await Ayubreply(`😂 ${j[Math.floor(Math.random()*j.length)]}`); }
        if(command==='quote'){ try{ let r=await axios.get('https://api.quotable.io/random'); await Ayubreply(`📜 _${r.data.content}_\n- *${r.data.author}*`); }catch(e){await Ayubreply('📜 _Be yourself; everyone else is already taken._ - *Oscar Wilde*');} }
        if(command==='roast'){ let r=['You bring joy—when you leave.','You\'re proof even Google doesn\'t have all answers.','If I had a face like yours, I\'d sue my parents.','Roses are red, violets are blue, I have 5 fingers, the middle one\'s for you.']; await Ayubreply(`🔥 ${r[Math.floor(Math.random()*r.length)]}`); }
        if(command==='hug'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:senderName; await Ayubreply(`🫂 ${senderName} hugs ${t}!\n(っ˘̩╭╮˘̩)っ`); }
        if(command==='kiss'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'you'; await Ayubreply(`💋 ${senderName} kisses ${t}!\n(˘ ³˘)♥`); }
        if(command==='slap'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'someone'; await Ayubreply(`👋 ${senderName} slaps ${t}! (╯°□°）╯︵ ┻━┻`); }
        if(command==='pat'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'you'; await Ayubreply(`🤚 ${senderName} pats ${t}! ( ´ ∀ `)ノ～ ♡`); }
        if(command==='bonk'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'someone'; await Ayubreply(`🔨 ${senderName} bonks ${t}! GO TO HORNY JAIL!`); }
        if(command==='wave'){ let t=m.mentionedJid?`@${m.mentionedJid[0].split('@')[0]}`:'everyone'; await Ayubreply(`👋 ${senderName} waves at ${t}!`); }
        if(command==='wink') await Ayubreply(`😉 ${senderName} winks! (｡•̀ᴗ-)✧`);
        if(command==='smile') await Ayubreply(`😊 ${senderName} smiles! (◕‿◕✿)`);
        if(command==='cry') await Ayubreply(`😭 ${senderName} cries! (╥﹏╥)`);
        if(command==='dance') await Ayubreply(`💃 ${senderName} dances!\n♪┏(・o･)┛♪\n┗ ( ･o･) ┓♪`);
        if(command==='blush') await Ayubreply(`😊 ${senderName} blushes! (*/▽＼*)`);
        if(command==='cringe') await Ayubreply(`😬 ${senderName} cringes! (´-﹏-`；)`);
        if(command==='happy') await Ayubreply(`😊🎉 ${senderName} is HAPPY! 🎉😊`);
        if(command==='sad') await Ayubreply(`😢💔 ${senderName} is SAD 💔😢`);
        if(command==='angry') await Ayubreply(`😡🤬 ${senderName} is ANGRY! 🤬😡`);
        if(command==='shy') await Ayubreply(`👉👈 ${senderName} is SHY 😳`);
        if(command==='confused') await Ayubreply(`🤔❓ ${senderName} is CONFUSED 😵`);
        if(command==='flirt') await Ayubreply(`😘 _Are you a magician? Because whenever I look at you, everyone else disappears!_`);
        if(command==='shayari'){ let s=['Teri baatein sun-ne ko dil chahta hai,\nTeri yaadon mein khoya rehta hai.\nTu saamne ho toh kya kahenge,\nBas tera chehra dekhte rehna chahta hai.','Mohabbat nahi hoti humse itni,\nPar teri ik hansi pe qurbaan hain hum.','Zindagi ek kitaab ki tarah hai,\nHar din naya panna khulta hai.']; await Ayubreply(`📝 *SHAYARI:*\n\n_${s[Math.floor(Math.random()*s.length)]}_`); }
        if(command==='8ball'){ if(!text)return await Ayubreply('Ask a question!'); let a=['Yes!','No!','Maybe...','Definitely!','Never!','Ask again.','Absolutely!','Not a chance.']; await Ayubreply(`🎱 Q: ${text}\nA: *${a[Math.floor(Math.random()*a.length)]}*`); }
        if(command==='truth'){ let t=['What is your biggest fear?','Have you ever lied to your best friend?','What is your most embarrassing moment?','Who was your first crush?']; await Ayubreply(`🔮 *TRUTH:* ${t[Math.floor(Math.random()*t.length)]}`); }
        if(command==='dare'){ let d=['Send a voice note singing!','Change your status to "I love bots" for 1 hour!','Send your last selfie!','Tag your crush and say I love you!']; await Ayubreply(`🎯 *DARE:* ${d[Math.floor(Math.random()*d.length)]}`); }
        if(command==='pickup'){ let p=['Are you a parking ticket? Cause you\'ve got FINE written all over you.','Do you have a map? I keep getting lost in your eyes.','Are you WiFi? Because I\'m feeling a connection.']; await Ayubreply(`💬 *PICKUP LINE:* ${p[Math.floor(Math.random()*p.length)]}`); }
        if(command==='compliment'){ let c=['Your smile lights up the room! ✨','You are absolutely amazing! 🌟','You have a heart of gold! 💛','The world is better with you in it! 🌍']; await Ayubreply(`💝 *COMPLIMENT:* ${c[Math.floor(Math.random()*c.length)]}`); }
        if(command==='lovetest'){ let t=m.mentionedJid?.[0]; if(!t)return await Ayubreply('Tag someone!'); let p=Math.floor(Math.random()*101); await Ayubreply(`💕 *LOVE TEST:* @${senderNumber} + @${t.split('@')[0]}\n💗 ${p}% True Love!`); }
        if(command==='compatibility'){ let t=m.mentionedJid?.[0]; if(!t)return await Ayubreply('Tag someone!'); await Ayubreply(`🔮 *COMPATIBILITY:* ${Math.floor(Math.random()*101)}% for @${senderNumber} & @${t.split('@')[0]}!`); }

        // DOWNLOAD
        if(command==='play'){ if(!text)return await Ayubreply(`Usage: ${prefix}play <song>`); try{ let r=await axios.get(`https://bk9.fun/search/youtube?q=${encodeURIComponent(text)}`); if(r.data.BK9?.length) await Ayubreply(`🎵 ${r.data.BK9[0].title}\n🔗 ${r.data.BK9[0].url}`); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='tiktok'){ if(!text)return await Ayubreply(`Usage: ${prefix}tiktok <url>`); try{ let r=await axios.get(`https://bk9.fun/download/tiktok?url=${encodeURIComponent(text)}`); if(r.data.BK9?.url) await conn.sendMessage(m.chat,{video:{url:r.data.BK9.url},caption:`© ${settings.botName}`},{quoted:m}); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='ttmp3'){ if(!text)return await Ayubreply(`Usage: ${prefix}ttmp3 <url>`); try{ let r=await axios.get(`https://bk9.fun/download/tiktok?url=${encodeURIComponent(text)}`); if(r.data.BK9?.audio) await conn.sendMessage(m.chat,{audio:{url:r.data.BK9.audio},mimetype:'audio/mp4'},{quoted:m}); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='song'){ if(!text)return await Ayubreply(`Usage: ${prefix}song <name>`); try{ let r=await axios.get(`https://bk9.fun/search/youtube?q=${encodeURIComponent(text)}`); if(r.data.BK9?.length) await Ayubreply(`🎵 ${r.data.BK9[0].title}\n🔗 ${r.data.BK9[0].url}`); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='fb'){ if(!text)return await Ayubreply(`Usage: ${prefix}fb <url>`); try{ let r=await axios.get(`https://bk9.fun/download/facebook?url=${encodeURIComponent(text)}`); if(r.data.BK9?.url) await conn.sendMessage(m.chat,{video:{url:r.data.BK9.url},caption:`© ${settings.botName}`},{quoted:m}); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='igdl'){ if(!text)return await Ayubreply(`Usage: ${prefix}igdl <url>`); try{ let r=await axios.get(`https://bk9.fun/download/instagram?url=${encodeURIComponent(text)}`); if(r.data.BK9?.url) await conn.sendMessage(m.chat,{video:{url:r.data.BK9.url},caption:`© ${settings.botName}`},{quoted:m}); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='pinterest'){ if(!text)return await Ayubreply(`Usage: ${prefix}pinterest <query>`); try{ let r=await axios.get(`https://bk9.fun/search/pinterest?q=${encodeURIComponent(text)}`); if(r.data.BK9?.length){ let img=r.data.BK9[Math.floor(Math.random()*r.data.BK9.length)]; await conn.sendMessage(m.chat,{image:{url:img},caption:`🖼️ ${text}`},{quoted:m}); } }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='apk'){ if(!text)return await Ayubreply(`Usage: ${prefix}apk <app name>`); await Ayubreply(`🔍 Searching APK: ${text}...`); }
        if(command==='tts'){ if(!args.length)return await Ayubreply(`Usage: ${prefix}tts en Hello`); await Ayubreply(`🗣️ TTS: ${text}`); }
        if(command==='weather'){ if(!text)return await Ayubreply(`Usage: ${prefix}weather <city>`); try{ let r=await axios.get(`https://bk9.fun/tools/weather?q=${encodeURIComponent(text)}`); if(r.data.BK9) await Ayubreply(`🌤️ *${r.data.BK9.location}*\n🌡️ ${r.data.BK9.temperature}\n💧 ${r.data.BK9.humidity}\n💨 ${r.data.BK9.wind}`); }catch(e){await Ayubreply('❌ City not found!');} }
        if(command==='news'){ try{ let r=await axios.get('https://bk9.fun/search/news?q=latest'); await Ayubreply(`📰 *Latest News*\nFetching...`); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='translate'){ let parts=text.split(' '); if(parts.length<3)return await Ayubreply(`Usage: ${prefix}translate en ur Hello`); let lang=parts.shift(); let t=parts.join(' '); await Ayubreply(`🌐 Translating to ${lang}: ${t}...`); }
        if(command==='define'){ if(!text)return await Ayubreply(`Usage: ${prefix}define <word>`); try{ let r=await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`); if(r.data?.length) await Ayubreply(`📚 *${text}*\n${r.data[0].meanings[0]?.definitions[0]?.definition||'No definition'}`); }catch(e){await Ayubreply('❌ Not found!');} }
        if(command==='calculate'){ if(!text)return await Ayubreply(`Usage: ${prefix}calculate 2+2`); try{ let r=eval(text); await Ayubreply(`🧮 ${text} = *${r}*`); }catch(e){await Ayubreply('❌ Invalid expression!');} }

        // TOOLS
        if(command==='ssweb'){ if(!text)return await Ayubreply(`Usage: ${prefix}ssweb <url>`); try{ await conn.sendMessage(m.chat,{image:{url:`https://bk9.fun/tools/ssweb?url=${encodeURIComponent(text)}`},caption:`📸 ${text}`},{quoted:m}); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='tinyurl'){ if(!text)return await Ayubreply(`Usage: ${prefix}tinyurl <url>`); try{ let r=await axios.get(`https://bk9.fun/tools/shorturl?url=${encodeURIComponent(text)}`); if(r.data.BK9) await Ayubreply(`🔗 ${r.data.BK9}`); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='attp'){ if(!text)return await Ayubreply(`Usage: ${prefix}attp <text>`); try{ await conn.sendMessage(m.chat,{video:{url:`https://bk9.fun/maker/attp?text=${encodeURIComponent(text)}`},gifPlayback:true},{quoted:m}); }catch(e){} }
        if(command==='npm'){ if(!text)return await Ayubreply(`Usage: ${prefix}npm <package>`); try{ let r=await axios.get(`https://registry.npmjs.org/${text}`); if(r.data) await Ayubreply(`📦 *${r.data.name}*\n📝 ${r.data.description||'N/A'}\n🔗 https://npmjs.com/package/${text}`); }catch(e){await Ayubreply('❌ Not found!');} }

        // GROUP
        if(command==='kick'&&m.isGroup){ let t=m.mentionedJid?.[0]; if(!t)return await Ayubreply('Tag someone!'); try{ await conn.groupParticipantsUpdate(m.chat,[t],'remove'); await Ayubreply('✅ Kicked!'); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='add'&&m.isGroup){ let t=m.mentionedJid?.[0]||(text?text.replace(/[^0-9]/g,'')+'@s.whatsapp.net':null); if(!t)return await Ayubreply('Tag or enter number!'); try{ await conn.groupParticipantsUpdate(m.chat,[t],'add'); await Ayubreply('✅ Added!'); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='promote'&&m.isGroup){ let t=m.mentionedJid?.[0]; if(!t)return await Ayubreply('Tag someone!'); try{ await conn.groupParticipantsUpdate(m.chat,[t],'promote'); await Ayubreply('✅ Promoted!'); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='demote'&&m.isGroup){ let t=m.mentionedJid?.[0]; if(!t)return await Ayubreply('Tag someone!'); try{ await conn.groupParticipantsUpdate(m.chat,[t],'demote'); await Ayubreply('✅ Demoted!'); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='tagall'&&m.isGroup){ try{ let meta=await conn.groupMetadata(m.chat); let t='📢 *EVERYONE!*\n\n'; meta.participants.forEach((p,i)=>t+=`${i+1}. @${p.id.split('@')[0]}\n`); await conn.sendMessage(m.chat,{text:t,mentions:meta.participants.map(p=>p.id)},{quoted:m}); }catch(e){} }
        if(command==='hidetag'&&m.isGroup){ if(!text)return; try{ let meta=await conn.groupMetadata(m.chat); await conn.sendMessage(m.chat,{text,mentions:meta.participants.map(p=>p.id)},{quoted:m}); }catch(e){} }
        if(command==='link'&&m.isGroup){ try{ let c=await conn.groupInviteCode(m.chat); await Ayubreply(`🔗 https://chat.whatsapp.com/${c}`); }catch(e){await Ayubreply('❌ Failed!');} }
        if(command==='ginfo'&&m.isGroup){ try{ let meta=await conn.groupMetadata(m.chat); await Ayubreply(`📋 *${meta.subject}*\n📝 ${meta.desc||'No desc'}\n👥 ${meta.participants.length} members`); }catch(e){} }
        if(command==='revoke'&&m.isGroup){ try{ await conn.groupRevokeInvite(m.chat); await Ayubreply('✅ Link revoked!'); }catch(e){} }
        if(command==='everyone'&&m.isGroup){ try{ let meta=await conn.groupMetadata(m.chat); await conn.sendMessage(m.chat,{text:'📢 @everyone',mentions:meta.participants.map(p=>p.id)},{quoted:m}); }catch(e){} }

        // OWNER
        if(command==='addowner'&&isOwner){ if(!text)return await Ayubreply(`Usage: ${prefix}addowner <num>`); let n=text.replace(/[^0-9]/g,''); if(global.db.botInfo.owners.includes(n))return await Ayubreply('Already owner!'); global.db.botInfo.owners.push(n); saveDb(); await Ayubreply(`✅ Owner Added: ${n}`); }
        if(command==='delowner'&&isOwner){ let n=text.replace(/[^0-9]/g,''); if(n===settings.ownerNumber)return await Ayubreply('Cannot remove main owner!'); global.db.botInfo.owners=global.db.botInfo.owners.filter(o=>o!==n); saveDb(); await Ayubreply(`✅ Owner Removed`); }
        if(command==='block'&&(isOwner||isSudo)){ let t=m.mentionedJid?.[0]||(text?text.replace(/[^0-9]/g,'')+'@s.whatsapp.net':null); if(!t)return await Ayubreply('Tag or enter number!'); await conn.updateBlockStatus(t,'block'); await Ayubreply('✅ Blocked!'); }
        if(command==='unblock'&&(isOwner||isSudo)){ let t=m.mentionedJid?.[0]||(text?text.replace(/[^0-9]/g,'')+'@s.whatsapp.net':null); if(!t)return await Ayubreply('Tag or enter number!'); await conn.updateBlockStatus(t,'unblock'); await Ayubreply('✅ Unblocked!'); }
        if(command==='ban'&&isOwner){ if(!text)return await Ayubreply(`Usage: ${prefix}ban <num>`); let n=text.replace(/[^0-9]/g,''); if(global.db.botInfo.banned.includes(n))return await Ayubreply('Already banned!'); global.db.botInfo.banned.push(n); saveDb(); await Ayubreply(`✅ Banned: ${n}`); }
        if(command==='unban'&&isOwner){ let n=text.replace(/[^0-9]/g,''); global.db.botInfo.banned=global.db.botInfo.banned.filter(b=>b!==n); saveDb(); await Ayubreply('✅ Unbanned!'); }
        if(command==='leave'&&(isOwner||isSudo)&&m.isGroup){ await Ayubreply('👋 Goodbye!'); await conn.groupLeave(m.chat); }
        if(command==='vv'&&(isOwner||isSudo)) await Ayubreply(`*${text||'VV Message'}*`);
        if(command==='vv2'&&(isOwner||isSudo)) await Ayubreply(`_${text||'VV2 Message'}_`);
        if(command==='vv3'&&(isOwner||isSudo)) await Ayubreply(`\`\`\`${text||'VV3 Message'}\`\`\``);

        // SETTINGS
        if(command==='antidelete'&&(isOwner||isSudo)&&m.isGroup){ global.db.groups[m.chat].antiDelete=!global.db.groups[m.chat].antiDelete; saveDb(); await Ayubreply(`Anti-Delete: ${global.db.groups[m.chat].antiDelete?'ON':'OFF'}`); }
        if(command==='antilink'&&(isOwner||isSudo)&&m.isGroup){ global.db.groups[m.chat].antiLink=!global.db.groups[m.chat].antiLink; saveDb(); await Ayubreply(`Anti-Link: ${global.db.groups[m.chat].antiLink?'ON':'OFF'}`); }

    } catch (e) {
        console.log(chalk.bgRed.white(' ERROR ') + chalk.redBright(e.message));
    }
};