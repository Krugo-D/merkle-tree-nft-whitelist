import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { makeMerkleTree } from '../utils/merkletree';
import { makeUsers, usersQuantity } from '../utils/data';

describe('LynexKeys', function () {
  async function createTestFixture() {
    const merkleTreeData = await makeMerkleTree();
    const users = await makeUsers();
    const { root } = merkleTreeData;

    const LynexKeys = await ethers.getContractFactory('LynexKeys');
    const lynexKeys = await LynexKeys.deploy(root);

    return { lynexKeys, merkleTreeData, users };
  }
  beforeEach(async function () {
    const { lynexKeys, users, merkleTreeData } = await loadFixture(
      createTestFixture
    );
    this.lynexKeys = lynexKeys;
    this.users = users;
    this.merkleTreeData = merkleTreeData;
  });

  describe('Deployment', function () {
    it('Should return correct name and symbol', async function () {
      expect(await this.lynexKeys.name()).to.equal('Lynex Keys');
      expect(await this.lynexKeys.symbol()).to.equal('LKEY');
    });
  });

  describe('mint', function () {
    beforeEach(async function () {
      await this.lynexKeys
        .connect(this.users.alice)
        .mint(
          usersQuantity.alice,
          this.merkleTreeData.proofs[await this.users.alice.getAddress()]
        );

      await this.lynexKeys
        .connect(this.users.bob)
        .mint(
          usersQuantity.bob,
          this.merkleTreeData.proofs[await this.users.bob.getAddress()]
        );
    });

    it('Should allow whitelisted users to mint', async function () {
      const aliceBalance = await this.lynexKeys.balanceOf(
        await this.users.alice.getAddress()
      );

      expect(aliceBalance).to.equal(1);

      const bobBalance = await this.lynexKeys.balanceOf(
        await this.users.bob.getAddress()
      );

      expect(bobBalance).to.equal(2);
    });

    it('Should revert when users try to mint over allowed quantity', async function () {
      try {
        await this.lynexKeys
          .connect(this.users.alice)
          .mint(
            2,
            this.merkleTreeData.proofs[await this.users.alice.getAddress()]
          );
      } catch (error: any) {
        expect(error.message).to.contains('invalid proof');
      }
    });

    it('Should revert when non-whitelisted users try to mint', async function () {
      try {
        await this.lynexKeys.connect(this.users.david).mint(
          1,
          // david stole alice proofs
          this.merkleTreeData.proofs[await this.users.alice.getAddress()]
        );
      } catch (error: any) {
        expect(error.message).to.contains('invalid proof');
      }
    });
  });
});
