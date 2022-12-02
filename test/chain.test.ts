import { ethers } from 'hardhat';
import { expect } from 'chai';

import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe.skip('test', () => {
    it('should test project setup', async () => {
        expect(1).eq(1);

        const netDetails = await ethers.getDefaultProvider().getNetwork();
        console.log(`netDetails ${netDetails.chainId}`);
    });
});
