//base by   (AMMAR H4CK3R)
//WhatsApp: +923195447147
//telegram channel: https://t.me/ammar_devs

const fs = require('fs');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const { Boom } = require('@hapi/boom');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');

const settings = require('./settings');
const AmmarHandler = require('./Ammar.js');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const dbPath = path.join(__dirname, settings.dbName);
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: {}, groups: {}, botInfo: {} }));
}
global.db = JSON.parse(fs.readFileSync(dbPath));

setInterval(() => {
    fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
}, 30 * 1000);

function checkSessionExists() {
  const sessionPath = path.join(__dirname, 'auth');
  if (!fs.existsSync(sessionPath)) return false;
  return fs.readdirSync(sessionPath).some(file => file.includes('creds.json'));
}

async function startBot() {
  console.clear();
  console.log(chalk.cyanBright.bold('\n╔══════════════════════════════════════╗'));
  console.log(chalk.cyanBright.bold(`║      🤖 ${settings.botName.toUpperCase()}      ║`));
  console.log(chalk.cyanBright.bold('╚══════════════════════════════════════╝\n'));

  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();

  let phoneNumber = '';
  const hasSession = checkSessionExists();

  if (hasSession) {
    console.log(chalk.greenBright('✅ Session Found! Auto Logging in...'));
  } else {
    console.log(chalk.yellowBright('⚠️ No Session Found!'));
    phoneNumber = await question(chalk.greenBright('👉 Number (e.g., 923001234567): '));
    phoneNumber = phoneNumber.replace(/[^0-9]/g, ''); 
  }

  const conn = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({ level: 'silent' }), 
    generateHighQualityLinkPreview: true
  });

  conn.ev.on('creds.update', saveCreds);

  let pairingStarted = false;

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (!conn.authState.creds.registered && !hasSession && !pairingStarted && connection === 'connecting' && phoneNumber) {
      pairingStarted = true;
      console.log(chalk.yellowBright('\n⏳ Fetching Pairing Code from WhatsApp... Please wait.'));
      
      setTimeout(async () => {
        try {
          const code = await conn.requestPairingCode(phoneNumber);
          const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
          
          console.log(chalk.black.bgYellowBright.bold(`\n 🔑 YOUR PAIRING CODE: ${formattedCode} \n`));
          console.log(chalk.whiteBright('👉 Step 1: Open WhatsApp on your mobile.'));
          console.log(chalk.whiteBright('👉 Step 2: Go to Linked Devices > Link a Device > Link with phone number instead.'));
          console.log(chalk.whiteBright('👉 Step 3: Enter the code above.\n'));
        } catch (error) {
          console.log(chalk.redBright('❌ Error generating code. Try again.'));
          process.exit(1);
        }
      }, 3000); 
    }

    if (connection === 'open') {
      console.log(chalk.greenBright.bold(`\n✅ ${settings.botName} IS SUCCESSFULLY CONNECTED!\n`));
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        fs.rmSync(path.join(__dirname, 'auth'), { recursive: true, force: true });
        process.exit();
      } else {
        startBot();
      }
    }
  });

  conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m.message) return;
        if (chatUpdate.type !== 'notify') return;
        if (m.key.fromMe) return; 

        m.chat = m.key.remoteJid;
        m.sender = m.key.participant || m.key.remoteJid;
        m.pushName = m.pushName || "User";
        m.isGroup = m.chat.endsWith('@g.us'); 

        await AmmarHandler(m, conn);
    } catch (e) {
        console.error(e);
    }
  });
}

startBot();