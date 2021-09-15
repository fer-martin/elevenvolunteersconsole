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
/**
 * API Handler for Check Params
 */
 const CheckParamsApiHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIValidateArgsOnce');
    },
    handle(handlerInput) {
        console.log("Api Request [APIValidateArgsOnce]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const slots = util.getAPISlotValues(handlerInput);
        const service = slots["service"].resolved;
        const date = slots["date"].resolved;
        const time = slots["time"].resolved;
        const duration = slots["duration"].resolved;
        const serviceid = slots["service"].id

        let message = handlerInput.t('confirm-once', service, date, time, duration)

        if (serviceid == "65100") {
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

const CheckParamsApiRecurringHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIValidateArgsRecurring');
    },
    handle(handlerInput) {
        console.log("Api Request [APIValidateArgsRecurring]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const slots = util.getAPISlotValues(handlerInput);
        const service = slots["service"].resolved;
        const dow = slots["dow"].resolved;
        const time = slots["time"].resolved;
        const duration = slots["duration"].resolved;
        const since = slots["since"].resolved;
        const until = slots["until"].resolved;
        const serviceid = slots["service"].id
        /*
        if (!sessionAttributes["dows"]) {
            sessionAttributes["dows"] = []
        }

        sessionAttributes["dows"].push({
            dow: dow,
            time: time,
            duration: duration
        })
        */
        let recurring = sessionAttributes["dows"].map(e => 
            handlerInput.t('rec-item', e.dow, e.time, e.duration)
        ).join(" and ")

        let message = handlerInput.t('confirm-rec', service, recurring, since, until)

        if (serviceid == "65100") {
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

const AddDowApiHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'APIAddDow');
    },
    handle(handlerInput) {
        console.log("Api Request [APIAddDow]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const slots = util.getAPISlotValues(handlerInput);
        const dow = slots["dow"].resolved;
        const time = slots["time"].resolved;
        const duration = slots["duration"].resolved;

        if (!sessionAttributes["dows"]) {
            sessionAttributes["dows"] = []
        }

        sessionAttributes["dows"].push({
            dow: dow,
            time: time,
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
const RequestVolunteerApiHandler = {
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
            delete(sessionAttributes["dows"])
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
        RequestVolunteerApiHandler,
        CheckParamsApiHandler,
        CheckParamsApiRecurringHandler,
        AddDowApiHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .withCustomUserAgent('eleven-volunteers/v1')
    .lambda();