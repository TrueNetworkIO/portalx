import { TrueApi } from "@truenetworkio/sdk"
import { Mixpanel } from "mixpanel"
import { Vec } from '@polkadot/types'
import { EventRecord } from '@polkadot/types/interfaces'
import { FILTERED_EVENTS } from "./supportedEvents"
import { decodeEvent } from "./decodeEvent"
import { BlockchainEvent, FormattedEventWithSigner } from "./types"
import { trackMixpanelEvent } from "../mixpanel/post"

interface TrueEventListener {
  mixpanel: Mixpanel
  trueApi: TrueApi
}

const subscribeNewHeads = async (trueApi: TrueApi, mixpanel: Mixpanel) => {
  await trueApi.network.rpc.chain.subscribeNewHeads(async (header) => {
    const block = (await trueApi.network.at(header.hash)) as any
    const allEvents = await block.query.system.events() as Vec<EventRecord>
    const blocks = await trueApi.network.rpc.chain.getBlock(header.hash)
    const extrinsics = blocks.block.extrinsics

    const newEvents = allEvents.toArray()
      .map((record: any) => {
        const { event, phase } = record
        const eventHuman = event.toHuman()
        const eventName = `${event.section}.${event.method}`

        if (!FILTERED_EVENTS.includes(eventName)) {
          return null
        }

        if (phase.isApplyExtrinsic) {
          const extrinsicIndex = phase.asApplyExtrinsic.toNumber()
          const extrinsic = extrinsics[extrinsicIndex]
          const signer = extrinsic?.signer?.toString() || null
          const decodedEvent = decodeEvent(eventHuman, trueApi)

          if (!signer) return null
          return { ...decodedEvent, signer }
        }
        return null
      }).filter((event: any) => event !== null) as FormattedEventWithSigner[]

    const timestamp = Date.now()

    const blockEvents: BlockchainEvent[] = newEvents.map((e) => ({
      blockHash: header.hash.toString(),
      timestamp: timestamp,
      type: e.section,
      eventName: e.name,
      signer: e.signer,
      parameters: e.parameters
    }))

    console.log(blockEvents)

    // Track each event in Mixpanel
    for (const event of blockEvents) {
      await trackMixpanelEvent(mixpanel, event, trueApi);
    }

    // Optionally track a summary of the block
    // mixpanel.track('Block Processed', {
    //   blockHash: header.hash.toString(),
    //   timestamp,
    //   eventCount: blockEvents.length,
    //   eventTypes: blockEvents.map(e => e.eventName)
    // });
  })
}


export const startListeningForEvents = ({ mixpanel, trueApi }: TrueEventListener) => {
  subscribeNewHeads(trueApi, mixpanel)
}