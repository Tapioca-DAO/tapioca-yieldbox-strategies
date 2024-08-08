import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { loadNetworkFork, registerFork } from '../test.utils';

async function become(address: string) {
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
    });
    return ethers.getSigner(address);
}


let BINANCE_WALLET_ADDRESS: string,
    WETH: string,
    USDC: string,
    STARGATEV2_POOL: string,
    STARGATEV2_FARM: string;
describe('stargateV2Strategy-fork test', () => {
    before(function () {
        if (process.env.NETWORK != 'arbitrum') {
            this.skip();
        }
        loadNetworkFork();

        ({
            BINANCE_WALLET_ADDRESS,
            STARGATEV2_POOL,
            STARGATEV2_FARM,
            WETH,
            USDC,
        } = process.env);
    });

    async function setUp() {
        const me = await become(BINANCE_WALLET_ADDRESS);
        const deployer = (await ethers.getSigners())[0];

        const weth = (
            await ethers.getContractAt(
                'IWETHToken',
                WETH,
            )
        ).connect(me);

        const usdc = (
            await ethers.getContractAt(
                '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
                USDC,
            )
        ).connect(me);

        // Deploy YieldBox
        const uriBuilder = await (
            await ethers.getContractFactory('YieldBoxURIBuilder')
        ).deploy();
        await uriBuilder.deployed();
        let yieldBox = await (
            await ethers.getContractFactory('YieldBox')
        ).deploy(weth.address, uriBuilder.address);
        await yieldBox.deployed();
        yieldBox = yieldBox.connect(me);

        const stargateV2Pool = (
            await ethers.getContractAt(
                'tapioca-strategies/interfaces/stargatev2/IStargateV2Pool.sol:IStargateV2Pool',
                STARGATEV2_POOL,
            )
        ).connect(me);

        const stargateV2Farm = (
            await ethers.getContractAt(
                'tapioca-strategies/interfaces/stargatev2/IStargateV2Staking.sol:IStargateV2Staking',
                STARGATEV2_FARM,
            )
        ).connect(me);
        
        return {
            me,
            deployer,
            weth,
            usdc,
            yieldBox,
            stargateV2Pool,
            stargateV2Farm
        };
    }

    it.only('Should set up the strategy', async () => {
        const {
            me,
            deployer,
            weth,
            usdc,
            yieldBox,
            stargateV2Pool,
            stargateV2Farm,
        } = await loadFixture(setUp);
        
        // 10 USDC
        const amount = ethers.BigNumber.from((1e8).toString()).mul(10);
        await usdc.connect(BINANCE_WALLET_ADDRESS).transfer(deployer.address, amount);
    })
});