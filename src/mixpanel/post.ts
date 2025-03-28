import { Mixpanel } from "mixpanel"
import { TrueApi } from "@truenetworkio/sdk"
import { BlockchainEvent, FormattedEventWithSigner } from "../events/types"
import { determineChainType, getIssuerNameFromHash } from "../events/utils"
import { FILTERED_EVENTS } from "../events/supportedEvents"
import { decodeEvent } from "../events/decodeEvent"
import { EventRecord } from "@polkadot/types/interfaces"
import { Vec } from "@polkadot/types"

interface TrueEventListener {
  mixpanel: Mixpanel
  trueApi: TrueApi
}

export const trackMixpanelEvent = async (mixpanel: Mixpanel, event: BlockchainEvent, trueApi: TrueApi) => {
  try {
    const { eventName, parameters, timestamp, blockHash, signer } = event;
    
    // Find parameter values by name
    const getParamValue = (name: string) => 
      parameters.find(p => p.name === name)?.value;
    
    // Common properties for all events
    const commonProps = {
      blockHash,
      timestamp,
      signer
    };

    switch (eventName) {
      case 'AttestationCreated': {
        const attestedTo = getParamValue('Attested To');
        const issuerHash = getParamValue('Issuer Hash');
        const schemaHash = getParamValue('Schema');
        
        // Get readable names
        const issuerName = await getIssuerNameFromHash(issuerHash?.toString() || '', trueApi);
        const schemaName = schemaHash?.toString();
        
        // Determine chain type
        const chainType = attestedTo ? determineChainType(attestedTo.toString()) : 'Unknown';
        
        // Track the event
        mixpanel.track('Attestation Created', {
          ...commonProps,
          issuerHash,
          issuerName,
          attestedTo,
          schemaHash,
          schemaName,
          chainType,
          attestationIndex: getParamValue('Attestation Index'),
          attestationData: getParamValue('Attestation')
        });
        
        // Update user profile if we have an address
        if (attestedTo) {
          // Set properties that should only be set once
          mixpanel.people.set_once(attestedTo.toString(), {
            'First Attestation Date': new Date(timestamp).toISOString(),
            'User Type': 'Attestation Recipient',
            'First Chain Type': chainType
          });
          
          // Update properties that change with each attestation
          mixpanel.people.set(attestedTo.toString(), {
            'Last Attestation Date': new Date(timestamp).toISOString(),
            '$last_seen': new Date(timestamp).toISOString(),
            'Last Issuer': issuerName,
            'Last Schema': schemaName
          });
          
          // Increment counters
          mixpanel.people.increment(attestedTo.toString(), {
            'Attestation Count': 1,
            [`Attestations On ${chainType}`]: 1,
            [`Attestations From ${issuerHash}`]: 1
          });
          
          // Add issuer to the set of issuers for this user
          mixpanel.people.union(attestedTo.toString(), {
            'Associated Issuers': [issuerHash!],
            'Associated Schemas': [schemaHash!]
          });
        }
        break;
      }
      
      case 'AttestationUpdated': {
        const attestedTo = getParamValue('Attested To');
        const issuerHash = getParamValue('Issuer Hash');
        const schemaHash = getParamValue('Schema');
        
        // Get readable names
        const issuerName = await getIssuerNameFromHash(issuerHash?.toString() || '', trueApi);
        const schemaName = schemaHash?.toString();
        
        // Determine chain type
        const chainType = attestedTo ? determineChainType(attestedTo.toString()) : 'Unknown';
        
        // Track the event
        mixpanel.track('Attestation Updated', {
          ...commonProps,
          issuerHash,
          issuerName,
          attestedTo,
          schemaHash,
          schemaName,
          chainType,
          attestationIndex: getParamValue('Attestation Index'),
          attestationData: getParamValue('Attestation')
        });
        
        // Update user profile
        if (attestedTo) {
          // Update properties
          mixpanel.people.set(attestedTo.toString(), {
            'Last Attestation Update Date': new Date(timestamp).toISOString(),
            '$last_seen': new Date(timestamp).toISOString()
          });
          
          // Increment counter
          mixpanel.people.increment(attestedTo.toString(), 'Attestation Updates Count', 1);
        }
        break;
      }
      
      case 'IssuerCreated': {
        const issuerHash = getParamValue('Hash');
        const issuerName = getParamValue('Name');
        const controllers = getParamValue('Controllers');
        
        // Track the event
        mixpanel.track('Issuer Created', {
          ...commonProps,
          issuerHash,
          issuerName,
          controllers
        });
        
        // You could also identify the issuer as a special type of "user"
        if (issuerHash) {
          const issuerId = `issuer:${issuerHash}`;
          
          mixpanel.people.set(issuerId, {
            'Issuer Name': issuerName,
            'Creation Date': new Date(timestamp).toISOString(),
            'Controllers': controllers,
            'User Type': 'Issuer'
          });
        }
        break;
      }
      
      case 'SchemaCreated': {
        const schemaHash = getParamValue('Schema Hash');
        const schema = getParamValue('Schema');
        const issuerHash = getParamValue('Issuer Hash');

        // Track the event
        mixpanel.track('Schema Created', {
          ...commonProps,
          schemaHash,
          schema,
          issuerHash
        });
        break;
      }
      
      case 'AlgorithmAdded': {
        const algorithmId = getParamValue('Algorithm ID');
        const schemas = getParamValue('Schemas');

        // Track the event
        mixpanel.track('Algorithm Added', {
          ...commonProps,
          algorithmId,
          schemas: schemas?.split(',') ?? []
        });
        break;
      }
      
      case 'AlgoResult': {
        const result = getParamValue('Algorithm Result');
        const issuerHash = getParamValue('Issuer Hash');
        const attestedTo = getParamValue('Account Id');

        // Track the event
        mixpanel.track('Reputation Score Updated', {
          ...commonProps,
          result,
          issuerHash,
          attestedTo
        });
        break;
      }
      
      case 'Transfer':
      case 'Reserved':
      case 'Unreserved': {
        // For token transactions
        const from = getParamValue('From') || getParamValue('Who');
        const to = getParamValue('To');
        const amount = getParamValue('Amount');
        
        // Track the event
        mixpanel.track('Token Transaction', {
          ...commonProps,
          type: eventName,
          from,
          to,
          amount
        });
        break;
      }
      
      default:
        // For all other events, track with a generic structure
        mixpanel.track(`Blockchain Event: ${eventName}`, {
          ...commonProps,
          parameters: parameters.reduce((acc, param) => {
            acc[param.name.replace(/\s+/g, '_')] = param.value;
            return acc;
          }, {} as Record<string, any>)
        });
    }
  } catch (error) {
    console.error('Error tracking Mixpanel event:', error);
  }
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
  })
}

export const startListeningForEvents = ({ mixpanel, trueApi }: TrueEventListener) => {
  // Start listening for events
  subscribeNewHeads(trueApi, mixpanel);
}
