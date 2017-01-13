"use strict";

var Service, Characteristic;
var temperatureService;
var humiditySensor;
var temperatur;
var humidity;
var url;
var log;
var name;
var apikey;
var location;
var exec = require('child_process').exec;
var self;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-weather", "Weather", WeatherAccessory);
}

function updateValues(error, stdout, stderr) {
    if (error !== null) {
        log(stderr);
    } else {
        var str = new Buffer(stdout);
        log("HTTP Response " + str.toString());
        var weatherObj = JSON.parse(stdout);
        temperatur = parseFloat(weatherObj.main.temp);
        humidity = parseFloat(weatherObj.main.humidity);
    }
    exec('node /usr/local/lib/node_modules/homebridge-weather/update-weather.js "' + url + '" 900000', updateValues);
}

function WeatherAccessory(log1, config) {
    log = log1;
    name = config["name"];
    apikey = config["apikey"];
    location = config["location"];
    temperatur = 0;
    humidity = 0;
    url = "http://api.openweathermap.org/data/2.5/weather?q=" + location + "&units=metric&APPID=" + apikey;
    log('URL: ' + url);
    exec('node /usr/local/lib/node_modules/homebridge-weather/update-weather.js "' + url + '"', updateValues);
    self = this;
}

function updateState (callback, value) {
    if (value === 'tem') {
                        log('temperatur: ' + temperatur);
        callback(parseFloat(temperatur));
    }
    if (value === 'hum') {
                        log('humidity: ' + humidity);
        callback(humidity);
    }
}

WeatherAccessory.prototype =
    {
        getStateTem: function (callback) {

            this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, updateState('tem'));
            log('getStateTem: ' + temperatur);
            callback(null, temperatur);
        },

        getStateHum: function (callback) {

            this.humiditySensor.setCharacteristic(Characteristic.CurrentRelativeHumidity, updateState('hum'));
            log('getStateHum: ' + humidity);
            callback(null, humidity);
        },

        identify: function (callback) {
            log("Identify requested!");
            callback(); // success
        },

        getServices: function () {
            var informationService = new Service.AccessoryInformation();
            log('getServices');
            informationService
                .setCharacteristic(Characteristic.Manufacturer, "OpenWeatherMap")
                .setCharacteristic(Characteristic.Model, location)
                .setCharacteristic(Characteristic.SerialNumber, "");

            this.temperatureService = new Service.TemperatureSensor(name);
            this.temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .on("get", this.getStateTem.bind(this));

            this.temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({minValue: -30});

            this.temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({maxValue: 120});

            this.humiditySensor =  new Service.HumiditySensor(name);
            this.humiditySensor
                .getCharacteristic(Characteristic.CurrentRelativeHumidity)
 			          .on("get", this.getStateHum.bind(this));
            log('return');
            return [informationService, this.temperatureService, this.humiditySensor];
        },

    };

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    }
}
