import { describe, expect, it } from 'vitest'
import { fromMessage, toMessage } from '../src'
import { generateNonce } from '../src/utils'

describe('should works', () => {
  it('toMessage', () => {
    const nonce = generateNonce()
    const issuedAt = new Date().toISOString()
    const structured = toMessage({
      address: 'bitsong1h882ezq7dyewld6gfv2e06qymvjxnu842586h2',
      nonce,
      issuedAt,
      scheme: 'https',
      requestId: '123',
      notBefore: '2021-08-01T00:00:00Z',
      expirationTime: '2021-08-01T00:00:00Z',
      chainName: 'bitsong',
      statement: 'this is a statement',
      chainId: 'bitsong-2b',
      domain: 'bitsong.io',
      version: '1',
      uri: 'https://bitsong.io',
      resources: [
        'track:upload',
        'track:play',
      ],
    })

    const message = `https://bitsong.io wants you to sign in with your bitsong account:
bitsong1h882ezq7dyewld6gfv2e06qymvjxnu842586h2

this is a statement

URI: https://bitsong.io
Version: 1
Chain ID: bitsong-2b
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: 2021-08-01T00:00:00Z
Not Before: 2021-08-01T00:00:00Z
Request ID: 123
Resources:
- track:upload
- track:play`

    expect(structured).toBe(message)
  })

  it('parseMessage', () => {
    const message = `https://service.org wants you to sign in with your bitsong account:
bitsong1h882ezq7dyewld6gfv2e06qymvjxnu842586h2

I accept the ServiceOrg Terms of Service: https://service.org/tos

URI: https://service.org/login
Version: 1
Chain ID: bitsong-2b
Nonce: 32891757
Issued At: 2021-09-30T16:25:24.000Z
Resources:
- ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu
- https://example.com/my-web2-claim.json`

    const parsedMessage = fromMessage(message)
    const structured = toMessage(parsedMessage)

    expect(parsedMessage).toEqual({
      domain: 'service.org',
      address: 'bitsong1h882ezq7dyewld6gfv2e06qymvjxnu842586h2',
      uri: 'https://service.org/login',
      version: '1',
      chainName: 'bitsong',
      chainId: 'bitsong-2b',
      nonce: '32891757',
      scheme: 'https',
      statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
      issuedAt: '2021-09-30T16:25:24.000Z',
      resources: [
        'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
        'https://example.com/my-web2-claim.json',
      ],
    })

    expect(structured).toBe(message)
  })
})
