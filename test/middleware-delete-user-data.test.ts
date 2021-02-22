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

import { WatsonMiddleware } from '../lib';
import nock = require('nock');
import { NoAuthAuthenticator } from 'ibm-watson/auth';

//Watson Assistant params
const service = {
  authenticator: new NoAuthAuthenticator(),
  url: 'http://ibm.com:80',
  version: '2018-07-10',
};

const workspaceId = 'zyxwv-54321';

const customerId = 'XXXXXX';

const middleware = new WatsonMiddleware({
  ...service,
  workspace_id: workspaceId,
});

beforeEach(function() {
  nock.disableNetConnect();
});

afterEach(function() {
  nock.cleanAll();
});

test('makes delete request', async () => {
  nock(service.url)
    .delete(`/v1/user_data?version=2018-07-10&customer_id=${customerId}`)
    .reply(202, '');

  await middleware.deleteUserData(customerId);
});

test('throws error on unexpected response code', async () => {
  nock(service.url)
    .delete(`/v1/user_data?version=2018-07-10&customer_id=${customerId}`)
    .reply(404, '');

  return await expect(middleware.deleteUserData(customerId)).rejects.toThrow(
    'Failed to delete user data, response code: 404, message: null',
  );
});
