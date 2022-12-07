import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { verify, updateDeployments, constants, getYieldBox } from './utils';
import _ from 'lodash';
import { TContract } from 'tapioca-sdk/dist/shared';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await hre.getChainId();
    const contracts: TContract[] = [];

    let yieldBoxAddress = getYieldBox(chainId, deployments, hre);

    console.log('\n Deploying Tricrypto LP Getter Strategy');
    const args = [
        constants[chainId].tricryptoLiquidityPool,
        constants[chainId].usdt,
        constants[chainId].wbtc,
        constants[chainId].weth,
    ];
    await deploy('TricryptoLPGetter', {
        from: deployer,
        log: true,
        args,
    });
    await verify(hre, 'TricryptoLPGetter', args);
    const deployedStrategy = await deployments.get('TricryptoLPGetter');
    contracts.push({
        name: 'TricryptoLPGetter',
        address: deployedStrategy.address,
        meta: { constructorArguments: args },
    });
    console.log(
        `Done. Deployed on ${
            deployedStrategy.address
        } with args ${JSON.stringify(args)}`,
    );

    await updateDeployments(contracts, chainId);
};

export default func;
func.tags = ['TricryptoLPGetter'];
