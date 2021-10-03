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
/**
 * Helper method to find if a request is for a certain apiName. 
 */
module.exports.isApiRequest = (handlerInput, apiName) => {
    try {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked'
            && handlerInput.requestEnvelope.request.apiRequest.name === apiName;
    } catch (e) {
        console.log('Error occurred: ', e);
        return false;
    }
}

/**
 * Helper method to get API request entity from the request envelope.
 */
module.exports.getApiArguments = (handlerInput) => {
    try {
        return handlerInput.requestEnvelope.request.apiRequest.arguments;
    } catch (e) {
        console.log('Error occurred: ', e);
        return false;
    }
}

/**
 * Helper method to get API resolved entity from the request envelope.
 */
module.exports.getApiSlots = (handlerInput) => {
    try {
        return handlerInput.requestEnvelope.request.apiRequest.slots;
    } catch (e) {
        console.log('Error occurred: ', e);
        return false;
    }
}


module.exports.getApiSlot = function (handlerInput, slot) {
    const filledSlots = handlerInput.requestEnvelope.request.apiRequest.slots

    if (filledSlots[slot]) {
        if (filledSlots[slot] &&
            filledSlots[slot].resolutions &&
            filledSlots[slot].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[slot].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[slot].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[slot].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    return {
                        id: filledSlots[slot].resolutions.resolutionsPerAuthority[0].values[0].value.id,
                        heardAs: filledSlots[slot].value,
                        resolved: filledSlots[slot].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        confirmationStatus: filledSlots[slot].confirmationStatus,
                        ERstatus: 'ER_SUCCESS_MATCH'
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    return {
                        id: null,
                        heardAs: filledSlots[slot].value,
                        resolved: '',
                        confirmationStatus: filledSlots[slot].confirmationStatus,
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    return {
                        id: null,
                        heardAs: filledSlots[slot].value,
                        resolved: '',
                        confirmationStatus: filledSlots[slot].confirmationStatus,
                        ERstatus: ''
                    };
                    break;
            }
        } else {
            return {
                id: null,
                heardAs: filledSlots[slot].value,
                resolved: filledSlots[slot].value,
                confirmationStatus: filledSlots[slot].confirmationStatus,
                ERstatus: ''
            };
        }
    } else {
        return {
            id: null,
            heardAs: '',
            resolved: '',
            confirmationStatus: '',
            ERstatus: ''
        }
    }

}

module.exports.getAPISlotValues = function (handlerInput) {
    const filledSlots = handlerInput.requestEnvelope.request.apiRequest.slots
    const slotValues = {};

    Object.keys(filledSlots).forEach((item) => {
        const name = item;

        if (filledSlots[item] &&
            filledSlots[item].resolutions &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name] = {
                        id: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.id,
                        heardAs: filledSlots[item].value,
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        confirmationStatus: filledSlots[item].confirmationStatus,
                        ERstatus: 'ER_SUCCESS_MATCH'
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    slotValues[name] = {
                        id: "UNKNOWN",
                        heardAs: filledSlots[item].value,
                        resolved: '',
                        confirmationStatus: filledSlots[item].confirmationStatus,
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    slotValues[name] = {
                        id: null,
                        heardAs: filledSlots[item].value,
                        resolved: '',
                        confirmationStatus: filledSlots[item].confirmationStatus,
                        ERstatus: ''
                    };
                    break;
            }
        } else {
            slotValues[name] = {
                id: null,
                heardAs: filledSlots[item].value,
                resolved: filledSlots[item].value,
                confirmationStatus: filledSlots[item].confirmationStatus,
                ERstatus: ''
            };
        }
    }, this);
    return slotValues;
}
