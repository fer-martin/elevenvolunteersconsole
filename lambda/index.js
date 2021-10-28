/**
 * Copyright 2020 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 **/

const Alexa = require('ask-sdk-core');
const util = require('./util');
const moment = require('moment-timezone');

const ACEPTACION = true;
const SERVER_ANISOC_PRODUCCION = "oauth.once.es";
const SERVER_ANISOC_ACEPTACION = "oauth-act.once.es";
let SERVER_ANISOC = SERVER_ANISOC_PRODUCCION;
if (ACEPTACION) SERVER_ANISOC = SERVER_ANISOC_ACEPTACION;
const xml2js = require('xml2js-es6-promise');
const soap_as_promised = require('soap-as-promised');
const TIMEOUT = 6000; //timeout para las llamadas a los webservices

const Uuid = require('uuid/v4');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechOutput = handlerInput.t('welcome')

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
}

/**
 * API Handler for Check Params
 */
const APIValidateArgsOnceHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIValidateArgsOnce');
    },
    handle(handlerInput) {
        console.log("Api Request [APIValidateArgsOnce]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const service = util.getApiSlot(handlerInput, "service").resolved;
        const serviceid = util.getApiSlot(handlerInput, "service").id;
        const date = util.getApiSlot(handlerInput, "date").resolved;
        const starttime = util.getApiSlot(handlerInput, "starttime").resolved;
        const duration = util.getApiSlot(handlerInput, "duration").resolved;
        const endtime = moment('2000-01-01T' + starttime).add(moment.duration(duration)).locale('es').format('HH:mm')

        sessionAttributes["service"] = service
        sessionAttributes["serviceid"] = serviceid
        sessionAttributes["date"] = date
        sessionAttributes["starttime"] = starttime
        sessionAttributes["endtime"] = endtime
        sessionAttributes["periodicity"] = "simple"

        let message = handlerInput.t('confirm-once', sessionAttributes["service"], date, starttime, endtime)

        if (sessionAttributes["serviceid"] == "65100") {
            message += handlerInput.t('blind-families-only')
        }

        let params = {
            status: 0,
            message: message
        };

        return handlerInput.responseBuilder
            .withApiResponse(params)
            .withShouldEndSession(false)
            .getResponse();
    }
}

const APIValidateArgsRecurringHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIValidateArgsRecurring');
    },
    handle(handlerInput) {
        console.log("Api Request [APIValidateArgsRecurring]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const datesince = util.getApiSlot(handlerInput, "datesince").resolved;
        const dateuntil = util.getApiSlot(handlerInput, "dateuntil").resolved;

        sessionAttributes["date"] = datesince
        sessionAttributes["dateuntil"] = dateuntil
        sessionAttributes["periodicity"] = "recurrente"

        let recurring = sessionAttributes["dows"].map(e =>
            handlerInput.t('rec-item', e.dow, e.starttime, e.duration)
        ).join(" y ")

        let message = handlerInput.t('confirm-rec', sessionAttributes["service"], recurring, datesince, dateuntil)

        if (sessionAttributes["serviceid"] == "65100") {
            message = handlerInput.t('blind-families-only')
        }

        let params = {
            status: 0,
            message: message
        };

        //Chequeamos fecha desde y hasta, y +90 días
        if (!moment(datesince).isAfter()) {
            params.status = 1
            params.message = "la fecha de inicio no puede ser anterior a hoy."
        }
        if (!moment(dateuntil).isAfter(moment(datesince))) {
            params.status = 2
            params.message = "la fecha de finalización no puede ser anterior a la de inicio."
        }
        if (moment(dateuntil).isAfter(moment(datesince).add(90, 'days'))) {
            params.status = 2
            params.message = "la fecha de finalización no puede ser más de 90 días después del inicio."
        }

        return handlerInput.responseBuilder
            .withApiResponse(params)
            .withShouldEndSession(false)
            .getResponse();
    }
}

const APIAddDowHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIAddDow');
    },
    handle(handlerInput) {
        console.log("Api Request [APIAddDow]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const service = util.getApiSlot(handlerInput, "service").resolved;
        const serviceid = util.getApiSlot(handlerInput, "service").id;
        const dow = util.getApiSlot(handlerInput, "dow").resolved;
        const starttime = util.getApiSlot(handlerInput, "starttime").resolved;
        const duration = util.getApiSlot(handlerInput, "duration").resolved;
        const endtime = moment('2000-01-01T' + starttime).add(moment.duration(duration)).locale('es').format('HH:mm')

        sessionAttributes["service"] = service
        sessionAttributes["serviceid"] = serviceid

        if (!sessionAttributes["dows"]) {
            sessionAttributes["dows"] = []
        }

        sessionAttributes["dows"].push({
            dow: dow,
            starttime: starttime,
            endtime: endtime,
            duration: duration
        })

        let message = ""

        let params = {
            status: 0,
            message: message
        };

        return handlerInput.responseBuilder
            .withApiResponse(params)
            .withShouldEndSession(false)
            .getResponse();
    }
}

/**
 * API Handler for RecordColor API
 *
 * @param handlerInput
 * @returns API response object
 *
 * See https://developer.amazon.com/en-US/docs/alexa/conversations/handle-api-calls.html
 */
const APIRequestVolunteerHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIRequestVolunteer');
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log("Api Request [APIRequestVolunteer]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        let response = {
            status: 0,
            message: ""
        };

        //Primero chequeamos que tenga el token y si no volvemos con error de falta de token
        if (!handlerInput.requestEnvelope.context.System.user.accessToken) {
            response.status = 1
            response.message = handlerInput.t('account-not-linked')
            return handlerInput.responseBuilder
                .withApiResponse(response)
                .withLinkAccountCard()
                .withShouldEndSession(false)
                .getResponse();
        }

        //aqui hay que enviar el pedido al servicio
        return altaServicioAlexa(handlerInput)
            .then(response =>
                handlerInput.responseBuilder
                    .withApiResponse(response)
                    .withShouldEndSession(false)
                    .getResponse()
            )
    }
}

const APIServicesHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIServices');
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log("Api Request [APIServices]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        let response = {
            status: 0,
            message: "",
            data: []
        };

        //Primero chequeamos que tenga el token y si no volvemos con error de falta de token
        if (!handlerInput.requestEnvelope.context.System.user.accessToken) {
            response.status = 1
            response.message = handlerInput.t('account-not-linked')
            return handlerInput.responseBuilder
                .withApiResponse(response)
                .withLinkAccountCard()
                .withShouldEndSession(false)
                .getResponse();
        }

        //aqui hay que enviar el pedido al servicio
        return selectServiciosBeneficiario(handlerInput)
            .then(response => handlerInput.responseBuilder
                .withApiResponse(response)
                .withShouldEndSession(false)
                .getResponse()

            )
    }
}

const APIServicesHelpHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIServicesHelp');
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log("Api Request [APIServicesHelp]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        let response = {
            status: 0,
            message: "",
            data: []
        };

        //Primero chequeamos que tenga el token y si no volvemos con error de falta de token
        if (!handlerInput.requestEnvelope.context.System.user.accessToken) {
            response.status = 1
            response.message = handlerInput.t('account-not-linked')
            return handlerInput.responseBuilder
                .withApiResponse(response)
                .withLinkAccountCard()
                .withShouldEndSession(false)
                .getResponse();
        }
        response.data = [
            "<s>acompañamiento</s>",
            "<s>acompañamiento telefónico</s>",
            "<s>perros guía</s>",
            "<s>acceso a la información</s>",
            "<s>tiflotécnica</s>",
            "<s>voluntariado digital</s>",
            "<s>cultural recreativo</s>",
            "<s>apoyo a familias</s>",
            "<s>deportivo</s>",
            "<s>qué servicio deseas solicitar?</s>"
        ]
        
        return handlerInput.responseBuilder
            .withApiResponse(response)
            .resetContext()
            .withShouldEndSession(false)
            .getResponse()
    }
}
/**
 * FallbackIntentHandler - Handle all other requests to the skill
 *
 * @param handlerInput
 * @returns response
 *
 * See https://developer.amazon.com/en-US/docs/alexa/conversations/handle-api-calls.html
 */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        console.log('In catch all intent handler. Intent invoked: ' + intentName);
        const speechOutput = handlerInput.t('fallback')

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    },
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};
// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = handlerInput.t('error');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
// *****************************************************************************
// These simple interceptors just log the incoming and outgoing request bodies to assist in debugging.

const LogRequestInterceptor = {
    process(handlerInput) {
        console.log(`Request: ${handlerInput.requestEnvelope.request.type} ${handlerInput.requestEnvelope.request.type == "IntentRequest" ? handlerInput.requestEnvelope.request.intent.name : ""}`);
        console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
    },
};

const LogResponseInterceptor = {
    process(handlerInput, response) {
        console.log(`RESPONSE = ${JSON.stringify(response)}`);
    },
};

const InitRequestInterceptor = {
    process(handlerInput) {
        const i18n = require('./i18n')
        handlerInput.t = (...args) => i18n.response(handlerInput.requestEnvelope.request.locale, ...args);

        handlerInput.responseBuilder.resetContext = function () {

            let directive = {
                "type": "Conversations.ResetContext"
            }

            handlerInput.responseBuilder.addDirective(directive)

            return handlerInput.responseBuilder
        }

        handlerInput.responseBuilder.delegateToConversations = function (utteranceSetName, slots) {

            let directive = {
                "type": "Dialog.DelegateRequest",
                "target": "AMAZON.Conversations",
                "period": {
                    "until": "EXPLICIT_RETURN"
                },
                "updatedRequest": {
                    "type": "Dialog.InputRequest",
                    "input": {
                        "name": utteranceSetName
                    }
                }
            }

            if (slots) directive.updatedRequest.input.slots = slots

            handlerInput.responseBuilder.addDirective(directive)

            return handlerInput.responseBuilder
        }

        handlerInput.responseBuilder.delegateToIntent = function (intentName, slots) {

            let directive = {
                "type": "Dialog.DelegateRequest",
                "target": "skill",
                "period": {
                    "until": "EXPLICIT_RETURN"
                },
                "updatedRequest": {
                    "type": "IntentRequest",
                    "intent": {
                        "name": intentName
                    }
                }
            }

            if (slots) directive.updatedRequest.intent.slots = slots

            handlerInput.responseBuilder.addDirective(directive)

            return handlerInput.responseBuilder
        }

    }
}

// ONCE Webservices
function getTokenInfo(handlerInput) {
    const jwt_decode = require("jwt-decode");
    try {
        return jwt_decode(handlerInput.requestEnvelope.context.System.user.accessToken);
    }
    catch (e) {
        if (e instanceof InvalidTokenError) return {}
        return {}
    }
}

/**
 * Llama al WS altaServicioAlexa para dar de alta un servicio de voluntariado
 */
function altaServicioAlexa(handlerInput) {
    var sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};

    const servicio = sessionAttributes["serviceid"]
    const fechadesde = sessionAttributes["date"]
    const fechahasta = sessionAttributes["dateuntil"]
    const horadesde = sessionAttributes["starttime"]
    const horahasta = sessionAttributes["endtime"]
    const repeticion = sessionAttributes["periodicity"]
    const periodico_dias = sessionAttributes["dows"]

    console.log(`ENVIO AL WEBSERVICE altaServicioAlexa`);

    console.log(`${servicio}, ${repeticion}, ${fechadesde}, ${fechahasta}, ${horadesde}, ${horahasta}, ${periodico_dias}`);

    const authHeaders = { "Authorization": "bearer " + handlerInput.requestEnvelope.context.System.user.accessToken }

    let t = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            resolve({ status: 1, message: handlerInput.t('timeout-transact') })
        }, TIMEOUT)
    });

    let p = new Promise((resolve, reject) => {
        let options = { endpoint: `https://${SERVER_ANISOC}/volunt/ProxyServices/VOLUNT_WEB_WebTr_PS`, escapeXML: false, wsdl_headers: authHeaders };

        var CBB_Servicio = '';
        var CBO_SUBPROGRAMA = '';
        var CBO_Periodico = '';
        var DTP_Fecha = '';
        var DTP_Desde = '';
        var DTP_Hasta = '';
        var LCO_DiaSemana_EXT = '';
        var LCO_Fecha_EXT = '';
        var LCO_HoraDesde_EXT = '';
        var LCO_HoraHasta_EXT = '';
        var LCO_Observaciones_EXT = '';

        var dow_translation = {
            'lunes': 'L~Lunes',
            'martes': 'M~Martes',
            'miércoles': 'X~Miércoles',
            'jueves': 'J~Jueves',
            'viernes': 'V~Viernes',
            'sábado': 'S~Sábado',
            'domingo': 'D~Domingo'
        }

        if (repeticion == 'recurrente') {
            //caso periodico
            CBB_Servicio = allServices[servicio].NAME_Servicio;
            CBO_SUBPROGRAMA = allServices[servicio].ID_Subprograma;
            CBO_Periodico = "1";
            LCO_Observaciones_EXT = '';

            var start = moment(fechadesde);
            var end = moment(fechahasta);

            var dow;
            var required_days = periodico_dias.map(e => e.dow);
            //generamos el array de fechas
            var o = occurrence(required_days);

            var LCO_Fecha_arr = [];
            var LCO_DiaSemana_arr = [];
            var LCO_HoraDesde_arr = [];
            var LCO_HoraHasta_arr = [];
            var LCO_Observaciones_arr = [];
            var today = start;
            while (true) {
                if (today.isAfter(end)) break;
                //vamos a ver si el dia de la semana de hoy está en el array
                dow = today.locale('es').format('dddd');
                if (o[dow]) {
                    //agregamos la fecha
                    LCO_Fecha_arr.push(...[...Array(o[dow])].map((_, i) => today.format('YYYYMMDD')));
                    //agregamos el dia de semana
                    LCO_DiaSemana_arr.push(...[...Array(o[dow])].map((_, i) => dow_translation[dow]));
                    //agregamos la hora desde
                    LCO_HoraDesde_arr.push(...periodico_dias.filter(e => e.dow == dow).map(e => e.starttime));
                    //agregamos la hora hasta
                    LCO_HoraHasta_arr.push(...periodico_dias.filter(e => e.dow == dow).map(e => e.endtime));
                    //agregamos la observacion
                    LCO_Observaciones_arr.push(...[...Array(o[dow])].map((_, i) => ""));
                }

                today = today.add(1, 'days');
            }
            DTP_Fecha = LCO_Fecha_arr[0]; //el primer dia solicitado
            DTP_Desde = LCO_Fecha_arr[0];
            DTP_Hasta = LCO_Fecha_arr[LCO_Fecha_arr.length - 1]; //el ultimo dia solicitado
            LCO_Fecha_EXT = LCO_Fecha_arr.join("^");
            LCO_DiaSemana_EXT = LCO_DiaSemana_arr.join("^");
            LCO_HoraDesde_EXT = LCO_HoraDesde_arr.join("^");
            LCO_HoraHasta_EXT = LCO_HoraHasta_arr.join("^");
            LCO_Observaciones_EXT = LCO_Observaciones_arr.join("^");

        } else {
            //caso individual
            CBB_Servicio = allServices[servicio].NAME_Servicio;
            CBO_SUBPROGRAMA = allServices[servicio].ID_Subprograma;
            CBO_Periodico = "0";
            DTP_Fecha = moment(fechadesde).format('YYYYMMDD'); //'20190701'
            DTP_Desde = '';
            DTP_Hasta = '';
            LCO_DiaSemana_EXT = dow_translation[moment(fechadesde).locale('es').format('dddd')];
            LCO_Fecha_EXT = moment(fechadesde).format('YYYYMMDD'); //'20190701'
            LCO_HoraDesde_EXT = horadesde; //'09:00'
            LCO_HoraHasta_EXT = horahasta; //'12:00'
            LCO_Observaciones_EXT = '';
        }

        let params = {
            "CBB_Servicio": CBB_Servicio,
            "CBO_SUBPROGRAMA": CBO_SUBPROGRAMA,
            "CBO_Periodico": CBO_Periodico,
            "DTP_Fecha": DTP_Fecha,
            "DTP_Desde": DTP_Desde,
            "DTP_Hasta": DTP_Hasta,
            "TBO_IDENT": getTokenInfo(handlerInput).codigoUnico,
            "LCO_TipoBene": "01",
            "LCO_DiaSemana_EXT": LCO_DiaSemana_EXT,
            "LCO_Fecha_EXT": LCO_Fecha_EXT,
            "LCO_HoraDesde_EXT": LCO_HoraDesde_EXT,
            "LCO_HoraHasta_EXT": LCO_HoraHasta_EXT,
            "LCO_Observaciones_EXT": LCO_Observaciones_EXT
        };

        soap_as_promised.createClient(`https://${SERVER_ANISOC}/volunt/ProxyServices/VOLUNT_WEB_WebTr_PS?WSDL`, options)
            .then((client) => client.altaServicioAlexa({ arg0: generarParametrosParaWS(params) }, {}, authHeaders))
            .then((result) => {
                //console.log(result); //resultado en bruto
                return xml2js(result.return)
            })
            .then((js) => {
                console.log(`RESULTADO DEL WEBSERVICE altaServicioAlexa: ${JSON.stringify(js)}`);
                let res = result2json(js.ER.D)
                console.log(res)
                if (res[0].resultadoVolunt == '0') {
                    resolve({ status: 0, message: "" })
                } else {
                    resolve({ status: 1, message: res[0].avisoVolunt || handlerInput.t('error-ws') });
                }
            })
            .catch((error) => {
                console.error(error)
                console.log("ERROR EN EL WEBSERVICE altaServicioAlexa")
                resolve({ status: 1, message: (handlerInput.t("solicitud-denegada") + " " + handlerInput.t('error-ws')) });
            });
    });

    return Promise.race([p, t]);
}

/**
 *  Llama al WS identificaUsuario para verificar que el usuario es válido y traer los programas que tiene habilitados
 */
function identificaUsuario(handlerInput, codigo) {
    var session = handlerInput.attributesManager.getSessionAttributes() || {};
    console.log(`ENVIO AL WEBSERVICE identificaUsuario`);

    const authHeaders = { "Authorization": "bearer " + handlerInput.requestEnvelope.context.System.user.accessToken }

    let t = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject(handlerInput.t('timeout', 'identificación del usuario'))
        }, 5500) //le bajo el timeout a esta llamada, porque en el login se hace más tarde y 7 seg es mucho
    });

    let p = new Promise((resolve, reject) => {
        let options = { endpoint: `https://${SERVER_ANISOC}/volunt/ProxyServices/VOLUNT_WEB_WebTr_PS`, escapeXML: false, wsdl_headers: authHeaders };

        let params = {
            "TBO_IDENT": codigo,
        };

        soap_as_promised.createClient(`https://${SERVER_ANISOC}/volunt/ProxyServices/VOLUNT_WEB_WebTr_PS?WSDL`, options)
            .then((client) => client.identificaUsuario({ arg0: generarParametrosParaWS(params) }, {}, authHeaders))
            .then((result) => {
                //console.log(result); //resultado en bruto
                return xml2js(result.return)
            })
            .then((js) => {
                console.log(`RESULTADO DEL WEBSERVICE identificaUsuario: ${JSON.stringify(js)}`);
                let ret = Object.assign({}, result2json(js.ER.D)[0])
                if (ret.resultadoVolunt == "1") {
                    //es un error, el resultado del error está en "avisoVolunt"
                    reject(ret.avisoVolunt)
                }
                ret.programas = result2json(js.ER.L[0].D)
                resolve(ret);
            })
            .catch((error) => {
                console.error(error)
                console.log("ERROR EN EL WEBSERVICE identificaUsuario")
                reject(handlerInput.t('error-ws'));
            });
    });

    return Promise.race([p, t]);
}

/**
 *  Llama al WS selectServiciosBeneficiario para traer los servicios que tiene ya dados de alta
 */
function selectServiciosBeneficiario(handlerInput) {
    var session = handlerInput.attributesManager.getSessionAttributes() || {};
    console.log(`ENVIO AL WEBSERVICE selectServiciosBeneficiario`);

    const authHeaders = { "Authorization": "bearer " + handlerInput.requestEnvelope.context.System.user.accessToken }

    let t = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            resolve({ status: 1, message: handlerInput.t('timeout-transact') })
        }, TIMEOUT)
    });

    let p = new Promise((resolve, reject) => {
        let options = { endpoint: `https://${SERVER_ANISOC}/volunt/ProxyServices/VOLUNT_WEB_WebTr_PS`, escapeXML: false, wsdl_headers: authHeaders };

        let params = {
            "P_CD_BENF": getTokenInfo(handlerInput).codigoUnico,
        };

        soap_as_promised.createClient(`https://${SERVER_ANISOC}/volunt/ProxyServices/VOLUNT_WEB_WebTr_PS?WSDL`, options)
            .then((client) => client.selectServiciosBeneficiario({ arg0: generarParametrosParaWS(params) }, {}, authHeaders))
            .then((result) => {
                //console.log(result); //resultado en bruto
                return xml2js(result.return)
            })
            .then((js) => {
                console.log(`RESULTADO DEL WEBSERVICE selectServiciosBeneficiario: ${JSON.stringify(js)}`);
                let ret = result2json(js.ER.D);
                if (ret[0].resultadoVolunt != '0') {
                    resolve({ status: 1, message: ret[0].avisoVolunt, data: [] })
                }

                let tmp = result2json(js.ER.L[0].D)
                let servs = {}
                tmp.map(e => {

                    if (!servs[e.LCO_ID_SERV]) {
                        servs[e.LCO_ID_SERV] = {
                            LCO_CD_PROGRAMA: "",
                            LCO_DS_PROGRAMA: "",
                            LCO_CD_SUBPROGRAMA: "",
                            LCO_DS_SUBPROGRAMA: "",
                            FECHA_DESDE: "30000101",
                            FECHA_HASTA: "10000101",
                            cant: 0,
                            dias: []
                        }
                    }

                    servs[e.LCO_ID_SERV].LCO_CD_PROGRAMA = e.LCO_CD_PROGRAMA
                    servs[e.LCO_ID_SERV].LCO_DS_PROGRAMA = e.LCO_DS_PROGRAMA
                    servs[e.LCO_ID_SERV].LCO_CD_SUBPROGRAMA = e.LCO_CD_SUBPROGRAMA
                    servs[e.LCO_ID_SERV].LCO_DS_SUBPROGRAMA = e.LCO_DS_SUBPROGRAMA
                    servs[e.LCO_ID_SERV].FECHA_DESDE = e.LCO_FX_SERV < servs[e.LCO_ID_SERV].FECHA_DESDE ? e.LCO_FX_SERV : servs[e.LCO_ID_SERV].FECHA_DESDE
                    servs[e.LCO_ID_SERV].FECHA_HASTA = e.LCO_FX_SERV > servs[e.LCO_ID_SERV].FECHA_HASTA ? e.LCO_FX_SERV : servs[e.LCO_ID_SERV].FECHA_HASTA
                    servs[e.LCO_ID_SERV].cant++
                    let x = [e.LCO_DIA_SEMANA, e.LCO_HORA_DESDE, e.LCO_HORA_HASTA].join("~")

                    if (servs[e.LCO_ID_SERV].dias.indexOf(x) == -1) servs[e.LCO_ID_SERV].dias.push(x)

                })

                let data = []
                Object.values(servs).forEach(e => {

                    if (e.cant == 1) {
                        //es por unica vez
                        let [dia, hora_desde, hora_hasta] = e.dias[0].split("~")
                        data.push(service_detail_once(
                            e.LCO_DS_PROGRAMA,
                            e.LCO_DS_SUBPROGRAMA,
                            moment(e.FECHA_DESDE).locale('es').format('dddd, D[ de ]MMMM[ de ]YYYY'),
                            hora_desde,
                            hora_hasta)
                        )

                    } else {
                        //es periodico
                        //escribimos los dias
                        let horarios = ""
                        e.dias.forEach(d => {
                            let [dia, hora_desde, hora_hasta] = d.split("~")
                            horarios += service_detail_periodic_days(translate_dow(dia), hora_desde, hora_hasta)
                        })

                        data.push(service_detail_periodic(
                            e.LCO_DS_PROGRAMA,
                            e.LCO_DS_SUBPROGRAMA,
                            moment(e.FECHA_DESDE).locale('es').format('dddd, D[ de ]MMMM[ de ]YYYY'),
                            moment(e.FECHA_HASTA).locale('es').format('dddd, D[ de ]MMMM[ de ]YYYY'),
                            e.cant,
                            horarios)
                        )
                    }
                })
                if (data.length) {
                    resolve({ status: 0, message: `Tiene ${data.length} servicio${data.length != 1 ? "s" : ""} activo${data.length != 1 ? "s" : ""}.`, data: data });
                } else {
                    resolve({ status: 0, message: "No tiene servicios activos", data: data });
                }

            })
            .catch((error) => {
                console.error(error)
                console.log("ERROR EN EL WEBSERVICE selectServiciosBeneficiario")
                resolve({ status: 1, message: handlerInput.t('error-ws'), data: "" });
            });
    });

    return Promise.race([p, t]);
}

function occurrence(array) {
    "use strict";
    var result = {};
    if (array instanceof Array) { // Check if input is array.
        array.forEach(function (v, i) {
            if (!result[v]) { // Initial object property creation.
                result[v] = 1; // Create an array for that property.
            } else { // Same occurrences found.
                result[v]++; // Fill the array.
            }
        });
    }
    return result;
};

/**
 * genera el XML para el parametro arg0 de todas las consultas
 * @param {*} params 
 */
function generarParametrosParaWS(params) {
    let ejbparams = {
        'manageTransaction': 'EXECUTE',
        'transactorID': Uuid(), //?generar al azar un UUID para cada transaccion?
        'SYS_USUARIO': 'mvg',
        'SYS_PERSONA': '12341520',
        'APPLICATION_NAME': 'VOLUNT',
        'IDLOG': 'Ww4a-5Q7QP_uRSz2AlT0DSAhIf7zypdoYs0xBBsiYxE8qGci24GX_112_1581002595191', //? verificar
        'ejbType': "3"
    };
    let allp = { ...params, ...ejbparams };
    let output = "<![CDATA[";
    Object.keys(allp).forEach(
        key => {
            output += `<D N="${key}">${allp[key]}</D>`;
        }
    );
    output += "]]>";
    console.log(`The params are: ${JSON.stringify(allp)}`);
    return output;
}

/**
 * Devuelve un array de objetos con los keys de la respuesta y los valores spliteados por ^
 * @param {} data 
 * @param single: si el registro es uno solo, no lo separa por ^
 */
function result2json(data, single) {
    var r = [];
    if (single) {
        tmp = {};
        data.forEach(el => {
            tmp[el["$"].N] = el["_"] || "";
        });
        r.push(tmp);
    } else {
        data.forEach(el => {
            if ((el["_"] || "") == "") return;
            (el["_"] || "").split("^").forEach((val, idx) => { var tmp = (r[idx] || {}); tmp[el["$"].N] = val; r[idx] = tmp })
        });
    }
    return r;
}

function translate_dow(d) {
    let dow_translation = {
        'L': 'lunes',
        'M': 'martes',
        'X': 'miércoles',
        'J': 'jueves',
        'V': 'viernes',
        'S': 'sábados',
        'D': 'domingos'
    }

    return dow_translation[d]
}
function service_detail_once(servicio, subprograma, fecha, desde, hasta) {
    return `<s>Servicio para ${servicio} ${subprograma} el día ${fecha}; desde las ${desde}, hasta las ${hasta}.</s>`
}
function service_detail_periodic(servicio, subprograma, fechadesde, fechahasta, cant, horarios) {
    return `<s>Servicio periódico de ${servicio} ${subprograma}, en ${cant} ocasiones desde el día ${fechadesde}, hasta el día ${fechahasta}.</s>${horarios}`
}
function service_detail_periodic_days(dia, desde, hasta) {
    return `<s>los ${dia}, de las ${desde} hasta las ${hasta}.</s>`
}

///Servicios válidos, con datos de programa y subprograma de cada uno
//para los programas, los id son todos los subprogramas separados por coma
//para poder incorporalos a los validos cuando me dan el id de programa como habilitado
const allServices = {
    "17400": {
        "id": "17400",
        "enabled": true,
        "ID_Servicio": "174",
        "ID_Subprograma": "17400",
        "NAME_Servicio": "174~ACCESO A LA INFORMACIÓN",
        "NAME_Subprograma": "17400~Sin especificar/sin seleccionar/en general",
        "desc": "acceso a la información"
    },
    "17402": {
        "id": "17402",
        "enabled": true,
        "ID_Servicio": "174",
        "ID_Subprograma": "17402",
        "NAME_Servicio": "174~ACCESO A LA INFORMACIÓN",
        "NAME_Subprograma": "17402~Consolidación braille-tiflotécnica",
        "desc": "consolidación braille-tiflotécnica"
    },
    "17403": {
        "id": "17403",
        "enabled": true,
        "ID_Servicio": "174",
        "ID_Subprograma": "17403",
        "NAME_Servicio": "174~ACCESO A LA INFORMACIÓN",
        "NAME_Subprograma": "17403~Voluntariado digital",
        "desc": "voluntariado digital"
    },
    "17499": {
        "id": "17499",
        "enabled": false,
        "ID_Servicio": "174",
        "ID_Subprograma": "17499",
        "NAME_Servicio": "174~ACCESO A LA INFORMACIÓN",
        "NAME_Subprograma": "17499~Otros (no activo)",
        "desc": "otros voluntariado digital"
    },
    "61000": {
        "id": "61000",
        "enabled": true,
        "ID_Servicio": "61",
        "ID_Subprograma": "61000",
        "NAME_Servicio": "61~ACOMPAÑAMIENTO",
        "NAME_Subprograma": "61000~Sin especificar/sin seleccionar/en general",
        "desc": "acompañamiento"
    },
    "61001": {
        "id": "61001",
        "enabled": true,
        "ID_Servicio": "61",
        "ID_Subprograma": "61001",
        "NAME_Servicio": "61~ACOMPAÑAMIENTO",
        "NAME_Subprograma": "61001~Acompañamiento telefónico",
        "desc": "acompañamiento telefónico"
    },
    "61100": {
        "id": "61100",
        "enabled": true,
        "ID_Servicio": "61",
        "ID_Subprograma": "61100",
        "NAME_Servicio": "61~ACOMPAÑAMIENTO",
        "NAME_Subprograma": "61100~Perros guía",
        "desc": "perros guía"
    },
    "61099": {
        "id": "61099",
        "enabled": false,
        "ID_Servicio": "61",
        "ID_Subprograma": "61099",
        "NAME_Servicio": "61~ACOMPAÑAMIENTO",
        "NAME_Subprograma": "61099~Otros (no activo)",
        "desc": "otros acompañamientos"
    },
    "65000": {
        "id": "65000",
        "enabled": true,
        "ID_Servicio": "65",
        "ID_Subprograma": "65000",
        "NAME_Servicio": "65~CULTURAL RECREATIVO",
        "NAME_Subprograma": "65000~Sin especificar/sin seleccionar/en general",
        "desc": "cultural recreativo"
    },
    "65100": {
        "id": "65100",
        "enabled": true,
        "ID_Servicio": "65",
        "ID_Subprograma": "65100",
        "NAME_Servicio": "65~CULTURAL RECREATIVO",
        "NAME_Subprograma": "65100~Apoyo a familias",
        "desc": "apoyo a familias"
    },
    "65099": {
        "id": "65099",
        "enabled": false,
        "ID_Servicio": "65",
        "ID_Subprograma": "65099",
        "NAME_Servicio": "65~CULTURAL RECREATIVO",
        "NAME_Subprograma": "65099~Otros (no activo)",
        "desc": "otros cultural recreativo"
    },
    "64000": {
        "id": "64000",
        "enabled": true,
        "ID_Servicio": "64",
        "ID_Subprograma": "64000",
        "NAME_Servicio": "64~DEPORTIVO",
        "NAME_Subprograma": "64000~Sin especificar/sin seleccionar/en general",
        "desc": "deportivo"
    },
    "64099": {
        "id": "64099",
        "enabled": false,
        "ID_Servicio": "64",
        "ID_Subprograma": "64099",
        "NAME_Servicio": "64~DEPORTIVO",
        "NAME_Subprograma": "64099~Otros (no activo)",
        "desc": "otros deportivo"
    },
    "8000": {
        "id": "8000",
        "enabled": false,
        "ID_Servicio": "80",
        "ID_Subprograma": "8000",
        "NAME_Servicio": "80~DIFUSIÓN/TUTORIZACIÓN",
        "NAME_Subprograma": "8000~Sin especificar/sin seleccionar/en general",
        "desc": "difusión y tutorización"
    },
    "8001": {
        "id": "8001",
        "enabled": false,
        "ID_Servicio": "80",
        "ID_Subprograma": "8001",
        "NAME_Servicio": "80~DIFUSIÓN/TUTORIZACIÓN",
        "NAME_Subprograma": "8001~Difusión",
        "desc": "difusión"
    },
    "8002": {
        "id": "8002",
        "enabled": false,
        "ID_Servicio": "80",
        "ID_Subprograma": "8002",
        "NAME_Servicio": "80~DIFUSIÓN/TUTORIZACIÓN",
        "NAME_Subprograma": "8002~Tutorización",
        "desc": "tutorización"
    },
    "7000": {
        "id": "7000",
        "enabled": false,
        "ID_Servicio": "70",
        "ID_Subprograma": "7000",
        "NAME_Servicio": "70~VOLUNTARIADO INTERNACIONAL",
        "NAME_Subprograma": "7000~Voluntariado internacional",
        "desc": "voluntariado internacional"
    },
    "7002": {
        "id": "7002",
        "enabled": false,
        "ID_Servicio": "70",
        "ID_Subprograma": "7002",
        "NAME_Servicio": "70~VOLUNTARIADO INTERNACIONAL",
        "NAME_Subprograma": "7002~Formación e inclusión laboral",
        "desc": "Formación e inclusión laboral"
    },
    "7003": {
        "id": "7003",
        "enabled": false,
        "ID_Servicio": "70",
        "ID_Subprograma": "7003",
        "NAME_Servicio": "70~VOLUNTARIADO INTERNACIONAL",
        "NAME_Subprograma": "7003~Fortalecimiento mov. asoc. de personas ciegas",
        "desc": "fortalecimiento mov. asoc. de personas ciegas"
    },
    "7001": {
        "id": "7001",
        "enabled": false,
        "ID_Servicio": "70",
        "ID_Subprograma": "7001",
        "NAME_Servicio": "70~VOLUNTARIADO INTERNACIONAL",
        "NAME_Subprograma": "7001~Inclusión educativa",
        "desc": "inclusión educativa"
    },
}

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
const skillBuilder = Alexa.SkillBuilders.custom();
skillBuilder
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(InitRequestInterceptor)
    .addRequestInterceptors(LogRequestInterceptor)
    .addResponseInterceptors(LogResponseInterceptor)
    .addRequestHandlers(
        LaunchRequestHandler,
        APIValidateArgsOnceHandler,
        APIAddDowHandler,
        APIValidateArgsRecurringHandler,
        APIRequestVolunteerHandler,
        APIServicesHandler,
        APIServicesHelpHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .withCustomUserAgent('eleven-volunteers/v1')
    .lambda();

exports.handler = (event, context, callback) => {
    // we need this so that async stuff will work better
    context.callbackWaitsForEmptyEventLoop = false

    // set up the skill with the new context
    return skillBuilder.lambda()(event, context, callback);
}