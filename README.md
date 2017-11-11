# abibao-snowplow

[![CircleCI](https://circleci.com/gh/abibao/abibao-snowplow.svg?style=shield)](https://circleci.com/gh/abibao/abibao-snowplow)
[![CodeFactor](https://www.codefactor.io/repository/github/abibao/abibao-snowplow/badge/master)](https://www.codefactor.io/repository/github/abibao/abibao-snowplow/overview/master)
[![Coverage Status](https://coveralls.io/repos/github/abibao/abibao-snowplow/badge.svg?branch=master)](https://coveralls.io/github/abibao/abibao-snowplow?branch=master)

# rethinkdb examples

### hasFields not

```js

r.db('aggregators').table('individuals').filter(function(individual) {
  return individual.hasFields('SMF_QUARTIERFRAIS_PRIORISATION01').not()
})
```

### aggregator

```js

r.db('aggregators').table('individuals')
  .filter(function(item) {
    return item.hasFields('ABIBAO_ANSWER_FONDAMENTAL_AGE')
  })
  .pluck('id', 'ABIBAO_ANSWER_FONDAMENTAL_AGE')
  .map(function(item) {
    return {
      email: item('id'),
      value: item('ABIBAO_ANSWER_FONDAMENTAL_AGE')('answer')
    }
  })
  .group('value').count()
  .ungroup()
  .map(function(item) {
    return {
      value: item('group'),
      count: item('reduction')
    }
  });
```
