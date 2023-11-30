import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const updateFeeRecipientOnSDai__task = async (
    {},
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

    const { recipient } = await inquirer.prompt({
        type: 'input',
        name: 'recipient',
        message: 'Fee recipient address',
    });

    await (await strat.updateFeeRecipient(recipient)).wait(3);
};
