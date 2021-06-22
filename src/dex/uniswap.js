import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import uniswapRouter from '../../abi/UniswapV2Router02.json';
import uniswapCalleeAbi from '../../abi/UniswapV2CalleeDai.json';

export default class UniswapAdaptor {
  _book = {
    sellAmount: '',
    receiveAmount: ''
  };
  _lastBlock = 0;
  _collateralName = '';
  _decNormalized;
  _decNormalized0 = BigNumber.from('10').pow(18);
  _decNormalized1 = BigNumber.from('10').pow(18);

  constructor(assetAddress, callee, collateralName) {
    this._provider = network.provider;
    this._asset = assetAddress;
    this._collateralName = collateralName;
    this._decNormalized = BigNumber.from('10').pow(
      18 - Config.vars.collateral[collateralName].decimals
    );
    if (typeof(Config.vars.collateral[this._collateralName].token0) !== 'undefined') {
      this._decNormalized0 = BigNumber.from('10').pow(
        18 - Config.vars.collateral[collateralName].token0.decimals
      );
      this._decNormalized1 = BigNumber.from('10').pow(
        18 - Config.vars.collateral[collateralName].token1.decimals
      );
    }
    this._callee = new ethers.Contract(
      callee, uniswapCalleeAbi, this._provider
    );
    this._uniswap = new ethers.Contract(
      Config.vars.UniswapV2Router, uniswapRouter, this._provider
    );
  }

  // ilkAmount in WEI
  fetch = async (_ilkAmount) => {
    let ilkAmount = BigNumber.from(_ilkAmount).div(this._decNormalized);
    try {
      const blockNumber = await this._provider.getBlockNumber();
      if (blockNumber === this._lastBlock) return;
      this._lastBlock = blockNumber;

      if (typeof(Config.vars.collateral[this._collateralName].token0) !== 'undefined') {
        // TODO: big numbers are a quick hack for testing.  Need to figure out
        // how to get the amount of token0 and token1 in the LP token.  A quick
        // look at the router didn't yeild me an interface that would work.
        let ilkAmount0 = BigNumber.from('10').pow(24); // 1 million
        let ilkAmount1 = BigNumber.from('10').pow(24); // 1 million

        let offer0 = [ilkAmount0];
        let offer1 = [ilkAmount1];

        if (Config.vars.collateral[this._collateralName].token0.name !== 'DAI') {
          offer0 = await this._uniswap.getAmountsOut(
            ilkAmount0,
            Config.vars.collateral[this._collateralName].token0.route
          );
        }
        if (Config.vars.collateral[this._collateralName].token0.name !== 'DAI') {
          offer1 = await this._uniswap.getAmountsOut(
            ilkAmount1,
            Config.vars.collateral[this._collateralName].token1.route
          );
        }

        this._book.sellAmount = ethers.utils.formatUnits(
          offer0[0].mul(this._decNormalized0)
            .add(offer1[0].mul(this._decNormalized1))
        );
        this._book.receiveAmount = ethers.utils.formatUnits(
          offer0[offer0.length - 1].add(offer1[offer1.length - 1])
        );
      } else {
        const offer = await this._uniswap.getAmountsOut(
          ilkAmount, Config.vars.collateral[this._collateralName].uniswapRoute
        );
        this._book.sellAmount = ethers.utils.formatUnits(
          offer[0].mul(this._decNormalized)
        );
        this._book.receiveAmount = ethers.utils.formatUnits(
          offer[offer.length - 1]
        );
      }
    } catch (e) {
      console.log(
        `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }
  }

  opportunity = () => {
    return this._book;
  }
}
