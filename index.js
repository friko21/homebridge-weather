"use strict";

var Service, Characteristic;
var temperatureService;
var humiditySensor;
var temperatur = 0;
var humidity = 0;
var url;
var exec = require('child_process').exec;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-weather", "Weather", WeatherAccessory);
}

function updateValues(error, stdout, stderr) {
    if (error !== null) {
        this.log(stderr);
    } else {
        this.log("HTTP Response", stdout);
        var weatherObj = JSON.parse(stdout);
        temperature = parseFloat(weatherObj.main.temp);
        humidity = parseFloat(weatherObj.main.humidity);
    }
    exec('node ./update-weather.js ' + url + ' 900000', updateValues);
}

function WeatherAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.apikey = config["apikey"];
    this.location = config["location"];
    url = "http://api.openweathermap.org/data/2.5/weather?q=" + this.location + "&units=metric&APPID=" + this.apikey;
    exec('node ./update-weather.js ' + url, updateValues);
}

WeatherAccessory.prototype =
    {
        identify: function (callback) {
            this.log("Identify requested!");
            callback(); // success
        },

        getServices: function () {
            var informationService = new Service.AccessoryInformation();

            informationService
                .setCharacteristic(Characteristic.Manufacturer, "OpenWeatherMap")
                .setCharacteristic(Characteristic.Model, this.location)
                .setCharacteristic(Characteristic.SerialNumber, "");

            temperatureService = new Service.TemperatureSensor(this.name);
            temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .on("get", temperature);

            temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({minValue: -30});

            temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({maxValue: 120});

            humiditySensor =  new Service.HumiditySensor(this.name);
            humiditySensor
                .getCharacteristic(Characteristic.CurrentRelativeHumidity)
 			    .on("get", humidity);
            
            return [informationService, temperatureService, humiditySensor];
        },

    };

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    }
}
