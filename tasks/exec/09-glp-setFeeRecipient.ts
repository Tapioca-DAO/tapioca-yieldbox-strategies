import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const setFeeRecipientOnGlp__task = async (
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

    const { recipient } = await inquirer.prompt({
        type: 'input',
        name: 'recipient',
        message: 'Fee recipient',
    });


    await (await strat.setFeeRecipient(recipient)).wait(3);
};
