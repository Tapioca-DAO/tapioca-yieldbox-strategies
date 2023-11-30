import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';

export const emergencyWithdrawOnGlp__task = async (
    {},
    hre: HardhatRuntimeEnvironment,
) => {
    const tag = await hre.SDK.hardhatUtils.askForTag(hre, 'local');
    const dep = await hre.SDK.hardhatUtils.getLocalContract(
        hre,
        'GlpStrategy',
        tag,
    );
    const strat = await hre.ethers.getContractAt(
        'GlpStrategy',
        dep.contract.address,
    );

    await (await strat.emergencyWithdraw()).wait(3);
};
