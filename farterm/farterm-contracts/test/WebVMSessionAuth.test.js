const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WebVMSessionAuth", function () {
  let webvmSessionAuth;
  let owner, user1, user2, user3;
  const URI = "https://api.webvm.farterm.app/metadata/{id}.json";

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const WebVMSessionAuth = await ethers.getContractFactory("WebVMSessionAuth");
    webvmSessionAuth = await WebVMSessionAuth.deploy(
      URI,
      owner.address
    );
    await webvmSessionAuth.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct URI", async function () {
      expect(await webvmSessionAuth.uri(1)).to.equal(URI);
    });

    it("Should initialize token metadata correctly", async function () {
      // Check owner token
      expect(await webvmSessionAuth.getTokenPrice(1)).to.equal(ethers.parseEther("0.01"));
      expect(await webvmSessionAuth.isTokenActive(1)).to.be.true;
      expect(await webvmSessionAuth.isTokenBurnable(1)).to.be.true;
      expect(await webvmSessionAuth.isTokenTransferable(1)).to.be.false;

      // Check admin token
      expect(await webvmSessionAuth.getTokenPrice(2)).to.equal(ethers.parseEther("0.005"));
      
      // Check user token
      expect(await webvmSessionAuth.getTokenPrice(3)).to.equal(ethers.parseEther("0.001"));
      
      // Check readonly token
      expect(await webvmSessionAuth.getTokenPrice(4)).to.equal(ethers.parseEther("0.0001"));
    });
  });

  describe("Session Creation", function () {
    it("Should create a session successfully", async function () {
      const sessionName = "Test Session";
      const description = "A test WebVM session";
      const maxUsers = 10;
      const isPublic = true;
      const ipfsHash = "QmTestHash";
      const duration = 24 * 60 * 60; // 24 hours

      const tx = await webvmSessionAuth.createSession(
        sessionName,
        description,
        maxUsers,
        isPublic,
        ipfsHash,
        duration
      );

      const receipt = await tx.wait();
      const sessionCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "SessionCreated"
      );

      expect(sessionCreatedEvent).to.not.be.undefined;
      const sessionId = sessionCreatedEvent.args[0];

      // Check session metadata
      const session = await webvmSessionAuth.getSession(sessionId);
      expect(session.sessionName).to.equal(sessionName);
      expect(session.description).to.equal(description);
      expect(session.creator).to.equal(owner.address);
      expect(session.maxUsers).to.equal(maxUsers);
      expect(session.isPublic).to.equal(isPublic);
      expect(session.ipfsHash).to.equal(ipfsHash);
      expect(session.active).to.be.true;

      // Check that creator has owner token
      expect(await webvmSessionAuth.balanceOf(owner.address, 1)).to.equal(1);
    });

    it("Should fail with invalid parameters", async function () {
      await expect(
        webvmSessionAuth.createSession("", "desc", 10, true, "hash", 3600)
      ).to.be.revertedWith("Session name required");

      await expect(
        webvmSessionAuth.createSession("name", "desc", 0, true, "hash", 3600)
      ).to.be.revertedWith("Invalid max users");

      await expect(
        webvmSessionAuth.createSession("name", "desc", 10, true, "hash", 0)
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Session Joining", function () {
    let sessionId;

    beforeEach(async function () {
      const tx = await webvmSessionAuth.createSession(
        "Test Session",
        "Description",
        10,
        true,
        "hash",
        24 * 60 * 60
      );
      const receipt = await tx.wait();
      const sessionCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "SessionCreated"
      );
      sessionId = sessionCreatedEvent.args[0];
    });

    it("Should allow user to join session with user token", async function () {
      const tokenPrice = await webvmSessionAuth.getTokenPrice(3);
      
      await expect(
        webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
          value: tokenPrice
        })
      ).to.emit(webvmSessionAuth, "UserJoinedSession");

      // Check user has access
      expect(await webvmSessionAuth.hasSessionAccess(sessionId, user1.address)).to.be.true;
      expect(await webvmSessionAuth.getUserRole(sessionId, user1.address)).to.equal("user");
      expect(await webvmSessionAuth.balanceOf(user1.address, 3)).to.equal(1);
    });

    it("Should allow user to join session with admin token", async function () {
      const tokenPrice = await webvmSessionAuth.getTokenPrice(2);
      
      await expect(
        webvmSessionAuth.connect(user1).joinSession(sessionId, 2, {
          value: tokenPrice
        })
      ).to.emit(webvmSessionAuth, "UserJoinedSession");

      expect(await webvmSessionAuth.getUserRole(sessionId, user1.address)).to.equal("admin");
      expect(await webvmSessionAuth.balanceOf(user1.address, 2)).to.equal(1);
    });

    it("Should allow user to join session with readonly token", async function () {
      const tokenPrice = await webvmSessionAuth.getTokenPrice(4);
      
      await expect(
        webvmSessionAuth.connect(user1).joinSession(sessionId, 4, {
          value: tokenPrice
        })
      ).to.emit(webvmSessionAuth, "UserJoinedSession");

      expect(await webvmSessionAuth.getUserRole(sessionId, user1.address)).to.equal("readonly");
      expect(await webvmSessionAuth.balanceOf(user1.address, 4)).to.equal(1);
    });

    it("Should refund excess payment", async function () {
      const tokenPrice = await webvmSessionAuth.getTokenPrice(3);
      const excessPayment = tokenPrice + ethers.parseEther("0.001");
      
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      const tx = await webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
        value: excessPayment
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const expectedBalance = balanceBefore - tokenPrice - gasUsed;
      
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });

    it("Should fail with insufficient payment", async function () {
      const tokenPrice = await webvmSessionAuth.getTokenPrice(3);
      const insufficientPayment = tokenPrice - ethers.parseEther("0.0001");
      
      await expect(
        webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
          value: insufficientPayment
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should fail with invalid token type", async function () {
      await expect(
        webvmSessionAuth.connect(user1).joinSession(sessionId, 1, {
          value: ethers.parseEther("0.01")
        })
      ).to.be.revertedWith("Invalid token type");

      await expect(
        webvmSessionAuth.connect(user1).joinSession(sessionId, 5, {
          value: ethers.parseEther("0.001")
        })
      ).to.be.revertedWith("Invalid token type");
    });

    it("Should fail if already in session", async function () {
      const tokenPrice = await webvmSessionAuth.getTokenPrice(3);
      
      await webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
        value: tokenPrice
      });

      await expect(
        webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
          value: tokenPrice
        })
      ).to.be.revertedWith("Already in session");
    });
  });

  describe("Session Management", function () {
    let sessionId;

    beforeEach(async function () {
      const tx = await webvmSessionAuth.createSession(
        "Test Session",
        "Description",
        10,
        true,
        "hash",
        24 * 60 * 60
      );
      const receipt = await tx.wait();
      const sessionCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "SessionCreated"
      );
      sessionId = sessionCreatedEvent.args[0];
    });

    it("Should allow owner to update session", async function () {
      await expect(
        webvmSessionAuth.updateSession(
          sessionId,
          "Updated Session",
          "Updated Description",
          false
        )
      ).to.emit(webvmSessionAuth, "SessionUpdated");

      const session = await webvmSessionAuth.getSession(sessionId);
      expect(session.sessionName).to.equal("Updated Session");
      expect(session.description).to.equal("Updated Description");
      expect(session.isPublic).to.be.false;
    });

    it("Should fail if non-owner tries to update session", async function () {
      await expect(
        webvmSessionAuth.connect(user1).updateSession(
          sessionId,
          "Updated Session",
          "Updated Description",
          false
        )
      ).to.be.revertedWith("Not session owner");
    });

    it("Should allow user to leave session", async function () {
      const tokenPrice = await webvmSessionAuth.getTokenPrice(3);
      
      await webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
        value: tokenPrice
      });

      expect(await webvmSessionAuth.hasSessionAccess(sessionId, user1.address)).to.be.true;

      await expect(
        webvmSessionAuth.connect(user1).leaveSession(sessionId)
      ).to.emit(webvmSessionAuth, "UserLeftSession");

      expect(await webvmSessionAuth.hasSessionAccess(sessionId, user1.address)).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to blacklist users", async function () {
      await webvmSessionAuth.blacklistAccount(user1.address);
      expect(await webvmSessionAuth.isBlacklisted(user1.address)).to.be.true;

      // Blacklisted user should not be able to create sessions
      await expect(
        webvmSessionAuth.connect(user1).createSession(
          "Test",
          "Desc",
          10,
          true,
          "hash",
          3600
        )
      ).to.be.revertedWith("EVMAuth: account is blacklisted");
    });

    it("Should allow admin to unblacklist users", async function () {
      await webvmSessionAuth.blacklistAccount(user1.address);
      expect(await webvmSessionAuth.isBlacklisted(user1.address)).to.be.true;

      await webvmSessionAuth.unblacklistAccount(user1.address);
      expect(await webvmSessionAuth.isBlacklisted(user1.address)).to.be.false;
    });
  });

  describe("Financial Functions", function () {
    it("Should track funds correctly", async function () {
      const initialFunds = await webvmSessionAuth.getTotalFunds();
      expect(initialFunds).to.equal(0);

      // Create session and join with user
      const tx = await webvmSessionAuth.createSession(
        "Test Session",
        "Description",
        10,
        true,
        "hash",
        24 * 60 * 60
      );
      const receipt = await tx.wait();
      const sessionCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "SessionCreated"
      );
      const sessionId = sessionCreatedEvent.args[0];

      const tokenPrice = await webvmSessionAuth.getTokenPrice(3);
      await webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
        value: tokenPrice
      });

      const finalFunds = await webvmSessionAuth.getTotalFunds();
      expect(finalFunds).to.equal(tokenPrice);
    });

    it("Should allow admin to withdraw funds", async function () {
      // Create session and join with user to generate funds
      const tx = await webvmSessionAuth.createSession(
        "Test Session",
        "Description",
        10,
        true,
        "hash",
        24 * 60 * 60
      );
      const receipt = await tx.wait();
      const sessionCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "SessionCreated"
      );
      const sessionId = sessionCreatedEvent.args[0];

      const tokenPrice = await webvmSessionAuth.getTokenPrice(3);
      await webvmSessionAuth.connect(user1).joinSession(sessionId, 3, {
        value: tokenPrice
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      await expect(
        webvmSessionAuth.withdrawFunds(owner.address, tokenPrice)
      ).to.emit(webvmSessionAuth, "FundsWithdrawn");

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
}); 