import { AlgorandClient, algo } from "@algorandfoundation/algokit-utils";

// --------------------------- Main Logic ------------------------------------- #
// Uncomment the code below one step at a time to follow along with the tutorial

async function main(): Promise<void> {
  console.log("👋 Enjoy this TypeScript Utils tutorial by the Developer Relations team!");

  // -------------------------------- Step 1 -------------------------------- #
  // Initialize an Algorand Client that will be used to interact with the chain
  // For learning and development, use LocalNet so that you can reset the chain
  // as needed and have access to the genesis accounts with all 10B Algo
  const algorand = AlgorandClient.defaultLocalNet();

  // -------------------------------- Step 2 -------------------------------- #
  // Create two LocalNet accounts, Alice and Bob, funded with 100 Algo each
  const alice = await algorand.account.fromEnvironment("ALICE", algo(100));
  const bob = await algorand.account.fromEnvironment("BOB", algo(100));

  console.log("\nSTEP 2\n");
  console.log(`Alice's generated account address: ${alice.addr}.`);
  console.log(`View her account on Lora at https://lora.algokit.io/localnet/account/${alice.addr}.`);
  console.log(`Bob's generated account address: ${bob.addr}.`);
  console.log(`View his account on Lora at https://lora.algokit.io/localnet/account/${bob.addr}.`);

  // -------------------------------- Step 3 -------------------------------- #
  // Alice sends an Algo payment transaction to Bob
  const payResult = await algorand.send.payment({
    sender: alice.addr,
    receiver: bob.addr,
    amount: algo(2),
    note: "Hi, Bob!",
  });

  console.log("\nSTEP 3\n");
  console.log(`Pay transaction confirmed with TxnID: ${payResult.txIds}.`);
  console.log(`View it on Lora at https://lora.algokit.io/localnet/transaction/${payResult.txIds[0]}.`);

  // -------------------------------- Step 4 -------------------------------- #
  // Alice creates an Algorand Standard Asset (ASA)
  const createAssetResult = await algorand.send.assetCreate({
    sender: alice.addr,
    assetName: "My First ASA",
    unitName: "MFA",
    total: 1_000_000_000_000n,
    decimals: 6,
    defaultFrozen: false,
    manager: alice.addr,
    reserve: alice.addr,
    freeze: alice.addr,
    clawback: alice.addr,
    url: "https://algorand.co/algokit",
    note: "This is my first Algorand Standard Asset!",
  });

  // Store the Asset ID Alice created in a variable for later use in the script
  const createdAssetId = createAssetResult.assetId;

  console.log("\nSTEP 4\n");
  console.log(`Asset ID ${createdAssetId} create transaction confirmed with TxnID: ${createAssetResult.txIds[0]}.`);
  console.log(`View it on Lora at https://lora.algokit.io/localnet/asset/${createdAssetId}.`);

  // -------------------------------- Step 5 -------------------------------- #
  // Get ASA information from algod's /v2/assets REST API endpoint
  const assetInfo = await algorand.asset.getById(createdAssetId);

  console.log("\nSTEP 5\n");
  console.log(`Asset information from algod's /v2/assets/{asset-id} REST API endpoint:`, assetInfo);
  console.log("Learn about and explore the algod REST API at https://dev.algorand.co/reference/rest-api/overview/#algod-rest-endpoints.");

  // -------------------------------- Step 6 -------------------------------- #
  // Bob opts in to the ASA so that he will be able to hold it
  const bobOptInResult = await algorand.send.assetOptIn({
    sender: bob.addr,
    assetId: createdAssetId,
  });

  console.log("\nSTEP 6\n");
  console.log(`Asset opt-in transaction confirmed with TxnID: ${bobOptInResult.txIds[0]}. `);
  console.log(`View it on Lora at https://lora.algokit.io/localnet/transaction/${bobOptInResult.txIds[0]}.`);

  // -------------------------------- Step 7 -------------------------------- #
  // Alice sends some of the ASA to Bob
  const sendAssetResult = await algorand.send.assetTransfer({
    sender: alice.addr,
    receiver: bob.addr,
    assetId: createdAssetId,
    amount: 3_000_000n,
    note: "Have a few of my first ASA!",
  });

  console.log("\nSTEP 7\n");
  console.log(`Asset transfer transaction confirmed with TxnID: ${sendAssetResult.txIds[0]}.`);
  console.log(`View it on Lora at https://lora.algokit.io/localnet/transaction/${sendAssetResult.txIds[0]}.`);

  // -------------------------------- Step 8 -------------------------------- #
  // Get Bob's account information
  const bobAccountInfo = await algorand.account.getInformation(bob.addr);

  console.log("\nSTEP 8\n");
  console.log(`Bob's account information from algod's /v2/accounts/{address} REST API endpoint:`, bobAccountInfo);
  console.log("Learn about and explore the algod REST API at https://dev.algorand.co/reference/rest-api/overview/#algod-rest-endpoints.");

  // -------------------------------- Step 9 -------------------------------- #
  // Build an atomic transaction group with two transactions
  const groupResult = await algorand.send
    .newGroup()
    .addPayment({
      sender: bob.addr,
      receiver: alice.addr,
      amount: algo(1),
      note: "Thanks, Alice!",
    })
    .addAssetTransfer({
      sender: bob.addr,
      receiver: alice.addr,
      assetId: createdAssetId,
      amount: 1_000_000n,
      note: "Here's your ASA back, Alice!",
    })
    .send();

  console.log("\nSTEP 9\n");
  console.log(`Atomic transaction group confirmed with first TxnID: ${groupResult.txIds[0]}.`);
  console.log(`View it on Lora at https://lora.algokit.io/localnet/transaction/${groupResult.txIds[0]}.`);

  // -------------------------------- Step 10 -------------------------------- #
  // Search the indexer for the asset transfer transactions
  console.log("\nSTEP 10\n");
  console.log("\nSleeping for 30 seconds to let the LocalNet indexer to catch up, which can sometimes take a moment.");

  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Here the AlgorandClient exposes the underlying SDK indexer client to build
  // the query with various parameters. Be mindful of how broad the query is
  // to avoid long-running requests or needing to page through many results.
  const transferSearchResults = await algorand.client.indexer.searchForTransactions().assetID(createdAssetId).txType("axfer").do();

  const foundTxnIds = transferSearchResults.transactions.map((txn) => txn.id);
  console.log(`\nAsset transfer transaction IDs found by searching the indexer:`, foundTxnIds);
  console.log(
    "\nLearn about and explore the indexer REST API at https://dev.algorand.co/reference/rest-api/overview/#indexer-rest-endpoints."
  );
  console.log("🙌 Congrats on interacting with the Algorand chain with TypeScript!");
}

// Execute the main function
main().catch((error) => {
  console.error("An error occurred:", error);
});
