import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const updatePauseOnGlp__task = async (
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

    const { status } = await inquirer.prompt({
        type: 'confirm',
        name: 'status',
        message: 'Pause?',
    });

    await (await strat.updatePause(status)).wait(3);
};
