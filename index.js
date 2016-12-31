"use strict";

var Service, Characteristic;
var temperatureService;
var humiditySensor;
var request = require("request");

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-weather", "Weather", WeatherAccessory);
}

function WeatherAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.apikey = config["apikey"];
    this.location = config["location"];
    this.lastupdate = 0;
    this.temperature = 0;
    this.humidity = 0;
}

WeatherAccessory.prototype =
    {
        getState: function (callback) {
            // Only fetch new data once per hour
            if (this.lastupdate + (60 * 60) < (Date.now() / 1000 | 0)) {
                var url = "http://api.openweathermap.org/data/2.5/weather?q=" + this.location + "&units=metric&APPID=" + this.apikey;
                this.httpRequest(url, function (error, response, responseBody) {
                    if (error) {
                        this.log("HTTP get weather function failed: %s", error.message);
                        callback(error);
                    } else {
                        this.log("HTTP Response", responseBody);
                        var weatherObj = JSON.parse(responseBody);
                        this.temperature = parseFloat(weatherObj.main.temp);
                        this.humidity = parseFloat(weatherObj.main.humidity);
                        this.lastupdate = (Date.now() / 1000);
                        callback(null, this.temperature, this.humidity);
                    }
                }.bind(this));
            } else {
                this.log("Returning cached data: temp: ", this.temperature);
                this.log("Returning cached data: humidity: ",this.humidity);
                temperatureService.setCharacteristic(Characteristic.CurrentTemperature, this.temperature);
                humiditySensor.setCharacteristic(Characteristic.CurrentRelativeHumidity, this.humidity);
                callback(null, this.temperature, this.humidity);
            }
        },

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
                .on("get", this.getState.bind(this));

            temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({minValue: -30});

            temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({maxValue: 120});

            humiditySensor =  new Service.HumiditySensor(this.name);
            humiditySensor
                .getCharacteristic(Characteristic.CurrentRelativeHumidity)
 			    .on("get", this.getState.bind(this));
            
            return [informationService, temperatureService, humiditySensor];
        },

        httpRequest: function (url, callback) {
            request({
                    url: url,
                    body: "",
                    method: "GET",
                    rejectUnauthorized: false
                },
                function (error, response, body) {
                    callback(error, response, body)
                })
        }

    };

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    }
}
