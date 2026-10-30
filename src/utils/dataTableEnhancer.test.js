import test from 'node:test'
import assert from 'node:assert/strict'
import { compareDataTableValues, dataTableValue } from './dataTableEnhancer.js'

function cell(textContent, sortValue) {
  return { textContent, dataset: sortValue === undefined ? {} : { sortValue } }
}

test('data-table values recognize currency, percentages, and plain numbers', () => {
  assert.deepEqual(dataTableValue(cell('INR 55,000.00')), { type: 'number', value: 55000 })
  assert.deepEqual(dataTableValue(cell('82%')), { type: 'number', value: 82 })
  assert.deepEqual(dataTableValue(cell('1,250')), { type: 'number', value: 1250 })
})

test('data-table values recognize ISO and named dates', () => {
  assert.equal(dataTableValue(cell('2026-10-29')).type, 'date')
  assert.equal(dataTableValue(cell('Oct 29, 2026')).type, 'date')
})

test('empty values sort after populated values', () => {
  assert.equal(compareDataTableValues(dataTableValue(cell('—')), dataTableValue(cell('Alpha'))), 1)
  assert.equal(compareDataTableValues(dataTableValue(cell('Alpha')), dataTableValue(cell('-'))), -1)
})

test('text comparison uses natural numeric ordering', () => {
  assert.ok(compareDataTableValues(dataTableValue(cell('TASK-2')), dataTableValue(cell('TASK-10'))) < 0)
})

test('explicit data-sort-value takes precedence over display text', () => {
  assert.deepEqual(dataTableValue(cell('High', '3')), { type: 'number', value: 3 })
})
