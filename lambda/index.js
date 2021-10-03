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
 const APIPeriodicityHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIPeriodicity');
    },
    handle(handlerInput) {
        console.log("Api Request [APIPeriodicity]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const service = util.getApiSlot(handlerInput, "service").resolved;
        const serviceid = util.getApiSlot(handlerInput, "service").id;
        
        let periodicity = util.getApiSlot(handlerInput, "periodicity").id;
        const simpleinferred = util.getApiSlot(handlerInput, "simpleinferred").resolved
        const recurringinferred = util.getApiSlot(handlerInput, "recurringinferred").resolved

        if (simpleinferred) {
            periodicity = "simple"
            sessionAttributes["date"] = simpleinferred
        }
        if (recurringinferred) {
            periodicity = "recurrente"
            sessionAttributes["dows"] = []        
        }

        sessionAttributes["service"] = service
        sessionAttributes["serviceid"] = serviceid
        sessionAttributes["periodicity"] = periodicity

        let params = {
            status: periodicity,
            message: ""
        };

        return handlerInput.responseBuilder
            .withApiResponse(params)
            .withShouldEndSession(false)
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

        const date = util.getApiSlot(handlerInput, "date").resolved;
        const starttime = util.getApiSlot(handlerInput, "starttime").resolved;
        const endtime = util.getApiSlot(handlerInput, "endtime").resolved;

        sessionAttributes["date"] = date
        sessionAttributes["starttime"] = starttime
        sessionAttributes["endtime"] = endtime

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

        sessionAttributes["datesince"] = datesince
        sessionAttributes["dateuntil"] = dateuntil

        let recurring = sessionAttributes["dows"].map(e =>
            handlerInput.t('rec-item', e.dow, e.starttime, e.endtime)
        ).join(" and ")

        let message = handlerInput.t('confirm-rec', sessionAttributes["service"], recurring, datesince, dateuntil)

        if (sessionAttributes["serviceid"] == "65100") {
            message = handlerInput.t('blind-families-only')
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

const APIAddDowHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIAddDow');
    },
    handle(handlerInput) {
        console.log("Api Request [APIAddDow]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const dow = util.getApiSlot(handlerInput, "dow").resolved;
        const starttime = util.getApiSlot(handlerInput, "starttime").resolved;
        const endtime = util.getApiSlot(handlerInput, "endtime").resolved;

        if (!sessionAttributes["dows"]) {
            sessionAttributes["dows"] = []
        }

        sessionAttributes["dows"].push({
            dow: dow,
            starttime: starttime,
            endtime: endtime
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
        console.log("Api Request [APIRequestVolunteer]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let response = {
            status: 0,
            message: ""
        };
        //let's randomize the status!
        if (Math.random() > 0.5) {
            response.status = 1
            response.message = handlerInput.t('service-overlaps')
        } else {
            delete (sessionAttributes["dows"])
        }

        return handlerInput.responseBuilder
            .withApiResponse(response)
            .withShouldEndSession(false)
            .getResponse();
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
    }
}
// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(InitRequestInterceptor)
    .addRequestInterceptors(LogRequestInterceptor)
    .addResponseInterceptors(LogResponseInterceptor)
    .addRequestHandlers(
        LaunchRequestHandler,
        APIPeriodicityHandler,
        APIValidateArgsOnceHandler,
        APIAddDowHandler,
        APIValidateArgsRecurringHandler,
        APIRequestVolunteerHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .withCustomUserAgent('eleven-volunteers/v1')
    .lambda();