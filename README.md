# rethinkdb

### hasFields not

```js

r.db('aggregators').table('individuals').filter(function(individual) {
  return individual.hasFields('SMF_QUARTIERFRAIS_PRIORISATION01').not()
})
```

### aggregator example

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
