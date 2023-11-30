import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';

export const emergencyWithdrawOnSDai__task = async (
    taskArgs: {},
    hre: HardhatRuntimeEnvironment,
) => {
    const tag = await hre.SDK.hardhatUtils.askForTag(hre, 'local');
    const dep = await hre.SDK.hardhatUtils.getLocalContract(
        hre,
        'sDaiStrategy',
        tag,
    );
    const strat = await hre.ethers.getContractAt(
        'sDaiStrategy',
        dep.contract.address,
    );

    await (await strat.emergencyWithdraw()).wait(3);
};
