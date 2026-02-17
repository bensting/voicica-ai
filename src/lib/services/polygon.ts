/**
 * Polygon 链上服务
 * 通过 Polygon RPC 获取区块信息，用于 Lucky Draw 开奖
 */

import { JsonRpcProvider } from 'ethers';

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

let _provider: JsonRpcProvider | null = null;

function getProvider(): JsonRpcProvider {
  if (!_provider) {
    _provider = new JsonRpcProvider(POLYGON_RPC_URL);
  }
  return _provider;
}

export interface PolygonBlock {
  number: number;
  hash: string;
  timestamp: number;
}

/**
 * 获取最新的 Polygon 区块信息
 */
export async function getLatestBlock(): Promise<PolygonBlock> {
  const provider = getProvider();
  const block = await provider.getBlock('latest');

  if (!block || !block.hash) {
    throw new Error('Failed to fetch latest Polygon block');
  }

  return {
    number: block.number,
    hash: block.hash,
    timestamp: block.timestamp,
  };
}

/**
 * 根据 blockHash 计算中奖 slot
 * winnerSlot = BigInt(blockHash) % totalSlots
 */
export function calculateWinnerSlot(blockHash: string, totalSlots: number): number {
  const hashBigInt = BigInt(blockHash);
  const winner = Number(hashBigInt % BigInt(totalSlots));
  return winner;
}
