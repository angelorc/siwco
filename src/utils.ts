import type { SiwcoMessage } from './types'
import { randomStringForEntropy } from '@stablelib/random'
import * as bech32 from 'bech32'
import * as uri from 'valid-url'
import { SiwcoError, SiwcoErrorType } from './errors'

/**
 * This method leverages a native CSPRNG with support for both browser and Node.js
 * environments in order generate a cryptographically secure nonce for use in the
 * SiweMessage in order to prevent replay attacks.
 *
 * 96 bits has been chosen as a number to sufficiently balance size and security considerations
 * relative to the lifespan of it's usage.
 *
 * @returns cryptographically generated random nonce with 96 bits of entropy encoded with
 * an alphanumeric character set.
 */
export function generateNonce(): string {
  const nonce = randomStringForEntropy(96)
  if (!nonce || nonce.length < 8) {
    throw new Error('Error during nonce creation.')
  }
  return nonce
}

const ISO8601 = /^(?<date>[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;

export function isValidISO8601Date(inputDate: string): boolean {
  /* Split groups and make sure inputDate is in ISO8601 format */
  const inputMatch = ISO8601.exec(inputDate)

  /* if inputMatch is null the date is not ISO-8601 */
  if (!inputDate) {
    return false
  }

  /* Creates a date object with input date to parse for invalid days e.g. Feb, 30 -> Mar, 01 */
  if (!inputMatch || !inputMatch.groups) {
    return false
  }
  const inputDateParsed = new Date(inputMatch.groups.date).toISOString()

  /* Get groups from new parsed date to compare with the original input */
  const parsedInputMatch = ISO8601.exec(inputDateParsed)

  /* Compare remaining fields */
  return parsedInputMatch !== null && parsedInputMatch.groups !== undefined && inputMatch.groups.date === parsedInputMatch.groups.date
}

// https://github.com/cosmos/cosmjs/blob/main/packages/encoding/src/bech32.ts
function fromBech32(
  address: string,
  limit = Infinity,
): { readonly prefix: string, readonly data: Uint8Array } {
  const { prefix, words } = bech32.decode(address, limit)
  return {
    prefix,
    data: new Uint8Array(bech32.fromWords(words)),
  }
}

export function isValidAddress(input: string, options: { requiredPrefix?: string, length?: number } = {}): boolean {
  const { requiredPrefix, length } = options
  try {
    const { prefix, data } = fromBech32(input)

    if (requiredPrefix && requiredPrefix.trim() !== '' && prefix !== requiredPrefix) {
      return false
    }

    if (length && data.length !== length) {
      return false
    }

    return data.length === 20
  }
  catch {
    return false
  }
}

export function validateMessage(data: SiwcoMessage): void {
  if (!isValidAddress(data.address)) {
    throw new Error('Address is not a valid bech32 address.')
  }

  /** `domain` check. */
  if (
    !data.domain
    || data.domain.length === 0
    || !/[^#?]*/.test(data.domain)
  ) {
    throw new SiwcoError(
      SiwcoErrorType.INVALID_DOMAIN,
      `${data.domain} to be a valid domain.`,
    )
  }

  /** Check if the URI is valid. */
  if (!data.uri || !uri.isUri(data.uri)) {
    throw new SiwcoError(
      SiwcoErrorType.INVALID_URI,
      `${data.uri} to be a valid uri.`,
    )
  }

  /** Check if the version is 1. */
  if (data.version !== '1') {
    throw new SiwcoError(
      SiwcoErrorType.INVALID_MESSAGE_VERSION,
      '1',
      data.version,
    )
  }

  /** Check if the nonce is alphanumeric and bigger then 8 characters */
  const nonce = data?.nonce?.match(/[a-z0-9]{8,}/i)
  if (!nonce || (data.nonce?.length ?? 0) < 8 || nonce[0] !== data.nonce) {
    throw new SiwcoError(
      SiwcoErrorType.INVALID_NONCE,
      `Length > 8 (${nonce?.length}). Alphanumeric.`,
      data.nonce,
    )
  }

  /** `issuedAt` conforms to ISO-8601 and is a valid date. */
  if (data.issuedAt) {
    if (!isValidISO8601Date(data.issuedAt)) {
      throw new Error(SiwcoErrorType.INVALID_TIME_FORMAT)
    }
  }

  /** `expirationTime` conforms to ISO-8601 and is a valid date. */
  if (data.expirationTime) {
    if (!isValidISO8601Date(data.expirationTime)) {
      throw new Error(SiwcoErrorType.INVALID_TIME_FORMAT)
    }
  }

  /** `notBefore` conforms to ISO-8601 and is a valid date. */
  if (data.notBefore) {
    if (!isValidISO8601Date(data.notBefore)) {
      throw new Error(SiwcoErrorType.INVALID_TIME_FORMAT)
    }
  }
}
