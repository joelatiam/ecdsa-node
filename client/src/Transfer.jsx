import { useState } from "react";
import {sha256} from 'ethereum-cryptography/sha256';
import  {secp256k1} from 'ethereum-cryptography/secp256k1';
import {toHex, utf8ToBytes} from 'ethereum-cryptography/utils';
import server from "./server";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    if(!privateKey || !sendAmount || !recipient){
      alert('Provide the Wallet Private key, Amount to Send, and the Recipient Address');
      return;
    }

    const requestData = {
      sender: address,
      amount: parseInt(sendAmount),
      recipient,
    };
    
    const hash = toHex(sha256(utf8ToBytes(JSON.stringify(requestData))));
    const signature = secp256k1.sign(hash, privateKey);

    try {

      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
        signature: {
          r: signature.r.toString(),
          recovery: signature.recovery,
          s: signature.s.toString(),
        },
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
