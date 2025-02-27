//  Copyright (C) 2020 Maker Ecosystem Growth Holdings, INC.

//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
//  GNU Affero General Public License for more details.

//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

/*
* JS script intended to to create risky vaults with the LINK-A collateral.
* And call dog.bark() on all urns right after they are created. 
*
*__________________RUN____________________
* To run:
* - paste your private key in privateKey
* - paste dog contract address in dogAddress 
* - Get free Kovan LINK from https://kovan.chain.link/
* - Make sure to have enought Kovan ETH
* - Define how much LINK you want in 'lockAmount' to lock up 
* - and it'll borrow all available Dai. Minimum is 100 DAI worth of collateral on Kovan
*/

import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, LINK } from '@makerdao/dai-plugin-mcd';
import BigNumber from 'bignumber.js';
BigNumber.config = { ROUNDING_MODE: BigNumber.ROUND_DOWN };


let maker;
let web3;
let kprAddress = '';
const lockAmount = 5;

const dogAddress = '0x121D0953683F74e9a338D40d9b4659C0EBb539a0'; // setup dog contract address
const privateKey = ''; // insert wallet private key
let linkBalance;
const ilk = '0x4c494e4b2d410000000000000000000000000000000000000000000000000000';
let urns = [];


const kovanAddresses = {
    "CHANGELOG": "0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F",
    "MULTICALL": "0xC6D81A2e375Eee15a20E6464b51c5FC6Bb949fdA",
    "FAUCET": "0x57aAeAE905376a4B1899bA81364b4cE2519CBfB3",
    "MCD_DEPLOY": "0x13141b8a5E4A82Ebc6b636849dd6A515185d6236",
    "FLIP_FAB": "0x7c890e1e492FDDA9096353D155eE1B26C1656a62",
    "MCD_GOV": "0xAaF64BFCC32d0F15873a02163e7E500671a4ffcD",
    "GOV_GUARD": "0xE50303C6B67a2d869684EFb09a62F6aaDD06387B",
    "MCD_ADM": "0x27E0c9567729Ea6e3241DE74B3dE499b7ddd3fe6",
    "VOTE_PROXY_FACTORY": "0x1400798AA746457E467A1eb9b3F3f72C25314429",
    "MCD_VAT": "0xbA987bDB501d131f766fEe8180Da5d81b34b69d9",
    "MCD_JUG": "0xcbB7718c9F39d05aEEDE1c472ca8Bf804b2f1EaD",
    "MCD_CAT": "0xdDb5F7A3A5558b9a6a1f3382BD75E2268d1c6958",
    "MCD_VOW": "0x0F4Cbe6CBA918b7488C26E29d9ECd7368F38EA3b",
    "MCD_JOIN_DAI": "0x5AA71a3ae1C0bd6ac27A1f28e1415fFFB6F15B8c",
    "MCD_FLAP": "0xc6d3C83A080e2Ef16E4d7d4450A869d0891024F5",
    "MCD_FLOP": "0x52482a3100F79FC568eb2f38C4a45ba457FBf5fA",
    "MCD_PAUSE": "0x8754E6ecb4fe68DaA5132c2886aB39297a5c7189",
    "MCD_PAUSE_PROXY": "0x0e4725db88Bb038bBa4C4723e91Ba183BE11eDf3",
    "MCD_GOV_ACTIONS": "0x0Ca17E81073669741714354f16D800af64e95C75",
    "MCD_DAI": "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
    "MCD_SPOT": "0x3a042de6413eDB15F2784f2f97cC68C7E9750b2D",
    "MCD_POT": "0xEA190DBDC7adF265260ec4dA6e9675Fd4f5A78bb",
    "MCD_ESM": "0x0C376764F585828ffB52471c1c35f855e312a06c",
    "PROXY_ACTIONS": "0xd1D24637b9109B7f61459176EdcfF9Be56283a7B",
    "PROXY_ACTIONS_END": "0x7c3f28f174F2b0539C202a5307Ff48efa61De982",
    "PROXY_ACTIONS_DSR": "0xc5CC1Dfb64A62B9C7Bb6Cbf53C2A579E2856bf92",
    "CDP_MANAGER": "0x1476483dD8C35F25e568113C5f70249D3976ba21",
    "DSR_MANAGER": "0x7f5d60432DE4840a3E7AE7218f7D6b7A2412683a",
    "GET_CDPS": "0x592301a23d37c591C5856f28726AF820AF8e7014",
    "ILK_REGISTRY": "0xedE45A0522CA19e979e217064629778d6Cc2d9Ea",
    "OSM_MOM": "0x5dA9D1C3d4f1197E5c52Ff963916Fe84D2F5d8f3",
    "FLIPPER_MOM": "0x50dC6120c67E456AdA2059cfADFF0601499cf681",
    "MCD_IAM_AUTO_LINE": "0xe7D7d61c0ed9306B6c93E7C65F6C9DDF38b9320b",
    "PROXY_FACTORY": "0xe11E3b391F7E8bC47247866aF32AF67Dd58Dc800",
    "PROXY_REGISTRY": "0x64A436ae831C1672AE81F674CAb8B6775df3475C",
    "ETH": "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
    "PIP_ETH": "0x75dD74e8afE8110C8320eD397CcCff3B8134d981",
    "MCD_JOIN_ETH_A": "0x775787933e92b709f2a3C70aa87999696e74A9F8",
    "MCD_FLIP_ETH_A": "0x750295A8db0580F32355f97de7918fF538c818F1",
    "MCD_JOIN_ETH_B": "0xd19A770F00F89e6Dd1F12E6D6E6839b95C084D85",
    "MCD_FLIP_ETH_B": "0x360e15d419c14f6060c88Ac0741323C37fBfDa2D",
    "MCD_JOIN_ETH_C": "0xD166b57355BaCE25e5dEa5995009E68584f60767",
    "MCD_FLIP_ETH_C": "0x6EB1922EbfC357bAe88B4aa5aB377A8C4DFfB4e9",
    "BAT": "0x9f8cFB61D3B2aF62864408DD703F9C3BEB55dff7",
    "PIP_BAT": "0x5C40C9Eb35c76069fA4C3A00EA59fAc6fFA9c113",
    "MCD_JOIN_BAT_A": "0x2a4C485B1B8dFb46acCfbeCaF75b6188A59dBd0a",
    "MCD_FLIP_BAT_A": "0x44Acf0eb2C7b9F0B55723e5289437AefE8ef7a1c",
    "USDC": "0xBD84be3C303f6821ab297b840a99Bd0d4c4da6b5",
    "PIP_USDC": "0x4c51c2584309b7BF328F89609FDd03B3b95fC677",
    "MCD_JOIN_USDC_A": "0x4c514656E7dB7B859E994322D2b511d99105C1Eb",
    "MCD_FLIP_USDC_A": "0x17C144eaC1B3D6777eF2C3fA1F98e3BC3c18DB4F",
    "MCD_JOIN_USDC_B": "0xaca10483e7248453BB6C5afc3e403e8b7EeDF314",
    "MCD_FLIP_USDC_B": "0x6DCd745D91AB422e962d08Ed1a9242adB47D8d0C",
    "WBTC": "0x7419f744bBF35956020C1687fF68911cD777f865",
    "PIP_WBTC": "0x2f38a1bD385A9B395D01f2Cbf767b4527663edDB",
    "MCD_JOIN_WBTC_A": "0xB879c7d51439F8e7AC6b2f82583746A0d336e63F",
    "MCD_FLIP_WBTC_A": "0x80Fb08f2EF268f491D6B58438326a3006C1a0e09",
    "TUSD": "0xD6CE59F06Ff2070Dd5DcAd0866A7D8cd9270041a",
    "PIP_TUSD": "0xE4bAECdba7A8Ff791E14c6BF7e8089Dfdf75C7E7",
    "MCD_JOIN_TUSD_A": "0xe53f6755A031708c87d80f5B1B43c43892551c17",
    "MCD_FLIP_TUSD_A": "0x867711f695e11663eC8adCFAAD2a152eFBA56dfD",
    "ZRX": "0xC2C08A566aD44129E69f8FC98684EAA28B01a6e7",
    "PIP_ZRX": "0x218037a42947E634191A231fcBAEAE8b16a39b3f",
    "MCD_JOIN_ZRX_A": "0x85D38fF6a6FCf98bD034FB5F9D72cF15e38543f2",
    "MCD_FLIP_ZRX_A": "0x798eB3126f1d5cb54743E3e93D3512C58f461084",
    "KNC": "0x9800a0a3c7e9682e1AEb7CAA3200854eFD4E9327",
    "PIP_KNC": "0x10799280EF9d7e2d037614F5165eFF2cB8522651",
    "MCD_JOIN_KNC_A": "0xE42427325A0e4c8e194692FfbcACD92C2C381598",
    "MCD_FLIP_KNC_A": "0xF2c21882Bd14A5F7Cb46291cf3c86E53057FaD06",
    "MANA": "0x221F4D62636b7B51b99e36444ea47Dc7831c2B2f",
    "PIP_MANA": "0xE97D2b077Fe19c80929718d377981d9F754BF36e",
    "MCD_JOIN_MANA_A": "0xdC9Fe394B27525e0D9C827EE356303b49F607aaF",
    "MCD_FLIP_MANA_A": "0xb2B7430D49D2D2e7abb6a6B4699B2659c141A2a6",
    "USDT": "0x9245BD36FA20fcD292F4765c4b5dF83Dc3fD5e86",
    "PIP_USDT": "0x3588A7973D41AaeA7B203549553C991C4311951e",
    "MCD_JOIN_USDT_A": "0x9B011a74a690dFd9a1e4996168d3EcBDE73c2226",
    "MCD_FLIP_USDT_A": "0x113733e00804e61D5fd8b107Ca11b4569B6DA95D",
    "PAXUSD": "0xa6383AF46c36219a472b9549d70E4768dfA8894c",
    "PIP_PAXUSD": "0xD01fefed46eb21cd057bAa14Ff466842C31a0Cd9",
    "MCD_JOIN_PAXUSD_A": "0x3d6a14C9542B429a4e3d255F6687754d4898D897",
    "MCD_FLIP_PAXUSD_A": "0x88001b9C8192cbf43e14323B809Ae6C4e815E12E",
    "COMP": "0x1dDe24ACE93F9F638Bfd6fCE1B38b842703Ea1Aa",
    "PIP_COMP": "0xcc10b1C53f4BFFEE19d0Ad00C40D7E36a454D5c4",
    "MCD_JOIN_COMP_A": "0x16D567c1F6824ffFC460A11d48F61E010ae43766",
    "MCD_FLIP_COMP_A": "0x2917a962BC45ED48497de85821bddD065794DF6C",
    "LRC": "0xF070662e48843934b5415f150a18C250d4D7B8aB",
    "PIP_LRC": "0xcEE47Bb8989f625b5005bC8b9f9A0B0892339721",
    "MCD_JOIN_LRC_A": "0x436286788C5dB198d632F14A20890b0C4D236800",
    "MCD_FLIP_LRC_A": "0xfC9496337538235669F4a19781234122c9455897",
    "LINK": "0xa36085F69e2889c224210F603D836748e7dC0088",
    "PIP_LINK": "0x20D5A457e49D05fac9729983d9701E0C3079Efac",
    "MCD_JOIN_LINK_A": "0xF4Df626aE4fb446e2Dcce461338dEA54d2b9e09b",
    "MCD_FLIP_LINK_A": "0xfbDCDF5Bd98f68cEfc3f37829189b97B602eCFF2",
    "BAL": "0x630D82Cbf82089B09F71f8d3aAaff2EBA6f47B15",
    "PIP_BAL": "0x4fd34872F3AbC07ea6C45c7907f87041C0801DdE",
    "MCD_JOIN_BAL_A": "0x8De5EA9251E0576e3726c8766C56E27fAb2B6597",
    "MCD_FLIP_BAL_A": "0xF6d19CC05482Ef7F73f09c1031BA01567EF6ac0f",
    "YFI": "0x251F1c3077FEd1770cB248fB897100aaE1269FFC",
    "PIP_YFI": "0x9D8255dc4e25bB85e49c65B21D8e749F2293862a",
    "MCD_JOIN_YFI_A": "0x5b683137481F2FE683E2f2385792B1DeB018050F",
    "MCD_FLIP_YFI_A": "0x5eB5D3B028CD255d79019f7C44a502b31bFFde9d",
    "GUSD": "0x31D8EdbF6F33ef858c80d68D06Ec83f33c2aA150",
    "PIP_GUSD": "0xb6630DE6Eda0f3f3d96Db4639914565d6b82CfEF",
    "MCD_JOIN_GUSD_A": "0x0c6B26e6AB583D2e4528034037F74842ea988909",
    "MCD_FLIP_GUSD_A": "0xf6c0e36a76F2B9F7Bd568155F3fDc53ff1be1Aeb",
    "UNI": "0x0C527850e5D6B2B406F1d65895d5b17c5A29Ce51",
    "PIP_UNI": "0xe573a75BF4827658F6D600FD26C205a3fe34ee28",
    "MCD_JOIN_UNI_A": "0xb6E6EE050B4a74C8cc1DfdE62cAC8C6d9D8F4CAa",
    "MCD_FLIP_UNI_A": "0x6EE8a47eA5d7cF0C951eDc57141Eb9593A36e680",
    "RENBTC": "0xe3dD56821f8C422849AF4816fE9B3c53c6a2F0Bd",
    "PIP_RENBTC": "0x2f38a1bD385A9B395D01f2Cbf767b4527663edDB",
    "MCD_JOIN_RENBTC_A": "0x12F1F6c7E5fDF1B671CebFBDE974341847d0Caa4",
    "MCD_FLIP_RENBTC_A": "0x2a2E2436370e98505325111A6b98F63d158Fedc4",
    "AAVE": "0x7B339a530Eed72683F56868deDa87BbC64fD9a12",
    "PIP_AAVE": "0xd2d9B1355Ea96567E7D6C7A6945f5c7ec8150Cc9",
    "MCD_JOIN_AAVE_A": "0x9f1Ed3219035e6bDb19E0D95d316c7c39ad302EC",
    "MCD_FLIP_AAVE_A": "0x3c84d572749096b67e4899A95430201DF79b8403",
    "UNIV2DAIETH": "0xB10cf58E08b94480fCb81d341A63295eBb2062C2",
    "PIP_UNIV2DAIETH": "0x1AE7D6891a5fdAafAd2FE6D894bffEa48F8b2454",
    "MCD_JOIN_UNIV2DAIETH_A": "0x03f18d97D25c13FecB15aBee143276D3bD2742De",
    "MCD_FLIP_UNIV2DAIETH_A": "0x0B6C3512C8D4300d566b286FC4a554dAC217AaA6",
    "RWA001": "0x8F9A8cbBdfb93b72d646c8DEd6B4Fe4D86B315cB",
    "PIP_RWA001": "0x09710C9440e5FF5c473efe61d5a2f14cA05A6752",
    "MCD_JOIN_RWA001_A": "0x029A554f252373e146f76Fa1a7455f73aBF4d38e",
    "MIP21_LIQUIDATION_ORACLE": "0x2881c5dF65A8D81e38f7636122aFb456514804CC",
    "RWA001_A_URN": "0x3Ba90D86f7E3218C48b7E0FCa959EcF43d9A30F4",
    "RWA001_A_INPUT_CONDUIT": "0xB944B07EC3B680b2cEA753125667F7663d424DC3",
    "RWA001_A_OUTPUT_CONDUIT": "0xc54fEee07421EAB8000AC8c921c0De9DbfbE780B",
    "PROXY_PAUSE_ACTIONS": "0x7c52826c1efEAE3199BDBe68e3916CC3eA222E29",
    "PROXY_DEPLOYER": "0xA9fCcB07DD3f774d5b9d02e99DE1a27f47F91189",
    "MCD_DOG": "0x121D0953683F74e9a338D40d9b4659C0EBb539a0",
    "MCD_END": "0x0D1a98E93d9cE32E44bC035e8C6E4209fdB70C27",
    "MCD_ESM_BUG": "0x0798603b8AE1f76D2823aDbc2E15d047Eac1Efd7",
    "MCD_ESM_ATTACK": "0x23Aa7cbeb266413f968D284acce3a3f9EEFFC2Ec",
    "ILK_REGISTRY": "0xB3fBb13b831F254DbBB9a1abdb81d8D91589B3B4",
    "CLIPPER_MOM": "0x96E9a19Be6EA91d1C0908e5E207f944dc2E7B878",
    "MCD_CLIP_LINK_A": "0x1eB71cC879960606F8ab0E02b3668EEf92CE6D98",
    "MCD_CLIP_CALC_LINK_A": "0xbd586d6352Fcf0C45f77FC9348F4Ee7539F6e2bD"
};


(async () => {
    //Setting up custom kovan contracts

    const otherNetworksOverrides = [
        { network: 'kovan', contracts: kovanAddresses }
    ].reduce((acc, { network, contracts }) => {
        for (const [contractName, contractAddress] of Object.entries(contracts)) {
            if (!acc[contractName]) acc[contractName] = {};
            acc[contractName][network] = contractAddress;
        }
        return acc;
    }, {});

    const addressOverrides = ['kovan'].some(
        networkName => networkName === 'kovan'
    )
        ? otherNetworksOverrides
        : {};

    const cdpTypes = [
        { currency: ETH, ilk: 'ETH-A' },
        { currency: LINK, ilk: 'LINK-A' }
    ];

    const mcdPluginConfig = {
        cdpTypes,
        addressOverrides
    };


    console.log('Initiating Maker Service from Dai.js');
    maker = await Maker.create('http', {
        plugins: [
            [McdPlugin, mcdPluginConfig]
        ],
        smartContract: {
            addressOverrides
        },
        url: 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a',
        privateKey: privateKey,
        web3: {
            transactionSettings: {
                gasLimit: 7000000
            }
        }
    });

    web3 = await maker.service('web3')._web3;
    console.log('web3 ', await web3.eth.net.getNetworkType());

    const kprAddress = maker.currentAddress();
    const linkToken = await maker.getToken(LINK);
    linkBalance = await linkToken.balance();
    console.log('Current Wallet Address: ', kprAddress);
    console.log('Link balance ', linkBalance._amount);

    if (Number(linkBalance._amount) < 5) throw 'NOT ENOUGHT LINK-A BALANCE';

    console.log('Ensure there is proxy address');
    await maker.service('proxy').ensureProxy();
    const proxyAddress = await maker.service('proxy').getProxyAddress();
    console.log('Proxy Address: ', proxyAddress);

    //Check for token allowance
    const linkAllowance = await linkToken.allowance(kprAddress, proxyAddress);
    if (Number(linkAllowance._amount) === 0) {
        console.log('Approving Proxy to use LINK');
        await linkToken.approveUnlimited(proxyAddress);
    }

    // while (Number(linkBalance._amount) > 5) {
    await createVaults();
    // }

    //Barking on all urns
    console.log(' ');
    console.log('Risky Urns');

    const dogContract = new web3.eth.Contract(dogAbi, dogAddress);
    
    const bark = async (urn) => {
        await dogContract.methods.bark(ilk, urn, kprAddress)
            .send({
                from: kprAddress,
                gasPrice: '20000000000',
                gasLimit: '7000000'
            })
            .on('error', error => console.log(error))
            .on('receipt', receipt => console.log('Tx Hash: ', receipt.transactionHash));
    };

    for (let i = 0; i < urns.length; i++) {
        console.log('Barking ', urns[i]);
        await bark(urns[i]);
    }

    console.log('Barked Urns: ');
    for (let i = 0; i < urns.length; i++) {
        console.log(urns[i]);
    }

    process.kill(process.pid, 'SIGTERM');
})();

const createVaults = async () => {
    //create risky vault using ETH-A 
    console.log(' ');
    console.log('--------------------------------------------------------------------');
    console.log('Creating risky vault');
    const manager = maker.service('mcd:cdpManager');

    const vault = await manager.open('LINK-A');
    let vaultId = vault.id;
    console.log('Vault ID', vaultId);

    console.log(`Lockig ${lockAmount} LINK-A`);
    await manager.lock(
        vault.id,
        'LINK-A',
        LINK(lockAmount)
    );

    linkBalance = await maker.getToken(LINK).balance();

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip(ilk);


    // Refreshing vault data
    vault.reset();
    await vault.prefetch();

    // Reading Vault Information
    let managedVault = await manager.getCdp(vaultId);
    managedVault.reset();
    await managedVault.prefetch();
    const vaultUrnAddr = await manager.getUrn(vaultId);
    console.log('Vault: Urn Address', vaultUrnAddr);
    urns.push(vaultUrnAddr);

    const amtDai = managedVault.daiAvailable._amount;

    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('DAI Available to Generate', managedVault.daiAvailable._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);

    console.log(' ');

    const dai = new BigNumber(amtDai);
    const m = dai.multipliedBy(0.0000000001);
    const dart = dai.minus(m);
    console.log(`Drawing ${dart} from Vault #${vaultId}`);

    try {
        let drawDai = await manager.draw(
            vaultId,
            'LINK-A',
            DAI(dart.toString())
        );
        drawDai;
    } catch (error) {
        if (error) {
            console.error(error);
            process.kill(process.pid, 'SIGTERM');
        }
    }

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip(ilk);


    //Refreshing Vault Data
    managedVault.reset();
    await managedVault.prefetch();

    // Getting Updated state from Vault
    console.log(' ');
    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('DAI Available to Generate', managedVault.daiAvailable._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);
};



const dogAbi = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "ilk",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "urn",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "kpr",
                "type": "address"
            }
        ],
        "name": "bark",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

