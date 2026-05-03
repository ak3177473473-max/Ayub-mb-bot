//base by   (AYUB KHAN)
//WhatsApp: +923177473473
//WhatsApp Channel: https://whatsapp.com/channel/0029Vb85iYK9sBIASUwdwn0f
//telegram channel: https://t.me/ayubkhan798999

const fs = require('fs');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
const express = require('express');
const { Boom } = require('@hapi/boom');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');

const settings = require('./settings');
const AyubHandler = require('./Ayub');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, settings.dbName);
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: {}, groups: {}, botInfo: { owners: [settings.ownerNumber], sudo: [], banned: [], totalPairings: 0 } }));
}
global.db = JSON.parse(fs.readFileSync(dbPath));
setInterval(() => fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2)), 30 * 1000);

function checkSessionExists() {
    const sessionPath = path.join(__dirname, 'auth');
    if (!fs.existsSync(sessionPath)) return false;
    return fs.readdirSync(sessionPath).some(file => file.includes('creds.json'));
}

// ========== WEB PAIRING PAGE ==========
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ayub Khan - WhatsApp Pairing</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0a; color: #fff; font-family: Arial; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .container { background: #1a1a1a; padding: 30px; border-radius: 15px; text-align: center; max-width: 450px; width: 90%; border: 2px solid #00ff88; }
        h1 { color: #00ff88; margin-bottom: 10px; }
        .channel { background: #222; padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 12px; }
        .channel a { color: #00ff88; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #333; border-radius: 8px; background: #0a0a0a; color: #fff; font-size: 16px; }
        button { width: 100%; padding: 12px; background: #00ff88; color: #000; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; }
        button:hover { background: #00cc66; }
        #result { margin-top: 15px; padding: 15px; background: #111; border-radius: 8px; display: none; }
        #code { font-size: 28px; font-weight: bold; color: #00ff88; letter-spacing: 3px; }
        .steps { text-align: left; margin-top: 10px; font-size: 13px; color: #ccc; }
        .footer { margin-top: 15px; font-size: 11px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AYUB KHAN BOT</h1>
        <p>WhatsApp Multi-Device Pairing</p>
        <div class="channel">
            📢 <a href="https://whatsapp.com/channel/0029Vb85iYK9sBIASUwdwn0f" target="_blank">Join WhatsApp Channel</a>
        </div>
        <input type="text" id="number" placeholder="Enter WhatsApp Number (e.g., 923001234567)" />
        <button onclick="getPairingCode()">GET PAIRING CODE</button>
        <div id="result">
            <p>🔑 YOUR PAIRING CODE:</p>
            <div id="code">----</div>
            <div class="steps">
                <p>📱 <b>Steps:</b></p>
                <p>1️⃣ Open WhatsApp</p>
                <p>2️⃣ Linked Devices → Link a Device</p>
                <p>3️⃣ Link with phone number instead</p>
                <p>4️⃣ Enter code above</p>
            </div>
        </div>
        <div class="footer">© 2026 Ayub Khan | +923177473473</div>
    </div>
    <script>
        async function getPairingCode() {
            const number = document.getElementById('number').value.trim();
            if (!number) return alert('Please enter a number!');
            const res = await fetch('/pair?number=' + number);
            const data = await res.json();
            document.getElementById('result').style.display = 'block';
            if (data.success) {
                document.getElementById('code').textContent = data.code;
            } else {
                document.getElementById('code').textContent = 'ERROR';
            }
        }
    </script>
</body>
</html>
    `);
});

// ========== PAIRING API ==========
app.get('/pair', async (req, res) => {
    const number = req.query.number?.replace(/[^0-9]/g, '');
    if (!number || number.length < 10) return res.json({ success: false, message: 'Invalid number' });
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./sessions/pair_${number}`);
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            version,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            logger: pino({ level: 'silent' })
        });
        
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(number);
                if (code) {
                    global.db.botInfo.totalPairings = (global.db.botInfo.totalPairings || 0) + 1;
                    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                    res.json({ success: true, code: formatted });
                } else {
                    res.json({ success: false, message: 'Failed to generate code' });
                }
            } catch (e) {
                res.json({ success: false, message: e.message });
            }
            setTimeout(() => sock.end(), 60000);
        }, 3000);
        
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// ========== START BOT ==========
async function startBot() {
    console.clear();
    console.log(chalk.cyanBright.bold('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyanBright.bold(`║      🤖 ${settings.botName.toUpperCase()}      ║`));
    console.log(chalk.cyanBright.bold('║      👑 BY AYUB KHAN                ║'));
    console.log(chalk.cyanBright.bold('║      300+ COMMANDS                   ║'));
    console.log(chalk.cyanBright.bold('║      ANTI-BAN PROTECTED              ║'));
    console.log(chalk.cyanBright.bold('╚══════════════════════════════════════╝\n'));

    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();
    const hasSession = checkSessionExists();
    let phoneNumber = settings.ownerNumber;

    if (hasSession) {
        console.log(chalk.greenBright('✅ Session Found! Auto connecting...'));
    } else {
        console.log(chalk.yellowBright('⚠️ Using owner number for pairing...'));
    }

    const conn = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({ level: 'silent' }),
        generateHighQualityLinkPreview: true
    });

    conn.ev.on('creds.update', saveCreds);
    let pairingDone = false;

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (!conn.authState.creds.registered && !hasSession && connection === 'connecting' && !pairingDone && phoneNumber) {
            setTimeout(async () => {
                try {
                    pairingDone = true;
                    const code = await conn.requestPairingCode(phoneNumber);
                    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                    console.log(chalk.black.bgYellowBright.bold(`\n 🔑 PAIRING CODE: ${formatted} \n`));
                    console.log(chalk.whiteBright('📱 WhatsApp → Linked Devices → Link with phone number'));
                    console.log(chalk.whiteBright('🌐 OR Visit Railway URL for Web Pairing\n'));
                } catch (e) {}
            }, 2000);
        }

        if (connection === 'open') {
            console.log(chalk.greenBright.bold(`\n✅ ${settings.botName} CONNECTED!\n`));
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                fs.rmSync(path.join(__dirname, 'auth'), { recursive: true, force: true });
                startBot();
            } else {
                startBot();
            }
        }
    });

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || chatUpdate.type !== 'notify') return;
            m.chat = m.key.remoteJid;
            m.sender = m.key.participant || m.key.remoteJid;
            m.pushName = m.pushName || "User";
            m.isGroup = m.chat.endsWith('@g.us');
            await AyubHandler(m, conn);
        } catch (e) { console.error(e); }
    });
}

app.listen(PORT, () => console.log(chalk.greenBright(`\n🌐 Web Pairing: http://localhost:${PORT}\n`)));
startBot();