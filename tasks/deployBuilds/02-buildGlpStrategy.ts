import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDeployerVMAdd } from 'tapioca-sdk/dist/ethers/hardhat/DeployerVM';
import { GlpStrategy__factory } from '../../typechain';
import { ARGS_CONFIG } from '../config';

export const buildGlpStrategy = async (
    hre: HardhatRuntimeEnvironment,
    tag: string,
    wethUsdgOracleAddress: string,
    wethUsdgOracleData: any,
    wethGlpOracleAddress: string,
    wethGlpOracleData: any,
    gmxGlpOracleAddress: string,
    gmxGlpOracleData: any,
): Promise<IDeployerVMAdd<GlpStrategy__factory>> => {
    const chainInfo = hre.SDK.utils.getChainBy(
        'chainId',
        await hre.getChainId(),
    );
    if (!chainInfo) {
        throw new Error('[-] Chain not found');
    }

    const chainID = chainInfo.chainId;

    if (!ARGS_CONFIG[chainID]?.MISC?.GMX_REWARD_ROUTER)
        throw new Error('[-] GMX Reward router not found');

    if (!ARGS_CONFIG[chainID]?.MISC?.GLP_REWARD_ROUTER)
        throw new Error('[-] GLP Reward router not found');

    if (!ARGS_CONFIG[chainID]?.MISC?.SGLP_ADDRESS)
        throw new Error('[-] sGLP not found');

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
    const args: Parameters<GlpStrategy__factory['deploy']> = [
        yb.address,
        ARGS_CONFIG[chainID]?.MISC?.GMX_REWARD_ROUTER,
        ARGS_CONFIG[chainID]?.MISC?.GLP_REWARD_ROUTER,
        ARGS_CONFIG[chainID]?.MISC?.SGLP_ADDRESS,
        wethUsdgOracleAddress,
        wethUsdgOracleData,
        wethGlpOracleAddress,
        wethGlpOracleData,
        gmxGlpOracleAddress,
        gmxGlpOracleData,
        deployer.address,
    ];

    return {
        contract: await hre.ethers.getContractFactory('GlpStrategy'),
        deploymentName: 'GlpStrategy',
        args,
    };
};
