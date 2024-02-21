import {ApiPromise, WsProvider} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {cryptoWaitReady} from "@polkadot/util-crypto";
import {Keyring} from "@polkadot/keyring";
import OpalDefinitions from "@unique-nft/opal-testnet-types/unique/definitions";

export type ChainInfo = {
  endpoint: string;
  seed?: string;
  uri?: string
}
export const chainInfo: Record<'opal' | 'unq', ChainInfo> = {
  opal: {
    endpoint: 'wss://ws-opal.unique.network',
    seed: 'bus ahead nation nice damp recall place dance guide media clap language'
  },
  unq: {
    endpoint: 'wss://ws.unq.uniq.su',
    uri: '//Alice'
  }
}

export async function createApi(info: ChainInfo): Promise<[ApiPromise, KeyringPair]> {
  let api: ApiPromise
  let account: KeyringPair
  await cryptoWaitReady()

  const keyring = new Keyring({type: 'sr25519'})
  if (info.uri) {
    account = keyring.addFromUri(info.uri)
  } else if (info.seed) {
    account = keyring.addFromMnemonic(info.seed)
  }

  // const provider = new WsProvider('wss://ws-opal.unique.network')
  const provider = new WsProvider(info.endpoint)
  api = await ApiPromise.create({provider, rpc: {unique: OpalDefinitions.rpc}})

  console.log(`Connection established to ${provider.endpoint}`)

  return [api, account];
}
