import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDeployerVMAdd } from 'tapioca-sdk/dist/ethers/hardhat/DeployerVM';
import { GlpStrategy__factory } from '../../typechain';
import { ARGS_CONFIG } from '../config';
import { ContractFactory } from 'ethers';

export const buildGlpStrategy = async (
    hre: HardhatRuntimeEnvironment,
    tag: string,
    tokenAddress: string,
    wethUsdgOracleAddress: string,
    wethUsdgOracleData: any,
    wethGlpOracleAddress: string,
    wethGlpOracleData: any,
    gmxGlpOracleAddress: string,
    gmxGlpOracleData: any,
): Promise<IDeployerVMAdd<ContractFactory>> => {
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
        wethGlpOracleAddress,
        wethGlpOracleData,
        gmxGlpOracleAddress,
        gmxGlpOracleData,
        deployer.address,
    ];

    const token = await hre.ethers.getContractAt(
        'IERC20Metadata',
        tokenAddress,
    );

    return {
        meta: {
            stratFor: await token.name(),
        },
        contract: await hre.ethers.getContractFactory('GlpStrategy'),
        deploymentName: 'GlpStrategy',
        args,
    };
};
