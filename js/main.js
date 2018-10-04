var app = angular.module("main", [])
app.controller("mainCtrl", function($scope, $interval) {
	//catalogueController($scope, $http);
	//helperController($scope, $http);
	
	_DEBUG = true;
	_TICK_PER_SECOND = 6;
	_TICK = 1000 / _TICK_PER_SECOND;
	_SECOND_PER_SAVE = 60;
	
	dLog = function (msg) {
		if (_DEBUG) {
			console.log(msg);
		}
	}
	
	$scope.toMoney = function (number) {
		if (number < 1000000)
			return number.toFixed(2);
		place = Math.log10(number);
		e = Math.floor(place / 3) * 3;
		r = place - e;
		value = number / 10**e;
		if (value > 99) {
			value = Math.floor(value);
		} else if (value > 9) {
			value = value.toFixed(1);
		} else {
			value = value.toFixed(2);
		}
		return (value + "e+" + e);
	}
	
	function Upgrade (_title, _cost, _effect, _res, _multi) {
		this.title = _title;
		this.cost = _cost;
		this.effect = _effect;
		this.res = _res;
		this.multi = _multi;
		this.upgraded = false;
		
		this.canUpgrade = function () {
			return (!this.upgraded && $scope.money >= this.cost);
		}
		
		this.doUpgrade = function () {
			if (this.canUpgrade()) {
				if (this.res == -1) {
					this.effect(this.multi);
				} else {
					this.effect(this.res, this.multi);
				}
				this.upgraded = true;
			}
		}
	}
	
	upgradeRes = function (_res, _multi) {
		res = $scope.resourceList.find(function (r) {
			if (r.name == _res) 
				return r;
		});
		res.upgradeMulti(_multi);
		res.updateProductPerCycle();
	}
	
	upgradeGlobalMulti = function(_multi) {
		$scope.globalMulti *= _multi;
		$scope.resourceList.forEach(function (res) {
			res.updateProductPerCycle();
		});
	}
	
	$scope.upgradeMax = function () {
		$scope.upgradeList.forEach(function(up) {
			up.doUpgrade();
		});
	}
	
	function Resource (_index, _name, _initPrice, _increaseMultiPrice, _initProductRate, _initProductTime) {
		this.index = _index;
		this.name = _name;
		this.curLvl = 0;
		this.upCost = _initPrice;
		this.productRate = _initProductRate;
		this.productTime = _initProductTime * 1000;
		this.increaseMultiPrice = _increaseMultiPrice;
		this.progress = 0;
		this.percentage = 0;
		this.lastTick = $scope.curTick;
		this.productMulti = 1;
		this.newProductTime = this.productTime;
		this.started = 0;
		this.productPerCycle = 0;
		this.productPerSecond = 0;
		this.nextJump = 10;
		this.maxUpgradeLvl = 0;
		
		this.performJump = function () {
			if (this.curLvl == this.nextJump) {
				this.upgradeMulti(2);
				
				if (this.nextJump == 10) {
					this.nextJump = 25;
				} else if (this.nextJump == 25) {
					this.nextJump = 100;
				} else {
					this.nextJump += 100;
				}
			}
		}
		
		this.canUpgradeLvl = function () {
			return ($scope.money >= this.upCost);
		}
		
		this.updateProductPerCycle = function () {
			this.productPerCycle = this.curLvl * this.productRate * this.productMulti * $scope.globalMulti;
			this.productPerSecond = this.productPerCycle / this.productTime * 1000;
		}
		
		this.upgradeLvl = function () {
			if (this.canUpgradeLvl()) {
				if (this.started == 0) {
					this.starting();
				}
				this.oldUpCost = this.upCost;
				this.curLvl += 1;
				this.upCost = this.upCost * this.increaseMultiPrice;
				loseMoney(this.oldUpCost);
				
				this.performJump();
				this.updateProductPerCycle();
				return true;
			}
			return false;
		}
		
		this.upgradeMax = function () {
			while (this.upgradeLvl()) {
			}
		}
		
		this.calculateUpgradeMax = function () {
			console.log(this);
			this.maxUpgradeLvl = Math.floor(Math.log($scope.money * (this.increaseMultiPrice - 1) / this.upCost + 1) / Math.log(this.increaseMultiPrice));
			console.log('aaa ' +$scope.money);
			console.log(this.increaseMultiPrice);
			console.log(this.upCost);
			console.log(this.maxUpgradeLvl);
			if (this.maxUpgradeLvl < 0)
				this.maxUpgradeLvl = 0;
		}
		
		this.upgradeTime = function (base) {
			this.newProductTime *= base;
		}
		
		this.upgradeMulti = function (multi) {
			this.productMulti *= multi;
		}
		
		this.update = function () {
			//dLog(this.lastTick + "   " + curTick + "   " + this.progress);
			if (this.started == 1) {
				this.progress += ($scope.curTick - this.lastTick) / this.productTime;
				this.lastTick = $scope.curTick;
				if (this.progress >= 1) {
					var p = Math.floor(this.progress);
					earnMoney(p * this.productPerCycle);
					this.progress -= p;
					this.productTime = this.newProductTime;
				}
				this.percentage = (this.progress * 100).toFixed(2);
			}
		}
		
		this.starting = function () {
			this.started = 1;
			this.lastTick = $scope.curTick;
		}
	}
	
	//function Resource (_name, _initPrice, _increaseMultiPrice, _initProductRate, _initProductTime) {
	initGame = function () {
		$scope.curTick = 0;
		$scope.globalMulti = 1;
		$scope.money = 100000;
		$scope.totalMoney = $scope.money;
		initResourceList();
		initUpgradeList();
		$scope.resourceList.forEach(function (r) {
			r.calculateUpgradeMax();
		});
	}		
		
	initResourceList = function () {
		$scope.resourceList = [];
		$scope.resourceList.push(new Resource(1, "one", 1, 1.7, 1, 1));
		$scope.resourceList.push(new Resource(2, "two", 100, 1.7, 10, 1));
		$scope.resourceList.push(new Resource(3, "three", 10000, 1.7, 25, 1));
		$scope.resourceList.push(new Resource(4, "four", 1000000, 1.7, 125, 1));
		$scope.resourceList.push(new Resource(5, "five", 10000000000, 1.7, 625, 1));
	}

	//function Upgrade (_title, _cost, _effect) {
	initUpgradeList = function () {
		$scope.upgradeList = [];
		$scope.upgradeList.push(new Upgrade("one x2", 50, upgradeRes, "one", 2));
		$scope.upgradeList.push(new Upgrade("two x2", 500, upgradeRes, "two", 2));
		$scope.upgradeList.push(new Upgrade("three x2", 500, upgradeRes, "two", 2));
		$scope.upgradeList.push(new Upgrade("four x2", 50000, upgradeRes, "two", 2));
		$scope.upgradeList.push(new Upgrade("five x2", 5000000, upgradeRes, "two", 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x2", 100, upgradeGlobalMulti, -1, 2));
		$scope.upgradeList.push(new Upgrade("all x100", 10000000, upgradeGlobalMulti, -1, 2));
	}
	
	earnMoney = function (_money) {
		$scope.money += _money;
	}
	
	loseMoney = function (_money) {
		$scope.money -= _money;
	}
	
	saveGame = function () {
		gameState = {
			money: $scope.money,
			globalMulti: $scope.globalMulti,
			curTick: $scope.curTick,
			resourceList: $scope.resourceList,
			upgradeList: $scope.upgradeList
		};
		localStorage['gameState'] = JSON.stringify(gameState);
		console.log("Saved");
	}
	
	loadGame = function () {
		var stored = localStorage['gameState'];
		if (stored) {
			gameState = JSON.parse(stored);
			$scope.money = gameState.money;
			$scope.globalMulti = gameState.globalMulti;
			$scope.curTick = gameState.curTick;
			upList = gameState.upgradeList;
			resList = gameState.resourceList;
			for (var i = 0; i < resList.length; i++) {
				for (var property in resList[i]) {
					if (resList[i].hasOwnProperty(property)) {
						$scope.resourceList[i][property] = resList[i][property];
					}
				}
				$scope.resourceList[i].calculateUpgradeMax();
			}
			for (var i = 0; i < upList.length; i++) {
				$scope.upgradeList[i].upgraded = upList[i].upgraded;
			}
		}
	}
	
	$scope.resetGame = function () {
		initGame();
		saveGame();
		console.log("RESET!!");
	}
	
	mainGame = function() {
		$scope.curTick += _TICK;
		$scope.resourceList.forEach(function(r) {
			r.update();
			$scope.resourceList.forEach(function (r) {
				r.calculateUpgradeMax();
			});
		});
	};
	
	//	Main loop
	initGame();
	loadGame();
	$interval(mainGame, _TICK);
	$interval(saveGame, 10000);
});

app.config(['$compileProvider',
	function ($compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]);
