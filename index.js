const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['Friendzone-Bot', 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('✅ Friendzone-Bot connecté à WhatsApp !');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (!text.startsWith('.')) return;

    const cmd = text.split(' ')[0].toLowerCase();
    const args = text.slice(cmd.length).trim();

    if (cmd === '.menu') {
      await sock.sendMessage(from, { text: `👋 *FRIENDZONE BOT*\n\n.menu - Voir ce menu\n.friendzone [nom] - Tester ton niveau de friendzone\n.ping - Tester si le bot est en vie\n.sticker - Transformer une photo en sticker\n\nEnvoie .friendzone + le nom de ton crush 😏` });
    }

    if (cmd === '.ping') {
      await sock.sendMessage(from, { text: '🏓 Pong ! Bot en ligne ✅' });
    }

    if (cmd === '.friendzone') {
      const nom = args || 'ton crush';
      const pct = Math.floor(Math.random() * 101);
      let verdict = pct > 80 ? 'Bro... c\'est fini pour toi 💀 C\'est la friendzone éternelle.' : pct > 50 ? 'Attention, tu glisses dangereusement vers la friendzone 😬' : 'Il y a encore de l\'espoir ! Fonce 👀';
      await sock.sendMessage(from, { text: `💔 *FRIENDZONE TEST*\n\nPour : ${nom}\nTaux de friendzone : ${pct}%\n\n${verdict}` });
    }

    if (cmd === '.sticker') {
      await sock.sendMessage(from, { text: 'Envoie une photo avec la légende .sticker pour que je la transforme 😎' });
    }
  });
}

start();
