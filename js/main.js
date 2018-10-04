var app = angular.module("main", [])
app.controller("mainCtrl", function($scope, $interval) {
	//catalogueController($scope, $http);
	//helperController($scope, $http);
	
	_DEBUG = true;
	_TICK_PER_SECOND = 6;
	_TICK = 1000 / _TICK_PER_SECOND;
	curTick = 0;
	$scope.money = 100000;
	
	dLog = function (msg) {
		if (_DEBUG) {
			console.log(msg);
		}
	}
	$scope.toMoney = function (number) {
		if (number < 1000000)
			return number;
		
		place = Math.log10(number);
		e = Math.floor(place / 3) * 3;
		r = place - e;
		value = number / 10**e;
		
		return (value + "e+" + e);
	}
	
	function Upgrade (_title, _cost, _effect) {
		this.canUpgrade = function () {
			return ($scope.money >= _cost);
		}
		
		this.doUpgrade = function () {
			if (this.canUpgrade())
				_effect();
		}
	}
	
	function Resource (_index, _name, _initPrice, _increaseMultiPrice, _initProductRate, _initProductTime, _initProductMulti) {
		this.index = _index;
		this.name = _name;
		this.curLvl = 0;
		this.upCost = _initPrice;
		this.productRate = _initProductRate;
		this.productTime = _initProductTime * 1000;
		this.progress = 0;
		this.percentage = 0;
		this.lastTick = curTick;
		this.productMulti = _initProductMulti;
		this.newProductTime = this.productTime;
		this.started = 0;
		this.productPerCycle = 0;
		this.productPerSecond = 0;
		this.nextJump = 10;
		
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
		
		this.upgradeLvl = function () {
			if (this.canUpgradeLvl()) {
				if (this.started == 0) {
					this.starting();
				}
				$scope.loseMoney(this.upCost);
				this.curLvl += 1;
				this.upCost = Math.round(this.upCost * _increaseMultiPrice);
				
				this.performJump();
				
				this.productPerCycle = this.curLvl * this.productRate * this.productMulti;
				this.productPerSecond = this.productPerCycle / this.productTime * 1000;
				return true;
			}
			return false;
		}
		
		
		this.upgradeMax = function () {
			while (this.upgradeLvl()) {
			}
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
				this.progress += (curTick - this.lastTick) / this.productTime;
				this.lastTick = curTick;
				if (this.progress >= 1) {
					var p = Math.floor(this.progress);
					$scope.earnMoney(p * this.productPerCycle);
					this.progress -= p;
					this.productTime = this.newProductTime;
				}
				this.percentage = (this.progress * 100).toFixed(2);
			}
		}
		
		this.starting = function () {
			this.started = 1;
			this.lastTick = curTick;
		}
	}
	
	findResourse = function (_index) {
		return $scope.baseList.find(function(res) {
			if (res.index == _index) 
				return res;
		});
	};
	
	//function Resource (_name, _initPrice, _increaseMultiPrice, _initProductRate, _initProductTime, _initProductMulti) {
	$scope.resList = [];
	$scope.resList.push(new Resource(1, "one", 1, 1.7, 1, 1, 1));
	$scope.resList.push(new Resource(2, "two", 100, 1.7, 5, 1, 1));
	$scope.resList.push(new Resource(3, "three", 10000, 1.7, 25, 1, 1));
	$scope.resList.push(new Resource(4, "four", 1000000, 1.7, 125, 1, 1));
	$scope.resList.push(new Resource(5, "five", 10000000000, 1.7, 625, 1, 1));
	dLog($scope.resList[0]);
	$scope.upgradeList = [];
	$scope.upgradeList.push(new Upgrade(
	
	
	$scope.earnMoney = function (_money) {
		$scope.money += _money;
	}
	
	$scope.loseMoney = function (_money) {
		$scope.money -= _money;
	}
	
	$scope.mainGame = function() {
		curTick += _TICK;
		//dLog(curTick);
		$scope.resList.forEach(function(r) {
			r.update();
		});
	};
	
	$interval($scope.mainGame, _TICK);
});

app.config(['$compileProvider',
	function ($compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]);
