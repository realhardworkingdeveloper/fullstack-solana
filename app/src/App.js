import './App.css';
import { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const network = clusterApiUrl('devnet');

const wallets = [ new PhantomWalletAdapter() ];

const { SystemProgram, Keypair } = web3;
const baseAccount = Keypair.generate();
const opts = {
  preflightComponent: "processed"
};
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [value, setValue] = useState('');

  const [data, setData] = useState('');
  const [dataList, setDataList] = useState([]);
  const [input, setInput] = useState('');
  
  const wallet = useWallet()

  async function getProvider() {
    const network = "http:127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightComponent)

    const provider = new Provider(
      connection, wallet, opts.preflightComponent,
    );

    return provider;
  }

  async function createCounter() {
    const provider = await getProvider();

    const program = new Program(idl, programID, provider);

    try {
      await program.rpc.create({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
      setValue(account.count.toString());
    } catch(err) {
      console.log("Transaction error: ", err);
    }
  }

  async function incrementCounter() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    await program.rpc.increment({
      accounts: {
        baseAccount: baseAccount.publicKey
      }
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log("account: ", account);
    setValue(account.count.toString());
  }

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    try {
      await program.rpc.initialize("Hello World", {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
      setData(account.data.toString());
      setDataList(account.dataList);
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function update() {
    if(!input) {
      return
    }

    const provider = await getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.update(input, {
      accounts: {
        baseAccount: baseAccount.publicKey
      }
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
    setData(account.data.toString());
    setDataList(account.dataList);
    setInput('');
  }

  if (!wallet.connected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', mainTop: '100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          {
            !value && (<button onClick={createCounter}>Create Counter</button>)
          }
          {
            value && (<button onClick={incrementCounter}>Increment Counter</button>)
          }

          {
            value && value >= Number(0) ? (
              <h2>{ value }</h2>
            ) : (
              <h3>Please create the counter.</h3>
            )
          }

          {
            !data && (<button onClick={initialize}>Initialize</button>)
          }

          {
            data ? (
              <div>
                <h2>Current data: {data}</h2>
                <input
                  placeholder="Add new data"
                  onChange={e => setInput(e.target.value)}
                  value={input}
                />
                <button onClick={update}>Add data</button>
              </div>
            ) : (
              <h3>Please Inialize.</h3>
            )
          }
          {
            dataList.map((d, i) => <h4 key={i}>{d}</h4>)
          }
        </div>
      </div>
    )
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
