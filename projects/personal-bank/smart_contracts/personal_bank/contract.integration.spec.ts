import { Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { Account } from 'algosdk'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { PersonalBankFactory } from '../artifacts/personal_bank/PersonalBankClient'

describe('personal bank contract', () => {
  const localnet = algorandFixture()
  beforeAll(() => {
    Config.configure({
      debug: true,
    })
    registerDebugEventHandlers()
  })
  beforeEach(localnet.newScope)

  const deploy = async (account: Account & TransactionSignerAccount) => {
    const factory = localnet.algorand.client.getTypedAppFactory(PersonalBankFactory, {
      defaultSender: account.addr,
      defaultSigner: account.signer,
    })

    const { appClient } = await factory.deploy({ onUpdate: 'append', onSchemaBreak: 'append', suppressLog: true })
    return { client: appClient }
  }

  test('deposit', async () => {
    // Arrange
    const { testAccount, algorand } = localnet.context
    const { client } = await deploy(testAccount)

    const payTxn = await algorand.createTransaction.payment({
      sender: testAccount.addr,
      receiver: client.appAddress,
      amount: AlgoAmount.Algos(1),
    })

    // Act
    const result = await client.send.deposit({ args: { payTxn }, populateAppCallResources: true })

    // Assert
    expect(result.return).toBe(1000000n)
  })

  test('deposit & withdraw', async () => {
    // Arrange
    const { testAccount, algorand } = localnet.context
    const { client } = await deploy(testAccount)

    const dispenser = await algorand.account.localNetDispenser()

    await algorand.account.ensureFunded(client.appAddress, dispenser, AlgoAmount.Algos(1))

    const payTxn = await algorand.createTransaction.payment({
      sender: testAccount.addr,
      receiver: client.appAddress,
      amount: AlgoAmount.Algos(1),
    })

    await client.send.deposit({ args: { payTxn }, populateAppCallResources: true })

    // Act
    const result = await client.send.withdraw({
      args: {},
      coverAppCallInnerTransactionFees: true,
      maxFee: AlgoAmount.MicroAlgo(3000),
    })

    // Assert
    expect(result.return).toBe(1000000n)
  })
})
