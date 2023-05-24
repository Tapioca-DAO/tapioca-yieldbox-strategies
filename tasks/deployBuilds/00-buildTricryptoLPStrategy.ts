import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDeployerVMAdd } from 'tapioca-sdk/dist/ethers/hardhat/DeployerVM';
import {
    TricryptoLPGetter__factory,
    TricryptoLPStrategy__factory,
} from '../../typechain-types';

export const buildTricryptoLPStrategy = async (
    hre: HardhatRuntimeEnvironment,
    tricryptoLiquidityPool: string,
    usdt: string,
    wbtc: string,
    weth: string,
    yieldBox: string,
    gauge: string,
    minter: string,
    swapper: string,
): Promise<
    [
        IDeployerVMAdd<TricryptoLPGetter__factory>,
        IDeployerVMAdd<TricryptoLPStrategy__factory>,
    ]
> => {
    return [
        {
            contract: await hre.ethers.getContractFactory('TricryptoLPGetter'),
            deploymentName: 'TricryptoLPGetter',
            args: [tricryptoLiquidityPool, usdt, wbtc, weth],
            runStaticSimulation: false,
        },
        {
            contract: await hre.ethers.getContractFactory(
                'TricryptoLPStrategy',
            ),
            deploymentName: 'TricryptoLPStrategy',
            args: [
                yieldBox,
                weth,
                gauge,
                hre.ethers.constants.AddressZero,
                minter,
                swapper,
            ],
            dependsOn: [
                { argPosition: 3, deploymentName: 'TricryptoLPGetter' },
            ],
            runStaticSimulation: false,
        },
    ];
};
