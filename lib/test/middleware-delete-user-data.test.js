"use strict";
/**
 * Copyright 2016-2019 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/index");
const nock = require("nock");
//Watson Assistant params
const service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: '2018-07-10',
};
const workspaceId = 'zyxwv-54321';
const customerId = 'XXXXXX';
const middleware = new index_1.WatsonMiddleware(Object.assign(Object.assign({}, service), { workspace_id: workspaceId }));
beforeEach(function () {
    nock.disableNetConnect();
});
afterEach(function () {
    nock.cleanAll();
});
test('makes delete request', () => __awaiter(void 0, void 0, void 0, function* () {
    nock(service.url)
        .delete(`/v1/user_data?version=2018-07-10&customer_id=${customerId}`)
        .reply(202, '');
    yield middleware.deleteUserData(customerId);
}));
test('throws error on unexpected response code', () => __awaiter(void 0, void 0, void 0, function* () {
    nock(service.url)
        .delete(`/v1/user_data?version=2018-07-10&customer_id=${customerId}`)
        .reply(404, '');
    return yield expect(middleware.deleteUserData(customerId)).rejects.toThrow('Failed to delete user data, response code: 404, message: null');
}));
//# sourceMappingURL=middleware-delete-user-data.test.js.map