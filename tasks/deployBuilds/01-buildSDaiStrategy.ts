import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDeployerVMAdd } from 'tapioca-sdk/dist/ethers/hardhat/DeployerVM';
import { SDaiStrategy__factory } from '../../typechain';
import { ARGS_CONFIG } from '../config';

export const buildSDaiStrategy = async (
    hre: HardhatRuntimeEnvironment,
    tag: string,
    tokenAddress: string,
    feeRecipient: string,
    feeBps: string,
): Promise<IDeployerVMAdd<SDaiStrategy__factory>> => {
    const chainInfo = hre.SDK.utils.getChainBy(
        'chainId',
        await hre.getChainId(),
    );
    if (!chainInfo) {
        throw new Error('[-] Chain not found');
    }

    const chainID = chainInfo.chainId;

    if (!ARGS_CONFIG[chainID]?.MISC?.SDAI_ADDRESS)
        throw new Error('[-] sDai not found');

    let yb = hre.SDK.db
        .loadGlobalDeployment(tag, 'yieldbox', chainInfo.chainId)
        .find((e) => e.name == 'YieldBox');

    if (!yb) {
        yb = hre.SDK.db
            .loadLocalDeployment(tag, chainInfo.chainId)
            .find((e) => e.name == 'YieldBox');
    }
    if (!yb) throw new Error('[-] YieldBox not found');

    const deployer = (await hre.ethers.getSigners())[0];
    const args: Parameters<SDaiStrategy__factory['deploy']> = [
        yb.address,
        tokenAddress,
        ARGS_CONFIG[chainID]?.MISC?.SDAI_ADDRESS,
        feeRecipient,
        feeBps,
        deployer.address,
    ];

    return {
        contract: await hre.ethers.getContractFactory('sDaiStrategy'),
        deploymentName: 'sDaiStrategy',
        args,
    };
}