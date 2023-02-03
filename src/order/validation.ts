import { ethers } from "ethers";

import { EXCLUSIVE_FILLER_VALIDATION_MAPPING } from "../constants";

import { OrderInfo } from "./types";

export enum ValidationType {
  None,
  ExclusiveFiller,
}

type ExclusiveFillerData = {
  filler: string;
  lastExclusiveTimestamp: number;
};

export type ValidationInfo = {
  validationContract: string;
  validationData: string;
};

export type CustomOrderValidation =
  | {
      type: ValidationType.None;
      data: null;
    }
  | {
      type: ValidationType.ExclusiveFiller;
      data: ExclusiveFillerData;
    };

const NONE_VALIDATION: CustomOrderValidation = {
  type: ValidationType.None,
  data: null,
};

export function parseValidation(info: OrderInfo): CustomOrderValidation {
  // TODO: extend to support multiple validation types
  // Add mapping of address to validation type, if no matches iterate through attempting to parse
  const data = parseExclusiveFillerData(info.validationData);
  if (data.type !== ValidationType.None) {
    return data;
  }

  return NONE_VALIDATION;
}

// returns decoded filler data, or null if invalid encoding
function parseExclusiveFillerData(encoded: string): CustomOrderValidation {
  try {
    const [address, timestamp] = new ethers.utils.AbiCoder().decode(
      ["address", "uint256"],
      encoded
    );
    return {
      type: ValidationType.ExclusiveFiller,
      data: {
        filler: address,
        lastExclusiveTimestamp: timestamp.toNumber(),
      },
    };
  } catch {
    return NONE_VALIDATION;
  }
}

// returns decoded filler data, or null if invalid encoding
export function encodeExclusiveFillerData(
  fillerAddress: string,
  lastExclusiveTimestamp: number,
  chainId?: number,
  validationContractAddress?: string
): ValidationInfo {
  let validationContract = "";
  if (validationContractAddress) {
    validationContract = validationContractAddress;
  } else if (chainId) {
    validationContract = EXCLUSIVE_FILLER_VALIDATION_MAPPING[chainId];
  } else {
    throw new Error("No validation contract provided");
  }

  const encoded = new ethers.utils.AbiCoder().encode(
    ["address", "uint256"],
    [fillerAddress, lastExclusiveTimestamp]
  );
  return {
    validationContract,
    validationData: encoded,
  };
}
