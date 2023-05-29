import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { deployTricrytoLPStrategy__task } from './tasks/deploy/00-deployTricryptoLP';

task(
    'deployTricryptoLPStrategy',
    'Deploy TricryptoLPStrategy',
    deployTricrytoLPStrategy__task,
);
