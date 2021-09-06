import { SmartWeaveNodeFactory, LoggerFactory } from 'redstone-smartweave';
import Ardk from '../ardk';

export default async function selectWeightedHolder(ardk: Ardk): Promise<string> {
  const {
    balances,
    vault,
  }: {
    balances: { [key: string]: number };
    vault: { [key: string]: [{ balance: number; start: number; end: number }] };
  } = await getState(ardk);

  let totalTokens = 0;
  for (const addy of Object.keys(balances)) {
    totalTokens += balances[addy];
  }
  for (const addy of Object.keys(vault)) {
    if (!vault[addy].length) continue;
    const vaultBalance = vault[addy].map((a) => a.balance).reduce((a, b) => a + b, 0);
    totalTokens += vaultBalance;
    if (addy in balances) {
      balances[addy] += vaultBalance;
    } else {
      balances[addy] = vaultBalance;
    }
  }

  const weighted = {};
  for (const addy of Object.keys(balances)) {
    weighted[addy] = balances[addy] / totalTokens;
  }

  let sum = 0;
  const r = Math.random();
  for (const addy of Object.keys(weighted)) {
    sum += weighted[addy];
    if (r <= sum && weighted[addy] > 0) {
      return addy;
    }
  }

  return;
}

async function getState(ardk: Ardk): Promise<{
  balances: { [key: string]: number };
  vault: { [key: string]: [{ balance: number; start: number; end: number }] };
}> {
  const cxyzContractTxId = 'mzvUgNc8YFk0w5K5H7c8pyT-FC5Y_ba0r7_8766Kx74';

  LoggerFactory.INST.logLevel('fatal');

  // @ts-ignore
  const smartweave = SmartWeaveNodeFactory.memCached(ardk);

  // connecting to a given contract
  const cxyzContract = smartweave.contract(cxyzContractTxId);

  const { state } = await cxyzContract.readState();
  return state as any;
}
