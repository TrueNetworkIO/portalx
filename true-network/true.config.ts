
import { TrueApi, testnet } from '@truenetworkio/sdk'
import { TrueConfig } from '@truenetworkio/sdk/dist/utils/cli-config'

// If you are not in a NodeJS environment, please comment the code following code:
import dotenv from 'dotenv'
dotenv.config()

export const getTrueNetworkInstance = async (): Promise<TrueApi> => {
  const trueApi = await TrueApi.create(config.account.secret)

  await trueApi.setIssuer(config.issuer.hash)

  return trueApi;
}

export const config: TrueConfig = {
  network: testnet,
  account: {
    address: 'hbwKV31wZYayYLmKMKUpis157SN68NDZYEWXMykacRDXkzo',
    secret: process.env.TRUE_NETWORK_SECRET_KEY ?? ''
  },
  issuer: {
    name: 'portalx',
    hash: '0x96658ac075b77822142472916e78745334a141566fb9114fae61c93bace9e084'
  },
  algorithm: {
    id: undefined,
    path: undefined,
    schemas: []
  },
}
  