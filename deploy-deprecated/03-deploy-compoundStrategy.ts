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

    console.log('\n Deploying Compound Strategy');
    const args = [
        yieldBoxAddress,
        constants[chainId].weth,
        constants[chainId].cEth,
    ];

    await deploy('CompoundStrategy', {
        from: deployer,
        log: true,
        args,
    });
    await verify(hre, 'CompoundStrategy', args);
    const deployedStrategy = await deployments.get('CompoundStrategy');
    contracts.push({
        name: 'CompoundStrategy',
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
func.tags = ['CompoundStrategy'];
