import type { SiwcoMessage } from './types'
import { generateNonce, validateMessage } from './utils'

export { fromMessage } from './parser'
export type { SiwcoMessage } from './types'

export function toMessage(data: SiwcoMessage): string {
  validateMessage(data)

  const headerPrefix = data.scheme ? `${data.scheme}://${data.domain}` : data.domain
  const header = `${headerPrefix} wants you to sign in with your ${data.chainName ?? ''} account:`
  const uriField = `URI: ${data.uri}`
  let prefix = [header, data.address].join('\n')
  const versionField = `Version: ${data.version}`

  if (!data.nonce) {
    data.nonce = generateNonce()
  }

  const chainField = `Chain ID: ${data.chainId}`
  const nonceField = `Nonce: ${data.nonce}`
  const suffixArray = [uriField, versionField, chainField, nonceField]

  data.issuedAt = data.issuedAt || new Date().toISOString()

  suffixArray.push(`Issued At: ${data.issuedAt}`)

  if (data.expirationTime) {
    suffixArray.push(`Expiration Time: ${data.expirationTime}`)
  }

  if (data.notBefore) {
    suffixArray.push(`Not Before: ${data.notBefore}`)
  }

  if (data.requestId) {
    suffixArray.push(`Request ID: ${data.requestId}`)
  }

  if (data.resources) {
    suffixArray.push(
      [`Resources:`, ...data.resources.map(x => `- ${x}`)].join('\n'),
    )
  }

  const suffix = suffixArray.join('\n')
  prefix = [prefix, data.statement].join('\n\n')
  if (data.statement) {
    prefix += '\n'
  }
  return [prefix, suffix].join('\n')
}
