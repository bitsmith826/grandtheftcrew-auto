import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { loadAccounts, saveAccounts, initAccount, isValidSolanaAddress } from './src/accounts.js';
import { api } from './src/api.js';
import { executeQuickRun, executeBoostRun } from './src/game.js';
import { log, colors, padColored } from './src/colors.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printBanner() {
  console.clear();
  console.log(`
${colors.brightCyan}╔═════════════════════════════════════════════════════════════════════════════════════════════════╗
║ ${padColored(colors.bold + colors.brightWhite + 'GRAND THEFT CREW ($GRAND) AUTO-FARM BOT' + colors.reset, 95, 'center')} ║
║ ${padColored(colors.brightYellow + 'Solana Airdrop All-in-One Automated Suite • Multi-Wallet Farm' + colors.reset, 95, 'center')} ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════╝${colors.reset}
  ${colors.dim}•${colors.reset} ${colors.green}Auto Login & Register${colors.reset} (Multi-Wallet via wallets.txt / accounts.json)
  ${colors.dim}•${colors.reset} ${colors.green}Auto Referral Tree${colors.reset} (Wallet #1 otomatis menjadi Master Referral)
  ${colors.dim}•${colors.reset} ${colors.green}Auto Claim Task Sosial${colors.reset} (Follow X/Twitter +2.000 poin)
  ${colors.dim}•${colors.reset} ${colors.green}Auto Daily Check-in${colors.reset} (+500 poin per hari)
  ${colors.dim}•${colors.reset} ${colors.green}Auto Skor Booster Humanized${colors.reset} (Mendongkrak skor game ke ~24.000+ poin per akun)
`);
}

async function promptWalletsIfEmpty() {
  let accounts = loadAccounts();
  if (accounts.length > 0) return accounts;

  log.warn('Belum ada alamat wallet Solana yang dimasukkan!');
  console.log(`\nSilakan ketik atau paste alamat Solana wallet kamu di bawah.`);
  console.log(`(Bisa masukkan 1 atau beberapa wallet dipisahkan spasi/koma/enter):\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(`${colors.brightCyan}Wallet Address: ${colors.reset}`, resolve));
  rl.close();

  const wallets = answer
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(isValidSolanaAddress);

  if (wallets.length === 0) {
    log.error('Tidak ada alamat wallet valid. Silakan isi file wallets.txt lalu jalankan npm start lagi.');
    process.exit(1);
  }

  const walletsPath = path.resolve('wallets.txt');
  fs.writeFileSync(walletsPath, wallets.join('\n') + '\n', 'utf-8');
  log.success(`Berhasil menyimpan ${wallets.length} wallet ke wallets.txt!\n`);

  return loadAccounts();
}

let masterRefCode = '';

async function processAccountEndToEnd(acc, index, total) {
  const shortAddr = `${acc.wallet.slice(0, 4)}...${acc.wallet.slice(-4)}`;
  log.step(index, total, `Akun: ${colors.brightCyan}${shortAddr}${colors.reset} (${colors.bold}${acc.nickname || 'Runner'}${colors.reset})`);

  // Hubungkan ke Master Referral (Wallet #1) jika belum
  if (!acc.ref && masterRefCode && index > 1) {
    acc.ref = masterRefCode;
  }

  // 1. Inisialisasi Akun & Sesi Token
  const activeAcc = await initAccount(acc);
  if (!activeAcc) {
    log.error(`Gagal menginisialisasi wallet ${shortAddr}.`);
    return null;
  }

  // 2. Ambil data tugas & status
  let tasks;
  try {
    tasks = await api.tasks(activeAcc.token);
  } catch (e) {
    log.error(`Gagal membaca data tugas untuk ${shortAddr}: ${e.message}`);
    return null;
  }

  if (!masterRefCode && tasks.refCode) {
    masterRefCode = tasks.refCode;
    log.info(`Master Referral Code terdeteksi: ${colors.brightYellow}${masterRefCode}${colors.reset}`);
  }

  log.info(`Poin Misi Saat Ini : ${colors.bold}${tasks.total.toLocaleString()}${colors.reset} Poin`);
  log.info(`Kode Referral Akun : ${colors.yellow}${tasks.refCode}${colors.reset}`);

  // 3. Klaim Tugas Follow X / Twitter (+2.000 Poin)
  if (!tasks.follow?.done) {
    log.info(`Mengklaim tugas ${colors.bold}Follow X/Twitter${colors.reset} (+2.000 poin)...`);
    try {
      tasks = await api.claimTask(activeAcc.token, 'follow');
      log.success(`Tugas Follow X selesai! Total poin misi: ${colors.bold}${tasks.total.toLocaleString()}${colors.reset}`);
    } catch (e) {
      log.warn(`Gagal klaim follow: ${e.message}`);
    }
  } else {
    log.info(`Tugas Follow X     : ${colors.green}✔ SUDAH SELESAI (+2.000 pts)${colors.reset}`);
  }

  // 4. Daily Check-in (+500 Poin)
  if (tasks.checkin?.done) {
    log.info(`Daily Check-in     : ${colors.green}✔ SUDAH CHECK-IN HARI INI (+500 pts)${colors.reset}`);
  } else {
    log.info(`Daily Check-in     : ${colors.yellow}BELUM KLAIM${colors.reset} - Membuka kunci check-in...`);
    if (!tasks.checkin?.ready) {
      // Jalankan run cepat ~14 detik untuk membuka checkin
      await executeQuickRun(activeAcc, (p) => {
        process.stdout.write(`\r${colors.cyan}[UNLOCK]${colors.reset} Membuka kunci check-in... ${p.percent}% `);
      });
      console.log('');
    }

    try {
      tasks = await api.claimTask(activeAcc.token, 'checkin');
      log.success(`Daily Check-in ${colors.bold}BERHASIL DIKLAIM${colors.reset}! (+500 pts)`);
    } catch (e) {
      log.warn(`Gagal klaim checkin: ${e.message}`);
    }
  }

  // 5. Cek & Auto Boosting Skor Game ke ~24.000+ Poin (Humanized Level 1 Full Clear)
  let me = await api.me(activeAcc.token);
  const currentBest = me.best || 0;

  if (currentBest < 20000) {
    log.info(`Skor game saat ini (${currentBest.toLocaleString()}) < 20.000. ${colors.brightYellow}Memulai Humanized Booster Level 1 Full Clear (~1.5 menit)...${colors.reset}`);
    const boostRes = await executeBoostRun(activeAcc, (p) => {
      process.stdout.write(
        `\r${colors.cyan}[BOOST]${colors.reset} Tick: ${p.tick} | Skor: ${colors.bold}${colors.brightGreen}${p.score.toLocaleString()}${colors.reset} | Seg: ${p.seg} | Nyawa: ${p.lives} `
      );
    });
    console.log('');

    if (boostRes.accepted) {
      log.success(`Skor game berhasil ditingkatkan ke: ${colors.bold}${colors.brightGreen}${boostRes.best.toLocaleString()} Poin${colors.reset}!`);
      activeAcc.best = boostRes.best;
    } else {
      log.warn(`Hasil boost server: ${boostRes.status} (Skor: ${boostRes.score})`);
    }
    me = await api.me(activeAcc.token);
  } else {
    log.info(`Skor Game (Best Run): ${colors.brightGreen}✔ ${currentBest.toLocaleString()} Poin${colors.reset} (Sudah tinggi, lewati boost)`);
  }

  // 6. Ambil Peringkat Leaderboard
  let rank = 'Unranked';
  try {
    const lb = await api.leaderboard(activeAcc.nickname);
    const myRow = lb.me || lb.rows?.find((r) => r.nickname === activeAcc.nickname);
    if (myRow) rank = `#${myRow.rank}`;
  } catch {}

  const finalRun = me.best || 0;
  const finalTasks = tasks.total || 0;
  const grandTotal = finalRun + finalTasks;

  log.success(`Ringkasan Akun: Skor Game: ${finalRun.toLocaleString()} | Misi: ${finalTasks.toLocaleString()} | ${colors.bold}Total: ${grandTotal.toLocaleString()} Poin${colors.reset} | Rank: ${colors.cyan}${rank}${colors.reset}`);

  return {
    wallet: shortAddr,
    fullWallet: activeAcc.wallet,
    nickname: activeAcc.nickname,
    bestScore: finalRun,
    taskPoints: finalTasks,
    totalScore: grandTotal,
    checkin: tasks.checkin?.done ? 'DONE' : 'PENDING',
    rank,
  };
}

function printSummaryTable(results, masterRefStats = null) {
  console.log(`\n${colors.brightCyan}┌─────┬──────────────┬──────────────────┬────────────┬──────────┬────────────┬─────────┬──────────┐`);
  console.log(`│ No  │ Wallet       │ Nickname         │ Skor Game  │ Task Pts │ Total Poin │ Checkin │ Rank     │`);
  console.log(`├─────┼──────────────┼──────────────────┼────────────┼──────────┼────────────┼─────────┼──────────┤${colors.reset}`);

  let sumRun = 0;
  let sumTasks = 0;
  let sumTotal = 0;

  results.forEach((r, i) => {
    if (!r) return;
    sumRun += r.bestScore;
    sumTasks += r.taskPoints;
    sumTotal += r.totalScore;

    const no = padColored(String(i + 1), 3, 'right');
    const w = padColored(r.wallet, 12, 'left');
    const nick = padColored((r.nickname || '').slice(0, 16), 16, 'left');
    const best = padColored(r.bestScore.toLocaleString(), 10, 'right');
    const task = padColored(r.taskPoints.toLocaleString(), 8, 'right');
    const tot = padColored(colors.bold + r.totalScore.toLocaleString() + colors.reset, 10, 'right');
    const chk = r.checkin === 'DONE'
      ? padColored(`${colors.green}DONE${colors.reset}`, 7, 'center')
      : padColored(`${colors.yellow}PENDING${colors.reset}`, 7, 'center');
    const rk = padColored(r.rank, 8, 'center');

    console.log(`${colors.brightCyan}│${colors.reset} ${no} ${colors.brightCyan}│${colors.reset} ${w} ${colors.brightCyan}│${colors.reset} ${nick} ${colors.brightCyan}│${colors.reset} ${best} ${colors.brightCyan}│${colors.reset} ${task} ${colors.brightCyan}│${colors.reset} ${tot} ${colors.brightCyan}│${colors.reset} ${chk} ${colors.brightCyan}│${colors.reset} ${rk} ${colors.brightCyan}│${colors.reset}`);
  });

  console.log(`${colors.brightCyan}├─────┴──────────────┴──────────────────┼────────────┼──────────┼────────────┼─────────┴──────────┤${colors.reset}`);
  const totRun = padColored(colors.bold + sumRun.toLocaleString() + colors.reset, 10, 'right');
  const totTasks = padColored(colors.bold + sumTasks.toLocaleString() + colors.reset, 8, 'right');
  const totGrand = padColored(colors.bold + colors.brightGreen + sumTotal.toLocaleString() + colors.reset, 10, 'right');
  console.log(`${colors.brightCyan}│${colors.reset} ${padColored(colors.bold + 'TOTAL KESELURUHAN' + colors.reset, 37, 'center')} ${colors.brightCyan}│${colors.reset} ${totRun} ${colors.brightCyan}│${colors.reset} ${totTasks} ${colors.brightCyan}│${colors.reset} ${totGrand} ${colors.brightCyan}│${colors.reset}                    ${colors.brightCyan}│${colors.reset}`);
  console.log(`${colors.brightCyan}└───────────────────────────────────────┴────────────┴──────────┴────────────┴────────────────────┘${colors.reset}\n`);

  if (masterRefStats) {
    console.log(`${colors.brightYellow}┌─────────────────────────────────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ ${padColored(`${colors.bold}${colors.brightYellow}★ STATUS MASTER REFERRAL (Akun Utama #1: ${masterRefStats.wallet})${colors.reset}`, 95, 'left')} │`);
    console.log(`├─────────────────────────────────────────────────────────────────────────────────────────────────┤`);
    console.log(`│ ${padColored(`  • Kode Referral   : ${colors.brightYellow}${masterRefStats.refCode}${colors.reset}`, 95, 'left')} │`);
    console.log(`│ ${padColored(`  • Total Diundang  : ${colors.brightGreen}${masterRefStats.invited} Akun${colors.reset} (Semua akun terhubung di bawah referral ini)`, 95, 'left')} │`);
    console.log(`│ ${padColored(`  • Link Referral   : ${colors.cyan}https://play.grandtheftcrew.com/?ref=${masterRefStats.refCode}${colors.reset}`, 95, 'left')} │`);
    console.log(`└─────────────────────────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`);
  }
}

function getMsUntilNextReset() {
  const now = new Date();
  // Reset setiap 00:05 UTC (07:05 WIB)
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 5, 0));
  return nextReset.getTime() - now.getTime();
}

async function main() {
  printBanner();

  let accounts = await promptWalletsIfEmpty();
  const isLoop = process.argv.includes('--loop');

  do {
    accounts = loadAccounts();
    const results = [];

    log.banner(`Mulai memproses ${accounts.length} akun secara berurutan...`);

    for (let i = 0; i < accounts.length; i++) {
      try {
        const res = await processAccountEndToEnd(accounts[i], i + 1, accounts.length);
        if (res) results.push(res);
      } catch (e) {
        log.error(`Terjadi kendala pada akun ${accounts[i].wallet}: ${e.message}`);
      }
      saveAccounts(accounts);

      if (i < accounts.length - 1) {
        await sleep(1000); // Jeda sopan antar akun
      }
    }

    // Ambil info master referral
    let masterRefStats = null;
    try {
      const masterTasks = await api.tasks(accounts[0].token);
      masterRefStats = {
        wallet: `${accounts[0].wallet.slice(0, 4)}...${accounts[0].wallet.slice(-4)}`,
        refCode: masterTasks.refCode,
        invited: masterTasks.referral?.invited || 0,
      };
    } catch {}

    printSummaryTable(results, masterRefStats);

    if (!isLoop) {
      log.success('Seluruh tugas, referral, dan boosting selesai 100%!');
      break;
    }

    const waitMs = getMsUntilNextReset();
    const waitHours = (waitMs / (1000 * 60 * 60)).toFixed(1);
    log.info(`Mode Loop 24/7 Aktif (--loop). Menunggu reset harian dalam ~${waitHours} jam...`);
    await sleep(Math.max(waitMs, 60000));
  } while (isLoop);
}

main().catch((err) => {
  log.error(`Fatal Error: ${err.message}`);
});
