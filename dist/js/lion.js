/*
Lion API v.0.0.3
https://phoenix.rwmanila.com/lion/dev
(c) 2014 by it.appdev@rwmanila.com. All rights reserved.
*/
(function(lion, undefined) {
    // Public Properties
    lion.ver = "0.0.3";
    lion.live = false;
    lion.phoenixServer = {
        liveUserId: "lion.live",
        liveApiKey: "60415048d34ea7ef2e65b46a73949675e24f4655",
        debugUserId: "lion.debug",
        debugApiKey: "33390cd9177cb6f81f9177208387983291876e5b",
        send: function sendF(cgrp, cmnd, prms, callback) {
            if(lion.live) {
                if(lion.event.appCode.length > 0) //
                    phoenix.userId = lion.phoenixServer.liveUserId + "+" + lion.event.appCode.toLowerCase();
                else phoenix.userId = lion.phoenixServer.liveUserId;
                phoenix.apiKey = lion.phoenix.liveApiKey;
            } else {
                if(lion.event.appCode.length > 0) //
                    phoenix.userId = lion.phoenixServer.debugUserId + "+" + lion.event.appCode.toLowerCase();
                else phoenix.userId = lion.phoenixServer.debugUserId;
                phoenix.apiKey = lion.phoenixServer.debugApiKey;
            }
            phoenix.send({
                cgrp: cgrp,
                cmnd: cmnd,
                prms: prms
            }, function callbackF(data) {
                var d = JSON.parse(data);
                if(d.exitCode === 0) console.log(JSON.stringify(d.response['error']));
                callback(d);
            });
        }
    };
    lion.event = {
        application: "",
        applicationId: "",
        appCode: "",
        isMonitor: false,
        currentEvent: "",
        currentEventId: "",
        available: []
    };
    lion.user = {
        username: ""
    };
    lion.locations = {
        current: "",
        available: []
    };
    lion.msgbox = {
        object: {},
        show: function() {
            return lion.msgbox.object.modal("show");
        },
        hide: function() {
            return lion.msgbox.object.modal("hide");
        },
        clear: function() {
            $("#lionMsgBox").modal("hide");
            $("#lionMsgBody").empty();
            $("#lionMsgFooter").empty();
        }
    }
    // Public Methods
    lion.init = function initF(applicationId, callback) {
        if(!window.head) {
            alert("HeadJS must be loaded in <HEAD>; Lion Events initialization failed.")
            window.location = 'http://rwmanila.com';
        } else if(applicationId < 1) {
            alert("Invalid ApplicationId; Lion Events initialization failed.");
            window.location = 'http://rwmanila.com';
        } else {
            head.load("bower_components/jquery/dist/jquery.min.js", //
                "bower_components/bootstrap/dist/css/bootstrap.min.css", //
                "bower_components/bootstrap/dist/js/bootstrap.min.js", //
                "bower_components/jstorage/jstorage.min.js", //
                "bower_components/rwm-phoenix/dist/phoenix.min.js", //          
                "bower_components/rwm-lion/dist/css/lion.css", //

                function readyF() {
                    // Check Application Id
                    if(!$.isNumeric(applicationId)) {
                        alert("Invalid ApplicationId; Lion Events initialization failed.");
                        window.location = 'http://rwmanila.com';
                        return;
                    } else {
                        lion.event.applicationId = applicationId;
                    }
                    // Insert HTML
                    lion.msgbox.object = $("<div />", {
                        id: "lionMsgBox",
                        style: "display:none;",
                        tabindex: "-1",
                        role: "dialog",
                        "data-backdrop": "static",
                        "data-keyboard": "false",
                        "data-show": "false"
                    }).appendTo("body");
                    lion.msgbox.object.addClass("modal fade");
                    lion.msgbox.object.append($("<div />", {
                        id: "lionMsgDialog"
                    }).addClass("modal-dialog").append($("<div />", {
                        id: "lionMsgContent"
                    }).addClass("modal-content").append($("<div />", {
                        id: "lionMsgHeader"
                    }).addClass("modal-header")).append($("<div />", {
                        id: "lionMsgBody"
                    }).addClass("modal-body")).append($("<div />", {
                        id: "lionMsgFooter"
                    }).addClass("modal-footer"))));
                    $("#lionMsgHeader").append($("<img />", {
                        id: "lionMsgLogo",
                        width: "180px",
                        height: "auto",
                        src: "bower_components/rwm-lion/dist/css/img/logo.png"
                    }).addClass("img-rounded"));
                    $("#lionMsgHeader").append($("<h1 />", {
                        id: "lionMsgHeaderText"
                    }).append("Lion Events"));
                    // Load everything
                    $.when(lion.refreshLocations(), getAppInfo()).done(function() {
                        lion.login(callback);
                    });
                });
        }
    };
    lion.login = function loginF(callback) {
        // Silent Authenticate
        if(typeof $.jStorage.get("Auth").username !== 'undefined') {
            lion.user = $.jStorage.get("Auth");
            lion.locations = $.jStorage.get("AuthLocation");
            lion.event = $.jStorage.get("AuthEvent");
            if(typeof(callback) == "function") callback();
        } else {
            // Clear MBox
            lion.msgbox.clear();
            // Populate MBox 
            $("#lionMsgBody").append($("<form />", {
                id: "lionMsgBodyAuthForm",
                role: "form"
            }).append($("<input />", {
                id: "lionMsgBodyAuthFormEmpNum",
                type: "text",
                placeholder: "Employee Number",
                autofocus: "",
                required: ""
            }).addClass("form-control input-lg")).append($("<input />", {
                id: "lionMsgBodyAuthFormEmpPwd",
                type: "password",
                placeholder: "Password",
                style: "margin-top:10px;",
                required: ""
            }).addClass("form-control input-lg")).append($("<select />", {
                id: "lionMsgBodyAuthFormEmpLoc",
                name: "lionMsgBodyAuthFormLocations",
                style: "margin-top:10px;"
            }).addClass("form-control input-lg")).append($("<select />", {
                id: "lionMsgBodyAuthFormEmpEvt",
                name: "lionMsgBodyAuthFormEvents",
                style: "margin-top:10px;"
            }).addClass("form-control input-lg")));
            var locs = [];
            $.each(lion.locations.available, function(key, value) {
                locs.push('<option value="' + value + '">' + value + '</option>');
            });
            $("#lionMsgBodyAuthFormEmpLoc").html(locs.join(''));
            if(lion.locations.current != "Unknown") {
                $("#lionMsgBodyAuthFormEmpLoc").val(lion.locations.current)
                $("#lionMsgBodyAuthFormEmpLoc").attr("disabled", true);
            } else {
                $("#lionMsgBodyAuthFormEmpLoc").append($("<option />", {
                    value: "",
                    disabled: "",
                    selected: ""
                }).append("Select your Location"));
            }
            var evts = [];
            $.each(lion.event.available, function(key, value) {
                evts.push('<option value="' + value.eventId + '">' + value.eventName + '</option>');
            });
            $("#lionMsgBodyAuthFormEmpEvt").html(evts.join(''));
            if($.isNumeric(getURLParameter("e"))) {
                lion.event.currentEventId = getURLParameter("e");
                $("#lionMsgBodyAuthFormEmpEvt").val(lion.event.currentEventId);
                $("#lionMsgBodyAuthFormEmpEvt").attr("disabled", true);
            } else {
                $("#lionMsgBodyAuthFormEmpEvt").append($("<option />", {
                    value: "",
                    disabled: "",
                    selected: ""
                }).append("Select an Active Event"));
            }
            $("#lionMsgFooter").append($("<input />", {
                type: "submit",
                form: "lionMsgBodyAuthForm",
                id: "lionMsgFooterAuthSubmit",
                value: "Log In",
                disabled: ""
            }).addClass("btn btn-lg btn-primary")).append($("<input />", {
                type: "button",
                id: "lionMsgFooterAuthForgot",
                value: "Forgot Password",
                disabled: "" // TODO: Create Forgot Password Screen
            }).addClass("btn btn-lg btn-default"));
            $("#lionMsgBodyAuthFormEmpNum, #lionMsgBodyAuthFormEmpPwd").on("keyup", function(e) {
                $("#lionMsgBodyAuthForm").removeClass("has-error");
                if(($("#lionMsgBodyAuthFormEmpNum").val().length > 0) && //
                    ($("#lionMsgBodyAuthFormEmpPwd").val().length > 0) && //
                    ($("#lionMsgBodyAuthFormEmpLoc").val() !== null) && //
                    ($("#lionMsgBodyAuthFormEmpEvt").val() !== null)) //
                    $("#lionMsgFooterAuthSubmit").attr("disabled", false);
                else $("#lionMsgFooterAuthSubmit").attr("disabled", true);
            });
            $("#lionMsgBodyAuthFormEmpLoc, #lionMsgBodyAuthFormEmpEvt").on("change", function(e) {
                $("#lionMsgBodyAuthForm").removeClass("has-error");
                if(($("#lionMsgBodyAuthFormEmpNum").val().length > 0) && //
                    ($("#lionMsgBodyAuthFormEmpPwd").val().length > 0) && //
                    ($("#lionMsgBodyAuthFormEmpLoc").val() !== null) && //
                    ($("#lionMsgBodyAuthFormEmpEvt").val() !== null)) //
                    $("#lionMsgFooterAuthSubmit").attr("disabled", false);
                else $("#lionMsgFooterAuthSubmit").attr("disabled", true);
            });
            $("#lionMsgBodyAuthFormEmpNum").on("keydown", function(e) {
                if(e.which == 13) $("#lionMsgBodyAuthFormEmpPwd").focus();
            });
            $("#lionMsgBodyAuthFormEmpPwd").on("keydown", function(e) {
                if(e.which == 13) $("#lionMsgBodyAuthFormEmpLoc").focus();
            });
            $("#lionMsgBodyAuthFormEmpLoc").on("keydown", function(e) {
                if(e.which == 13) $("#lionMsgBodyAuthFormEmpEvt").focus();
            });
            $("#lionMsgBodyAuthFormEmpEvt").on("keydown", function(e) {
                if(e.which == 13)
                    if(!$("#lionMsgFooterAuthSubmit").attr("disabled")) //
                        $("#lionMsgBodyAuthFormEmpEvt").submit();
            });
            $("#lionMsgBodyAuthForm").on("submit", function(e) {
                e.preventDefault();
                $("#lionMsgBodyAuthFormEmpNum, #lionMsgBodyAuthFormEmpPwd, #lionMsgBodyAuthFormEmpLoc, " + //
                    "#lionMsgBodyAuthFormEmpEvt, #lionMsgFooterAuthSubmit, #lionMsgFooterAuthForgot").attr("disabled", true);
                lion.phoenixServer.send("$lion", "auth", {
                    "employeeNo": $("#lionMsgBodyAuthFormEmpNum").val(),
                    "password": $("#lionMsgBodyAuthFormEmpPwd").val()
                }, function(d) {
                    if(d.exitCode === 0) {
                        $("#lionMsgBodyAuthForm").addClass("has-error");
                        $("#lionMsgBodyAuthFormEmpPwd").val("");
                        $("#lionMsgBodyAuthFormEmpPwd").focus();
                        $("#lionMsgBodyAuthFormEmpNum, #lionMsgBodyAuthFormEmpPwd, #lionMsgBodyAuthFormEmpLoc, " + //
                            "lionMsgBodyAuthFormEmpEvt, #lionMsgFooterAuthSubmit, #lionMsgFooterAuthForgot").attr("disabled", false);
                        alert(d.response["error"]);
                    } else {
                        lion.user = d.response;
                        lion.locations.current = $("#lionMsgBodyAuthFormEmpLoc").val();
                        lion.event.currentEventId = $("#lionMsgBodyAuthFormEmpEvt").val();
                        lion.event.currentEvent = $("#lionMsgBodyAuthFormEmpEvt option:selected").text();
                        $.jStorage.set("Auth", lion.user);
                        $.jStorage.set("AuthLocation", lion.locations);
                        $.jStorage.set("AuthEvent", lion.event);                        
                        $.jStorage.setTTL("Auth", 28800000);
                        $.jStorage.setTTL("AuthLocation", 28800000);
                        $.jStorage.setTTL("AuthEvent", 28800000);
                        lion.msgbox.hide();
                        if(typeof(callback) == "function") callback();
                    }
                });
            });
            // Show MBox
            lion.msgbox.show();
        }
    };
    lion.logout = function logoutF(force) {
        $.jStorage.set("Auth", {});
        $.jStorage.set("AuthLocation", {});
        $.jStorage.set("AuthEvent", {});
        location.reload(force);
    };
    lion.refreshLocations = function refreshLocationsF() {
        var def = $.Deferred();
        lion.phoenixServer.send("$lion", "authGetLocations", {}, function(d) {
            if(d.exitCode === 0) {
                alert("lion.refreshLocations Error: " + d.response["error"]);
                window.location = 'http://rwmanila.com';
            } else {
                lion.locations.current = d.response["Current"];
                lion.locations.available = [];
                $.each(d.response["Available"].split(","), function(key, value) {
                    lion.locations.available.push(value);
                });
                def.resolve();
            }
        });
        return def.promise();
    };
    // Private Methods
    var getAppInfo = function getAppInfo() {
        var def = $.Deferred();
        lion.phoenixServer.send("$lion", "authGetAppInfo", {
            "applicationId": lion.event.applicationId
        }, function(d) {
            if(d.exitCode === 0) {
                alert("lion.getAppInfo Error: " + d.response["error"]);
                window.location = 'http://rwmanila.com';
            } else {
                lion.event.appCode = d.response["applicationCode"];
                lion.event.application = d.response["applicationName"];
                lion.event.applicationId = d.response["applicationId"];
                lion.event.applicationUrl = d.response["applicationURL"];
                lion.event.isMonitor = d.response["applicationTag_monitor"]
                $.each(d.response["events"].split(","), function(key, value) {
                    lion.event.available.push({
                        eventId: value.split(":")[0],
                        eventName: value.split(":")[1]
                    });
                });
                def.resolve();
            }
        });
        return def.promise();
    }
    var getURLParameter = function getURLParameterF(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
    };
}(window.lion = window.lion || {}));