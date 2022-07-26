import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types'
import { metadata } from '@polkadot/types/interfaces/essentials';

const WEB_SOCKET = 'ws://localhost:9944'
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// connect to substrate chain
const connectSubstrate = async () => {
    const wsProvider = new WsProvider(WEB_SOCKET);
    const api = await ApiPromise.create({ provider: wsProvider, types: {} });
    await api.isReady;
    console.log("connection to substrate is Ok.");
    return api;
}


// get const value
const getConst = async (api: ApiPromise) => {
    const existentialDeposit = await api.consts.balances.existentialDeposit.toHuman();
    return existentialDeposit;

};


// get free balance variable 
const getFreeBalance = async (api: ApiPromise, address: string) => {
    const aliceAccount = await api.query.system.account(address);
    return aliceAccount.toHuman();

}

const printAliceBobBalance = async (api: ApiPromise) => {
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    console.log("balance alice is :", await getFreeBalance(api, alice.address));
    console.log("balance bob is :", await getFreeBalance(api, bob.address));

}


// transaction
const transferFromAliceToBob = async (api: ApiPromise, amount: number) => {
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    await api.tx.balances.transfer(bob.address, amount).signAndSend(alice, res => {
        console.log('Tx sataus:${res.status}');
    });


}


// subscribe balance change 
const subscribeAliceBalance = async (api: ApiPromise) => {
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    await api.query.system.account(alice.address, (aliceAcct: { data: { free: number; }; }) => {
        console.log("Subscribed to Alice account");
        const aliceFreeSub = aliceAcct.data.free;
        console.log(`Alice Account (sub): ${aliceFreeSub}`);
    });
};


const main = async () => {
    const api = await connectSubstrate();
    // console.log("const value existentialDeposit is :", await getConst(api));
    // await printAliceBobBalance(api);


    // await transferFromAliceToBob(api, 10 ** 12);
    // 订阅Alice的余额
    await subscribeAliceBalance(api);

    await sleep(6000000);
    // await printAliceBobBalance(api);
};

main().then(() => {
    console.log("successfully exited");
    process.exit(0);
}).catch(err => {
    console.log('error occur:', err);
    process.exit(0);
})