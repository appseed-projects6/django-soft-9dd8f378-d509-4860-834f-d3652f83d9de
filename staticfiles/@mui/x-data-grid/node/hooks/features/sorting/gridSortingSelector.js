"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gridSortedRowIdsSelector = exports.gridSortedRowEntriesSelector = exports.gridSortModelSelector = exports.gridSortColumnLookupSelector = void 0;
var _createSelector = require("../../../utils/createSelector");
var _gridRowsSelector = require("../rows/gridRowsSelector");
/**
 * @category Sorting
 * @ignore - do not document.
 */
const gridSortingStateSelector = state => state.sorting;

/**
 * Get the id of the rows after the sorting process.
 * @category Sorting
 */
const gridSortedRowIdsSelector = exports.gridSortedRowIdsSelector = (0, _createSelector.createSelector)(gridSortingStateSelector, sortingState => sortingState.sortedRows);

/**
 * Get the id and the model of the rows after the sorting process.
 * @category Sorting
 */
const gridSortedRowEntriesSelector = exports.gridSortedRowEntriesSelector = (0, _createSelector.createSelectorMemoized)(gridSortedRowIdsSelector, _gridRowsSelector.gridRowsLookupSelector,
// TODO rows v6: Is this the best approach ?
(sortedIds, idRowsLookup) => sortedIds.map(id => ({
  id,
  model: idRowsLookup[id] ?? {}
})));

/**
 * Get the current sorting model.
 * @category Sorting
 */
const gridSortModelSelector = exports.gridSortModelSelector = (0, _createSelector.createSelector)(gridSortingStateSelector, sorting => sorting.sortModel);
/**
 * @category Sorting
 * @ignore - do not document.
 */
const gridSortColumnLookupSelector = exports.gridSortColumnLookupSelector = (0, _createSelector.createSelectorMemoized)(gridSortModelSelector, sortModel => {
  const result = sortModel.reduce((res, sortItem, index) => {
    res[sortItem.field] = {
      sortDirection: sortItem.sort,
      sortIndex: sortModel.length > 1 ? index + 1 : undefined
    };
    return res;
  }, {});
  return result;
});