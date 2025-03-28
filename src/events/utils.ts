import { TrueApi } from "@truenetworkio/sdk";
import { ISSUER_PALLET_NAME } from "@truenetworkio/sdk/dist/pallets/issuer/state"

export function formatSubstrateBalance(rawBalance: any, decimals = 12) {
  // Handle different input types
  let bigValue;

  try {
    // Check if the input is already a BigInt
    if (typeof rawBalance === 'bigint') {
      bigValue = rawBalance;
    }
    // Handle hex string (common in Substrate)
    else if (typeof rawBalance === 'string' && rawBalance.startsWith('0x')) {
      bigValue = BigInt(rawBalance);
    }
    // Handle regular string or number
    else {
      bigValue = BigInt(rawBalance.toString().replace(/,/g, ''));
    }

    // Convert to a string for precise decimal manipulation
    const stringValue = bigValue.toString();

    // If the value is smaller than the decimal places
    if (stringValue.length <= decimals) {
      const paddedValue = stringValue.padStart(decimals, '0');
      const decimalPart = paddedValue.slice(0, 4).replace(/0+$/, '');

      if (decimalPart === '') {
        return "0";
      }
      return `0.${decimalPart}`;
    }

    // Split into whole and decimal parts
    const wholePartStr = stringValue.slice(0, stringValue.length - decimals) || '0';
    const decimalPartStr = stringValue.slice(stringValue.length - decimals);

    // Format the whole part with commas
    const wholePart = parseInt(wholePartStr).toLocaleString();

    // Take up to 4 decimal places and remove trailing zeros
    const decimalPart = decimalPartStr.padStart(decimals, '0').slice(0, 4).replace(/0+$/, '');

    // Return formatted result
    if (decimalPart === '') {
      return wholePart;
    }
    return `${wholePart}.${decimalPart}`;

  } catch (error) {
    console.error("Error formatting balance:", error);
    // Return a fallback value or the original to prevent NaN
    return "Error: Invalid balance format";
  }
}

// Helper functions to get readable names from hashes (implement these according to your data structure)
export const getIssuerNameFromHash = async (issuerHash: string, trueApi: TrueApi): Promise<string> => {
  try {
    const data = await trueApi.network.query[ISSUER_PALLET_NAME].issuers(issuerHash)

    const humanData = data.toHuman() as any

    if (humanData) {
      return humanData['name'];
    }

    return issuerHash; // Fallback - just for demonstration
  } catch (error) {
    console.error('Error getting issuer name:', error);
    return issuerHash;
  }
}

export const determineChainType = (address: string): string => {
  // Implement logic to determine if address is Ethereum, Solana, or Substrate
  // This is a simple example - you'd want more robust checks in production
  if (address.startsWith('0x')) return 'Ethereum';
  if ((address.length === 43 || address.length === 44) && !address.startsWith('0x')) return 'Solana';
  return 'Substrate';
}