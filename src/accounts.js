import fs from 'fs';
import path from 'path';
import { api, generateDeviceId } from './api.js';
import { log } from './colors.js';

const ACCOUNTS_FILE = path.resolve('accounts.json');
const WALLETS_FILE = path.resolve('wallets.txt');

export function isValidSolanaAddress(addr) {
  return typeof addr === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

export function loadAccounts() {
  let accounts = [];

  // 1. Load existing accounts.json if present
  if (fs.existsSync(ACCOUNTS_FILE)) {
    try {
      const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        accounts = parsed;
      }
    } catch {}
  }

  // 2. Load wallets.txt if present (super convenient: 1 wallet per line)
  if (fs.existsSync(WALLETS_FILE)) {
    try {
      const lines = fs
        .readFileSync(WALLETS_FILE, 'utf-8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && !l.includes('MASUKKAN_') && isValidSolanaAddress(l));

      for (const w of lines) {
        if (!accounts.some((a) => a.wallet === w)) {
          accounts.push({
            nickname: 'Runner_' + w.slice(0, 4) + w.slice(-4),
            wallet: w,
            who: 'dog',
            ref: '',
          });
        }
      }
    } catch {}
  }

  // Filter out dummy/placeholder accounts & ensure valid Solana base58
  accounts = accounts.filter((a) => isValidSolanaAddress(a.wallet));

  return accounts;
}

export function saveAccounts(accounts) {
  try {
    const tmpFile = `${ACCOUNTS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(accounts, null, 2), 'utf-8');
    fs.renameSync(tmpFile, ACCOUNTS_FILE);
  } catch (e) {
    log.error(`Failed to write accounts.json: ${e.message}`);
  }
}

export async function initAccount(acc) {
  if (!acc.wallet || acc.wallet.length < 32) return null;

  if (!acc.device) {
    acc.device = generateDeviceId();
  }

  if (!acc.token) {
    const short = `${acc.wallet.slice(0, 4)}...${acc.wallet.slice(-4)}`;
    log.info(`Mendaftarkan wallet baru: ${short}`);
    try {
      const reg = await api.register({
        nickname: acc.nickname || undefined,
        wallet: acc.wallet,
        ref: acc.ref || undefined,
        device: acc.device,
      });

      acc.token = reg.token;
      acc.nickname = reg.nickname || acc.nickname;
      acc.guestId = reg.guestId;
      log.success(`Berhasil registrasi! Nickname: ${acc.nickname}`);
    } catch (e) {
      if (e.message && (e.message.includes('Demasiadas cuentas') || e.status === 429)) {
        log.warn(`IP Rate Limit pendaftaran baru (${short}): Server membatasi ~25 akun baru per jam dari 1 IP.`);
      } else {
        log.error(`Gagal registrasi ${short}: ${e.message}`);
      }
      return null;
    }
  }

  return acc;
}
