import assert from 'chai/chai'
import feathersNuxt from '../src/index'
import { feathersSocketioClient as feathersClient } from './fixtures/feathers-client'
import Vue from 'vue'
import Vuex from 'vuex'
import { diff as deepDiff } from 'deep-object-diff'
import {
  initAuth,
  getServicePrefix,
  getServiceCapitalization,
  getQueryInfo
} from '../src/utils'

Vue.use(Vuex)

const { service, auth } = feathersNuxt(feathersClient)

describe('Utils', function () {
  it('properly populates auth', function () {
    const store = new Vuex.Store({
      plugins: [
        service('todos'),
        auth()
      ]
    })
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoiOTk5OTk5OTk5OTkiLCJuYW1lIjoiSm9obiBEb2UiLCJhZG1pbiI6dHJ1ZX0.lUlEd3xH-TnlNRbKM3jnDVTNoIg10zgzaS6QyFZE-6g'
    const req = {
      headers: {
        cookie: 'feathers-jwt=' + accessToken
      }
    }
    return initAuth({
      commit: store.commit,
      req,
      moduleName: 'auth',
      cookieName: 'feathers-jwt'
    })
      .then(payload => {
        assert(store.state.auth.accessToken === accessToken, 'the token was in place')
        assert(store.state.auth.payload, 'the payload was set')
        return feathersClient.passport.getJWT()
      })
      .then((token) => {
        assert.isDefined(token, 'the feathers client storage was set')
      })
  })

  describe('Pagination', function () {
    it('getQueryInfo', function () {
      const params = {
        qid: 'main-list',
        query: {
          test: true,
          $limit: 10,
          $skip: 0
        }
      }
      const response = {
        data: [],
        limit: 10,
        skip: 0,
        total: 500
      }
      const info = getQueryInfo(params, response)
      const expected = {
        'qid': 'main-list',
        'query': {
          'test': true,
          '$limit': 10,
          '$skip': 0
        },
        'queryId': '{"test":true}',
        'queryParams': {
          'test': true
        },
        'pageParams': {
          '$limit': 10,
          '$skip': 0
        },
        'pageId': '{"$limit":10,"$skip":0}'
      }
      const diff = deepDiff(info, expected)

      assert.deepEqual(info, expected, 'query info formatted correctly')
    })

    it('getQueryInfo no limit or skip', function () {
      const params = {
        qid: 'main-list',
        query: {
          test: true
        }
      }
      const response = {
        data: [],
        limit: 10,
        skip: 0,
        total: 500
      }
      const info = getQueryInfo(params, response)
      const expected = {
        'qid': 'main-list',
        'query': {
          'test': true
        },
        'queryId': '{"test":true}',
        'queryParams': {
          'test': true
        },
        'pageParams': {
          '$limit': 10,
          '$skip': 0
        },
        'pageId': '{"$limit":10,"$skip":0}'
      }
      const diff = deepDiff(info, expected)

      assert.deepEqual(info, expected, 'query info formatted correctly')
    })
  })

  describe('Inflections', function () {
    it('properly inflects the service prefix', function () {
      const decisionTable = [
        ['todos', 'todos'],
        ['TODOS', 'tODOS'],
        ['environment-Panos', 'environmentPanos'],
        ['env-panos', 'envPanos'],
        ['envPanos', 'envPanos'],
        ['api/v1/env-panos', 'envPanos']
      ]
      decisionTable.forEach(([ path, prefix ]) => {
        assert(getServicePrefix(path) === prefix, `The service prefix for path "${path}" was "${getServicePrefix(path)}", expected "${prefix}"`)
      })
    })

    it('properly inflects the service capitalization', function () {
      const decisionTable = [
        ['todos', 'Todos'],
        ['TODOS', 'TODOS'],
        ['environment-Panos', 'EnvironmentPanos'],
        ['env-panos', 'EnvPanos'],
        ['envPanos', 'EnvPanos'],
        ['api/v1/env-panos', 'EnvPanos']
      ]
      decisionTable.forEach(([ path, prefix ]) => {
        assert(getServiceCapitalization(path) === prefix, `The service prefix for path "${path}" was "${getServiceCapitalization(path)}", expected "${prefix}"`)
      })
    })
  })
})
