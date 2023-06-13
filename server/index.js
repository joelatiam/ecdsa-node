const express = require("express");
const app = express();
const cors = require("cors");
const {sha256}  = require('ethereum-cryptography/sha256');
const  {secp256k1} = require("ethereum-cryptography/secp256k1");
const {toHex, utf8ToBytes} = require( 'ethereum-cryptography/utils');
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "029c4e0848d84044ce5fb57bca79d10a03512565b57d1491f81755f29bfc46e782": 100,
  "02920c2144b3070dbbba8156837c5b7e5f0c3b1aa8e11ddcaede025211cc0ea87c": 50,
  "02157a910565a4241ac9ac6b191f4a25f975f9c4ea83ab4b32334e73b69247ab00": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  // TODO: get a signature from the client-side application
  // recover the public address from the signature
  const { sender, recipient, amount, signature } = req.body;
  if(!sender || !recipient || !amount || !signature){
    return res.status(400).send({ message: "Provide Sender, Recipient, Amount, and Signature" });
  }
  if(!signature.r || !signature.s || isNaN(signature.recovery)){
    return res.status(400).send({ message: "Invalid Signature Object" });
  }
  signature.r = BigInt(signature.r);
  signature.s = BigInt(signature.s);

  const transactionData = {
    sender,
    amount,
    recipient,
  };

  const hashedTransactionData = toHex(sha256(utf8ToBytes(JSON.stringify(transactionData))));
  const isSigned = secp256k1.verify(signature, hashedTransactionData, sender);
  if(!isSigned){
    return res.status(403).send({ message: "Transaction Verification Failed" });
  }
  if(sender === recipient){
    return res.status(400).send({ message: "Sender and Recepient Adresses should be different" });
  }
  
  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    return res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    return res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
