import { HardhatRuntimeEnvironment } from 'hardhat/types';
import inquirer from 'inquirer';
import { loadVM } from '../utils';
import SDK from 'tapioca-sdk';
import { buildTricryptoLPStrategy } from '../deployBuilds/00-buildTricryptoLPStrategy';

export const deployTricrytoLPStrategy__task = async (
    {},
    hre: HardhatRuntimeEnvironment,
) => {
    const tag = await hre.SDK.hardhatUtils.askForTag(hre, 'local');
    const signer = (await hre.ethers.getSigners())[0];
    const VM = await loadVM(hre, tag, true);

    const chainInfo = hre.SDK.utils.getChainBy(
        'chainId',
        await hre.getChainId(),
    );
    if (!chainInfo) {
        throw new Error('Chain not found');
    }

    const project = hre.SDK.config.TAPIOCA_PROJECTS[2];
    const subrepo = hre.SDK.db.SUBREPO_GLOBAL_DB_PATH;
    const yieldBox = await hre.SDK.db
        .loadGlobalDeployment(tag, project, chainInfo.chainId)
        .find((e) => e.name === 'YieldBox');
    if (!yieldBox) {
        throw '[-] YieldBox not found';
    }

    const { tricryptoLiquidityPool } = await inquirer.prompt({
        type: 'input',
        name: 'tricryptoLiquidityPool',
        message: 'Tricrypto Liquidity Pool',
        default: '0x0000000000000000000000000000000000000000',
    });
    const { usdtAddress } = await inquirer.prompt({
        type: 'input',
        name: 'usdtAddress',
        message: 'USDT address',
        default: '0x0000000000000000000000000000000000000000',
    });
    const { wbtcAddress } = await inquirer.prompt({
        type: 'input',
        name: 'wbtcAddress',
        message: 'WBTC address',
        default: '0x0000000000000000000000000000000000000000',
    });
    const { wethAddress } = await inquirer.prompt({
        type: 'input',
        name: 'wethAddress',
        message: 'WETH address',
        default: '0x0000000000000000000000000000000000000000',
    });

    const { lpGauge } = await inquirer.prompt({
        type: 'input',
        name: 'lpGauge',
        message: 'LP Gauge',
        default: '0x0000000000000000000000000000000000000000',
    });

    const { lpMinter } = await inquirer.prompt({
        type: 'input',
        name: 'lpMinter',
        message: 'LP Minter',
        default: '0x0000000000000000000000000000000000000000',
    });

    const { swapper } = await inquirer.prompt({
        type: 'input',
        name: 'swapper',
        message: 'Swapper',
        default: '0x0000000000000000000000000000000000000000',
    });

    const [tricryptoLPGetter, tricryptoLPStrategy] =
        await buildTricryptoLPStrategy(
            hre,
            tricryptoLiquidityPool,
            usdtAddress,
            wbtcAddress,
            wethAddress,
            yieldBox.address,
            lpGauge,
            lpMinter,
            swapper,
        );

    VM.add(tricryptoLPGetter).add(tricryptoLPStrategy);


    const initialBalance = await hre.ethers.provider.getBalance(signer.address);
    // Add and execute
    await VM.execute(3, false);
    VM.save();
    const finalBalance = await hre.ethers.provider.getBalance(signer.address);
    console.log(`Spent ${finalBalance.sub(initialBalance)}`);

    const { wantToVerify } = await inquirer.prompt({
        type: 'confirm',
        name: 'wantToVerify',
        message: 'Do you want to verify the contracts?',
    });
    if (wantToVerify) {
        try {
            await VM.verify();
        } catch {
            console.log('[-] Verification failed');
        }
    }
};
