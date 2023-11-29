import { HardhatRuntimeEnvironment } from 'hardhat/types';
import inquirer from 'inquirer';
import { loadVM } from '../utils';
import SDK from 'tapioca-sdk';
import { buildTricryptoLPStrategy } from '../deployBuilds/00-buildTricryptoLPStrategy';
import { TOKENS_DEPLOYMENTS } from '../../gitsub_tapioca-sdk/src/api/constants';
import { EChainID } from 'tapioca-sdk/dist/api/config';

//deprecated
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
    const yieldBox = await hre.SDK.db
        .loadGlobalDeployment(tag, project, chainInfo.chainId)
        .find((e) => e.name === 'YieldBox');
    if (!yieldBox) {
        throw '[-] YieldBox not found';
    }

    const multiSwapper = await hre.SDK.db
        .loadGlobalDeployment(tag, project, chainInfo.chainId)
        .find((e) => e.name === 'MultiSwapper');
    if (!multiSwapper) {
        throw '[-] MultiSwapper not found';
    }

    const [tricryptoLPGetter, tricryptoLPStrategy] =
        await buildTricryptoLPStrategy(
            hre,
            CURVE_DEPLOYMENTS[chainInfo.chainId as EChainID].tricryptoLiquidityPool,
            TOKENS_DEPLOYMENTS[chainInfo.chainId as EChainID].usdt,
            TOKENS_DEPLOYMENTS[chainInfo.chainId as EChainID].wbtc,
            TOKENS_DEPLOYMENTS[chainInfo.chainId as EChainID].weth,
            yieldBox.address,
            CURVE_DEPLOYMENTS[chainInfo.chainId as EChainID].tricryptoGauge,
            CURVE_DEPLOYMENTS[chainInfo.chainId as EChainID].tricryptoMinter,
            multiSwapper.address,
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
