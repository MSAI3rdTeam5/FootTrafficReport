//
// Copyright (c) 2013-2025 Winlin
//
// SPDX-License-Identifier: MIT
//

'use strict';

function SrsError(name, message) {
    this.name = name;
    this.message = message;
    this.stack = (new Error()).stack;
}
SrsError.prototype = Object.create(Error.prototype);
SrsError.prototype.constructor = SrsError;

// Depends on adapter-7.4.0.min.js from https://github.com/webrtc/adapter
// Async-await-promise based SRS RTC Publisher.
function SrsRtcPublisherAsync() {
    var self = {};

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    self.constraints = {
        audio: true,
        video: {
            width: {ideal: 320, max: 576}
        }
    };

    // @see https://github.com/rtcdn/rtcdn-draft
    // @url The WebRTC url to play with, for example:
    //      webrtc://r.ossrs.net/live/livestream
    // or specifies the API port:
    //      webrtc://r.ossrs.net:11985/live/livestream
    // or autostart the publish:
    //      webrtc://r.ossrs.net/live/livestream?autostart=true
    // or change the app from live to myapp:
    //      webrtc://r.ossrs.net:11985/myapp/livestream
    // or change the stream from livestream to mystream:
    //      webrtc://r.ossrs.net:11985/live/mystream
    // or set the api server to myapi.domain.com:
    //      webrtc://myapi.domain.com/live/livestream
    // or set the candidate(eip) of answer:
    //      webrtc://r.ossrs.net/live/livestream?candidate=39.107.238.185
    // or force to access https API:
    //      webrtc://r.ossrs.net/live/livestream?schema=https
    // or use plaintext, without SRTP:
    //      webrtc://r.ossrs.net/live/livestream?encrypt=false
    // or any other information, will pass-by in the query:
    //      webrtc://r.ossrs.net/live/livestream?vhost=xxx
    //      webrtc://r.ossrs.net/live/livestream?token=xxx
    self.publish = async function (url) {
        var conf = self.__internal.prepareUrl(url);
        self.pc.addTransceiver("audio", {direction: "sendonly"});
        self.pc.addTransceiver("video", {direction: "sendonly"});

        if (!navigator.mediaDevices && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            throw new SrsError('HttpsRequiredError', `Please use HTTPS or localhost to publish, read https://github.com/ossrs/srs/issues/2762#issuecomment-983147576`);
        }
        var stream = await navigator.mediaDevices.getUserMedia(self.constraints);

        stream.getTracks().forEach(function (track) {
            self.pc.addTrack(track);
            self.ontrack && self.ontrack({track: track});
        });

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);
        var session = await new Promise(function (resolve, reject) {
            var data = {
                api: conf.apiUrl, tid: conf.tid, streamurl: conf.streamUrl,
                clientip: null, sdp: offer.sdp
            };
            console.log("Generated offer: ", data);

            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState !== xhr.DONE) return;
                if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
                const data = JSON.parse(xhr.responseText);
                console.log("Got answer: ", data);
                return data.code ? reject(xhr) : resolve(data);
            }
            xhr.open('POST', conf.apiUrl, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send(JSON.stringify(data));
        });
        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: session.sdp})
        );
        session.simulator = conf.schema + '//' + conf.urlObject.server + ':' + conf.port + '/rtc/v1/nack/';

        return session;
    };

    self.close = function () {
        self.pc && self.pc.close();
        self.pc = null;
    };

    self.ontrack = function (event) {
        self.stream.addTrack(event.track);
    };

    self.__internal = {
        defaultPath: '/rtc/v1/publish/',
        prepareUrl: function (webrtcUrl) {
            var urlObject = self.__internal.parse(webrtcUrl);

            var schema = urlObject.user_query.schema;
            schema = schema ? schema + ':' : window.location.protocol;

            var port = urlObject.port || 1985;
            if (schema === 'https:') {
                port = urlObject.port || 443;
            }

            var api = urlObject.user_query.play || self.__internal.defaultPath;
            if (api.lastIndexOf('/') !== api.length - 1) {
                api += '/';
            }

            var apiUrl = schema + '//' + urlObject.server + ':' + port + api;
            for (var key in urlObject.user_query) {
                if (key !== 'api' && key !== 'play') {
                    apiUrl += '&' + key + '=' + urlObject.user_query[key];
                }
            }
            apiUrl = apiUrl.replace(api + '&', api + '?');

            var streamUrl = urlObject.url;

            return {
                apiUrl: apiUrl, streamUrl: streamUrl, schema: schema, urlObject: urlObject, port: port,
                tid: Number(parseInt(new Date().getTime()*Math.random()*100)).toString(16).slice(0, 7)
            };
        },
        parse: function (url) {
            // 추가: url이 문자열인지 확인
            console.log("[SRS SDK parse] typeof url =>", typeof url, "url =>", url);
            
            if (typeof url !== 'string') {
                console.error("[SRS SDK parse] Not a string!", url);
                throw new SrsError('InvalidURL', 'URL must be a string.');
            }

            var a = document.createElement("a");
            a.href = url.replace("rtmp://", "http://")
                    .replace("webrtc://", "http://")
                    .replace("rtc://", "http://");

            var vhost = a.hostname;
            var app = a.pathname.substring(1, a.pathname.lastIndexOf("/"));
            var stream = a.pathname.slice(a.pathname.lastIndexOf("/") + 1);

            app = app.replace("...vhost...", "?vhost=");
            if (app.indexOf("?") >= 0) {
                var params = app.slice(app.indexOf("?"));
                app = app.slice(0, app.indexOf("?"));

                if (params.indexOf("vhost=") > 0) {
                    vhost = params.slice(params.indexOf("vhost=") + "vhost=".length);
                    if (vhost.indexOf("&") > 0) {
                        vhost = vhost.slice(0, vhost.indexOf("&"));
                    }
                }
            }

            if (a.hostname === vhost) {
                var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
                if (re.test(a.hostname)) {
                    vhost = "__defaultVhost__";
                }
            }

            var schema = "rtmp";
            if (url.indexOf("://") > 0) {
                schema = url.slice(0, url.indexOf("://"));
            }

            var port = a.port;
            if (!port) {
                if (schema === 'webrtc' && url.indexOf(`webrtc://${a.host}:`) === 0) {
                    port = (url.indexOf(`webrtc://${a.host}:80`) === 0) ? 80 : 443;
                }
                if (schema === 'http') {
                    port = 80;
                } else if (schema === 'https') {
                    port = 443;
                } else if (schema === 'rtmp') {
                    port = 1935;
                }
            }

            var ret = {
                url: url,
                schema: schema,
                server: a.hostname, port: port,
                vhost: vhost, app: app, stream: stream
            };
            self.__internal.fill_query(a.search, ret);

            if (!ret.port) {
                if (schema === 'webrtc' || schema === 'rtc') {
                    if (ret.user_query.schema === 'https') {
                        ret.port = 443;
                    } else if (window.location.href.indexOf('https://') === 0) {
                        ret.port = 443;
                    } else {
                        ret.port = 1985;
                    }
                }
            }

            return ret;
        },
        fill_query: function (query_string, obj) {
            obj.user_query = {};

            if (query_string.length === 0) {
                return;
            }

            if (query_string.indexOf("?") >= 0) {
                query_string = query_string.split("?")[1];
            }

            var queries = query_string.split("&");
            for (var i = 0; i < queries.length; i++) {
                var elem = queries[i];
                var query = elem.split("=");
                obj[query[0]] = query[1];
                obj.user_query[query[0]] = query[1];
            }

            if (obj.domain) {
                obj.vhost = obj.domain;
            }
        }
    };

    self.pc = new RTCPeerConnection(null);
    self.stream = new MediaStream();

    self.pc.ontrack = function(event) {
        if (self.ontrack) {
            self.ontrack(event);
        }
    };

    return self;
}

// Depends on adapter-7.4.0.min.js from https://github.com/webrtc/adapter
// Async-await-promise based SRS RTC Player.
function SrsRtcPlayerAsync() {
    var self = {};

    self.play = async function(url) {
        var conf = self.__internal.prepareUrl(url);
        self.pc.addTransceiver("audio", {direction: "recvonly"});
        self.pc.addTransceiver("video", {direction: "recvonly"});

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);
        var session = await new Promise(function(resolve, reject) {
            var data = {
                api: conf.apiUrl, tid: conf.tid, streamurl: conf.streamUrl,
                clientip: null, sdp: offer.sdp
            };
            console.log("Generated offer: ", data);

            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState !== xhr.DONE) return;
                if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
                const data = JSON.parse(xhr.responseText);
                console.log("Got answer: ", data);
                return data.code ? reject(xhr) : resolve(data);
            }
            xhr.open('POST', conf.apiUrl, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send(JSON.stringify(data));
        });
        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: session.sdp})
        );
        session.simulator = conf.schema + '//' + conf.urlObject.server + ':' + conf.port + '/rtc/v1/nack/';

        return session;
    };

    self.close = function() {
        self.pc && self.pc.close();
        self.pc = null;
    };

    self.ontrack = function (event) {
        self.stream.addTrack(event.track);
    };

    self.__internal = {
        defaultPath: '/rtc/v1/play/',
        prepareUrl: function (webrtcUrl) {
            var urlObject = self.__internal.parse(webrtcUrl);

            var schema = urlObject.user_query.schema;
            schema = schema ? schema + ':' : window.location.protocol;

            var port = urlObject.port || 1985;
            if (schema === 'https:') {
                port = urlObject.port || 443;
            }

            var api = urlObject.user_query.play || self.__internal.defaultPath;
            if (api.lastIndexOf('/') !== api.length - 1) {
                api += '/';
            }

            var apiUrl = schema + '//' + urlObject.server + ':' + port + api;
            for (var key in urlObject.user_query) {
                if (key !== 'api' && key !== 'play') {
                    apiUrl += '&' + key + '=' + urlObject.user_query[key];
                }
            }
            apiUrl = apiUrl.replace(api + '&', api + '?');

            var streamUrl = urlObject.url;

            return {
                apiUrl: apiUrl, streamUrl: streamUrl, schema: schema, urlObject: urlObject, port: port,
                tid: Number(parseInt(new Date().getTime()*Math.random()*100)).toString(16).slice(0, 7)
            };
        },
        parse: function (url) {
            if (typeof url !== 'string') {
                throw new SrsError('InvalidURL', 'URL must be a string.');
            }
            var a = document.createElement("a");
            a.href = url.replace("rtmp://", "http://")
                    .replace("webrtc://", "http://")
                    .replace("rtc://", "http://");

            var vhost = a.hostname;
            var app = a.pathname.substring(1, a.pathname.lastIndexOf("/"));
            var stream = a.pathname.slice(a.pathname.lastIndexOf("/") + 1);

            app = app.replace("...vhost...", "?vhost=");
            if (app.indexOf("?") >= 0) {
                var params = app.slice(app.indexOf("?"));
                app = app.slice(0, app.indexOf("?"));

                if (params.indexOf("vhost=") > 0) {
                    vhost = params.slice(params.indexOf("vhost=") + "vhost=".length);
                    if (vhost.indexOf("&") > 0) {
                        vhost = vhost.slice(0, vhost.indexOf("&"));
                    }
                }
            }

            if (a.hostname === vhost) {
                var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
                if (re.test(a.hostname)) {
                    vhost = "__defaultVhost__";
                }
            }

            var schema = "rtmp";
            if (url.indexOf("://") > 0) {
                schema = url.slice(0, url.indexOf("://"));
            }

            var port = a.port;
            if (!port) {
                if (schema === 'webrtc' && url.indexOf(`webrtc://${a.host}:`) === 0) {
                    port = (url.indexOf(`webrtc://${a.host}:80`) === 0) ? 80 : 443;
                }
                if (schema === 'http') {
                    port = 80;
                } else if (schema === 'https') {
                    port = 443;
                } else if (schema === 'rtmp') {
                    port = 1935;
                }
            }

            var ret = {
                url: url,
                schema: schema,
                server: a.hostname, port: port,
                vhost: vhost, app: app, stream: stream
            };
            self.__internal.fill_query(a.search, ret);

            if (!ret.port) {
                if (schema === 'webrtc' || schema === 'rtc') {
                    if (ret.user_query.schema === 'https') {
                        ret.port = 443;
                    } else if (window.location.href.indexOf('https://') === 0) {
                        ret.port = 443;
                    } else {
                        ret.port = 1985;
                    }
                }
            }

            return ret;
        },
        fill_query: function (query_string, obj) {
            obj.user_query = {};
            if (query_string.length === 0) {
                return;
            }
            if (query_string.indexOf("?") >= 0) {
                query_string = query_string.split("?")[1];
            }
            var queries = query_string.split("&");
            for (var i = 0; i < queries.length; i++) {
                var elem = queries[i];
                var query = elem.split("=");
                obj[query[0]] = query[1];
                obj.user_query[query[0]] = query[1];
            }
            if (obj.domain) {
                obj.user_query.vhost = obj.domain;
                obj.vhost = obj.domain;
            }
        }
    };

    self.pc = new RTCPeerConnection(null);
    self.stream = new MediaStream();

    self.pc.ontrack = function(event) {
        if (self.ontrack) {
            self.ontrack(event);
        }
    };

    return self;
}

// Depends on adapter-7.4.0.min.js from https://github.com/webrtc/adapter
// Async-await-promise based SRS RTC Publisher by WHIP.
function SrsRtcWhipWhepAsync() {
    var self = {};

    self.constraints = {
        audio: true,
        video: {
            width: {ideal: 320, max: 576}
        }
    };

    self.publish = async function (url, options) {
        if (url.indexOf('/whip/') === -1) throw new Error(`invalid WHIP url ${url}`);
        const hasAudio = options?.audio ?? true;
        const useCamera = options?.camera ?? true;
        const useScreen = options?.screen ?? false;

        if (!hasAudio && !useCamera && !useScreen) throw new Error(`The camera, screen and audio can't be false at the same time`);

        if (hasAudio) {
            self.pc.addTransceiver("audio", {direction: "sendonly"});
        } else {
            self.constraints.audio = false;
        }

        if (useCamera || useScreen) {
            self.pc.addTransceiver("video", {direction: "sendonly"});
        }

        if (!useCamera) {
            self.constraints.video = false;
        }

        if (!navigator.mediaDevices && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            throw new SrsError('HttpsRequiredError', `Please use HTTPS or localhost to publish, read https://github.com/ossrs/srs/issues/2762#issuecomment-983147576`);
        }

        if (useScreen) {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });
            displayStream.getTracks().forEach(function (track) {
                self.pc.addTrack(track);
                self.ontrack && self.ontrack({track: track});
            });
        }

        if (useCamera || hasAudio) {
            const userStream = await navigator.mediaDevices.getUserMedia(self.constraints);
            userStream.getTracks().forEach(function (track) {
                self.pc.addTrack(track);
                self.ontrack && self.ontrack({track: track});
            });
        }

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);
        const answer = await new Promise(function (resolve, reject) {
            console.log(`Generated offer: ${offer.sdp}`);

            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState !== xhr.DONE) return;
                if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
                const data = xhr.responseText;
                console.log("Got answer: ", data);
                return data.code ? reject(xhr) : resolve(data);
            }
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/sdp');
            xhr.send(offer.sdp);
        });
        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: answer})
        );

        return self.__internal.parseId(url, offer.sdp, answer);
    };

    self.play = async function(url, options) {
        if (url.indexOf('/whip-play/') === -1 && url.indexOf('/whep/') === -1) throw new Error(`invalid WHEP url ${url}`);
        if (options?.videoOnly && options?.audioOnly) throw new Error(`The videoOnly and audioOnly in options can't be true at the same time`);

        if (!options?.videoOnly) self.pc.addTransceiver("audio", {direction: "recvonly"});
        if (!options?.audioOnly) self.pc.addTransceiver("video", {direction: "recvonly"});

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);
        const answer = await new Promise(function(resolve, reject) {
            console.log(`Generated offer: ${offer.sdp}`);

            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState !== xhr.DONE) return;
                if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
                const data = xhr.responseText;
                console.log("Got answer: ", data);
                return data.code ? reject(xhr) : resolve(data);
            }
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/sdp');
            xhr.send(offer.sdp);
        });
        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: answer})
        );

        return self.__internal.parseId(url, offer.sdp, answer);
    };

    self.close = function () {
        self.pc && self.pc.close();
        self.pc = null;
    };

    self.ontrack = function (event) {
        self.stream.addTrack(event.track);
    };

    self.pc = new RTCPeerConnection(null);
    self.stream = new MediaStream();

    self.__internal = {
        parseId: (url, offer, answer) => {
            let sessionid = offer.substr(offer.indexOf('a=ice-ufrag:') + 'a=ice-ufrag:'.length);
            sessionid = sessionid.substr(0, sessionid.indexOf('\n') - 1) + ':';
            sessionid += answer.substr(answer.indexOf('a=ice-ufrag:') + 'a=ice-ufrag:'.length);
            sessionid = sessionid.substr(0, sessionid.indexOf('\n'));

            const a = document.createElement("a");
            a.href = url;
            return {
                sessionid: sessionid,
                simulator: a.protocol + '//' + a.host + '/rtc/v1/nack/',
            };
        },
        defaultPath: '/rtc/v1/whep/',
        prepareUrl: function (webrtcUrl) {
            var urlObject = self.__internal.parse(webrtcUrl);

            var schema = urlObject.user_query.schema;
            schema = schema ? schema + ':' : window.location.protocol;

            var port = urlObject.port || 1985;
            if (schema === 'https:') {
                port = urlObject.port || 443;
            }

            var api = urlObject.user_query.play || self.__internal.defaultPath;
            if (api.lastIndexOf('/') !== api.length - 1) {
                api += '/';
            }

            var apiUrl = schema + '//' + urlObject.server + ':' + port + api;
            for (var key in urlObject.user_query) {
                if (key !== 'api' && key !== 'play') {
                    apiUrl += '&' + key + '=' + urlObject.user_query[key];
                }
            }
            apiUrl = apiUrl.replace(api + '&', api + '?');

            var streamUrl = urlObject.url;

            return {
                apiUrl: apiUrl, streamUrl: streamUrl, schema: schema, urlObject: urlObject, port: port,
                tid: Number(parseInt(new Date().getTime()*Math.random()*100)).toString(16).slice(0, 7)
            };
        },
        parse: function (url) {
            if (typeof url !== 'string') {
                throw new SrsError('InvalidURL', 'URL must be a string.');
            }
            var a = document.createElement("a");
            a.href = url.replace("rtmp://", "http://")
                    .replace("webrtc://", "http://")
                    .replace("rtc://", "http://");

            var vhost = a.hostname;
            var app = a.pathname.substring(1, a.pathname.lastIndexOf("/"));
            var stream = a.pathname.slice(a.pathname.lastIndexOf("/") + 1);

            app = app.replace("...vhost...", "?vhost=");
            if (app.indexOf("?") >= 0) {
                var params = app.slice(app.indexOf("?"));
                app = app.slice(0, app.indexOf("?"));

                if (params.indexOf("vhost=") > 0) {
                    vhost = params.slice(params.indexOf("vhost=") + "vhost=".length);
                    if (vhost.indexOf("&") > 0) {
                        vhost = vhost.slice(0, vhost.indexOf("&"));
                    }
                }
            }

            if (a.hostname === vhost) {
                var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
                if (re.test(a.hostname)) {
                    vhost = "__defaultVhost__";
                }
            }

            var schema = "rtmp";
            if (url.indexOf("://") > 0) {
                schema = url.slice(0, url.indexOf("://"));
            }

            var port = a.port;
            if (!port) {
                if (schema === 'webrtc' && url.indexOf(`webrtc://${a.host}:`) === 0) {
                    port = (url.indexOf(`webrtc://${a.host}:80`) === 0) ? 80 : 443;
                }
                if (schema === 'http') {
                    port = 80;
                } else if (schema === 'https') {
                    port = 443;
                } else if (schema === 'rtmp') {
                    port = 1935;
                }
            }

            var ret = {
                url: url,
                schema: schema,
                server: a.hostname, port: port,
                vhost: vhost, app: app, stream: stream
            };
            self.__internal.fill_query(a.search, ret);

            if (!ret.port) {
                if (schema === 'webrtc' || schema === 'rtc') {
                    if (ret.user_query.schema === 'https') {
                        ret.port = 443;
                    } else if (window.location.href.indexOf('https://') === 0) {
                        ret.port = 443;
                    } else {
                        ret.port = 1985;
                    }
                }
            }

            return ret;
        },
        fill_query: function (query_string, obj) {
            obj.user_query = {};
            if (query_string.length === 0) {
                return;
            }
            if (query_string.indexOf("?") >= 0) {
                query_string = query_string.split("?")[1];
            }
            var queries = query_string.split("&");
            for (var i = 0; i < queries.length; i++) {
                var elem = queries[i];
                var query = elem.split("=");
                obj[query[0]] = query[1];
                obj.user_query[query[0]] = query[1];
            }
            if (obj.domain) {
                obj.user_query.vhost = obj.domain;
                obj.vhost = obj.domain;
            }
        }
    };

    self.pc = new RTCPeerConnection(null);
    self.stream = new MediaStream();

    self.pc.ontrack = function(event) {
        if (self.ontrack) {
            self.ontrack(event);
        }
    };

    return self;
}

// Format the codec of RTCRtpSender, kind(audio/video) is optional filter.
function SrsRtcFormatSenders(senders, kind) {
    var codecs = [];
    senders.forEach(function (sender) {
        var params = sender.getParameters();
        params && params.codecs && params.codecs.forEach(function(c) {
            if (kind && sender.track.kind !== kind) {
                return;
            }
            if (c.mimeType.indexOf('/red') > 0 || c.mimeType.indexOf('/rtx') > 0 || c.mimeType.indexOf('/fec') > 0) {
                return;
            }
            var s = '';
            s += c.mimeType.replace('audio/', '').replace('video/', '');
            s += ', ' + c.clockRate + 'HZ';
            if (sender.track.kind === "audio") {
                s += ', channels: ' + c.channels;
            }
            s += ', pt: ' + c.payloadType;
            codecs.push(s);
        });
    });
    return codecs.join(", ");
}
