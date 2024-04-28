import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { unstable_useEnhancedEffect as useEnhancedEffect, unstable_useEventCallback as useEventCallback } from '@mui/utils';
import useLazyRef from '@mui/utils/useLazyRef';
import useTimeout from '@mui/utils/useTimeout';
import { useTheme } from '@mui/material/styles';
import { useGridPrivateApiContext } from '../../utils/useGridPrivateApiContext';
import { useGridRootProps } from '../../utils/useGridRootProps';
import { useGridSelector } from '../../utils/useGridSelector';
import { useResizeObserver } from '../../utils/useResizeObserver';
import { useRunOnce } from '../../utils/useRunOnce';
import { gridVisibleColumnDefinitionsSelector, gridVisiblePinnedColumnDefinitionsSelector, gridColumnPositionsSelector, gridHasColSpanSelector } from '../columns/gridColumnsSelector';
import { gridDimensionsSelector } from '../dimensions/gridDimensionsSelectors';
import { gridPinnedRowsSelector } from '../rows/gridRowsSelector';
import { gridFocusCellSelector, gridTabIndexCellSelector } from '../focus/gridFocusStateSelector';
import { useGridVisibleRows, getVisibleRows } from '../../utils/useGridVisibleRows';
import { useGridApiEventHandler } from '../../utils';
import { clamp, range } from '../../../utils/utils';
import { selectedIdsLookupSelector } from '../rowSelection/gridRowSelectionSelector';
import { gridRowsMetaSelector } from '../rows/gridRowsMetaSelector';
import { getFirstNonSpannedColumnToRender } from '../columns/gridColumnsUtils';
import { getMinimalContentHeight } from '../rows/gridRowsUtils';
import { gridRenderContextSelector, gridVirtualizationEnabledSelector, gridVirtualizationColumnEnabledSelector } from './gridVirtualizationSelectors';
import { EMPTY_RENDER_CONTEXT } from './useGridVirtualization';
import { jsx as _jsx } from "react/jsx-runtime";
const MINIMUM_COLUMN_WIDTH = 50;
var ScrollDirection = /*#__PURE__*/function (ScrollDirection) {
  ScrollDirection[ScrollDirection["NONE"] = 0] = "NONE";
  ScrollDirection[ScrollDirection["UP"] = 1] = "UP";
  ScrollDirection[ScrollDirection["DOWN"] = 2] = "DOWN";
  ScrollDirection[ScrollDirection["LEFT"] = 3] = "LEFT";
  ScrollDirection[ScrollDirection["RIGHT"] = 4] = "RIGHT";
  return ScrollDirection;
}(ScrollDirection || {});
const EMPTY_SCROLL_POSITION = {
  top: 0,
  left: 0
};
export const EMPTY_DETAIL_PANELS = Object.freeze(new Map());
const createScrollCache = (mode, rowBufferPx, columnBufferPx, verticalBuffer, horizontalBuffer) => ({
  direction: ScrollDirection.NONE,
  buffer: bufferForDirection(mode, ScrollDirection.NONE, rowBufferPx, columnBufferPx, verticalBuffer, horizontalBuffer)
});
const isJSDOM = typeof window !== 'undefined' ? /jsdom/.test(window.navigator.userAgent) : false;
export const useGridVirtualScroller = () => {
  const apiRef = useGridPrivateApiContext();
  const rootProps = useGridRootProps();
  const visibleColumns = useGridSelector(apiRef, gridVisibleColumnDefinitionsSelector);
  const enabled = useGridSelector(apiRef, gridVirtualizationEnabledSelector) && !isJSDOM;
  const enabledForColumns = useGridSelector(apiRef, gridVirtualizationColumnEnabledSelector) && !isJSDOM;
  const dimensions = useGridSelector(apiRef, gridDimensionsSelector);
  const outerSize = dimensions.viewportOuterSize;
  const pinnedRows = useGridSelector(apiRef, gridPinnedRowsSelector);
  const pinnedColumns = useGridSelector(apiRef, gridVisiblePinnedColumnDefinitionsSelector);
  const hasBottomPinnedRows = pinnedRows.bottom.length > 0;
  const [panels, setPanels] = React.useState(EMPTY_DETAIL_PANELS);
  const theme = useTheme();
  const cellFocus = useGridSelector(apiRef, gridFocusCellSelector);
  const cellTabIndex = useGridSelector(apiRef, gridTabIndexCellSelector);
  const rowsMeta = useGridSelector(apiRef, gridRowsMetaSelector);
  const selectedRowsLookup = useGridSelector(apiRef, selectedIdsLookupSelector);
  const currentPage = useGridVisibleRows(apiRef, rootProps);
  const gridRootRef = apiRef.current.rootElementRef;
  const mainRef = apiRef.current.mainElementRef;
  const scrollerRef = apiRef.current.virtualScrollerRef;
  const scrollbarVerticalRef = React.useRef(null);
  const scrollbarHorizontalRef = React.useRef(null);
  const contentHeight = dimensions.contentSize.height;
  const columnsTotalWidth = dimensions.columnsTotalWidth;
  const hasColSpan = useGridSelector(apiRef, gridHasColSpanSelector);
  useResizeObserver(mainRef, () => apiRef.current.resize());

  /*
   * Scroll context logic
   * ====================
   * We only render the cells contained in the `renderContext`. However, when the user starts scrolling the grid
   * in a direction, we want to render as many cells as possible in that direction, as to avoid presenting white
   * areas if the user scrolls too fast/far and the viewport ends up in a region we haven't rendered yet. To render
   * more cells, we store some offsets to add to the viewport in `scrollCache.buffer`. Those offsets make the render
   * context wider in the direction the user is going, but also makes the buffer around the viewport `0` for the
   * dimension (horizontal or vertical) in which the user is not scrolling. So if the normal viewport is 8 columns
   * wide, with a 1 column buffer (10 columns total), then we want it to be exactly 8 columns wide during vertical
   * scroll.
   * However, we don't want the rows in the old context to re-render from e.g. 10 columns to 8 columns, because that's
   * work that's not necessary. Thus we store the context at the start of the scroll in `frozenContext`, and the rows
   * that are part of this old context will keep their same render context as to avoid re-rendering.
   */
  const scrollPosition = React.useRef(EMPTY_SCROLL_POSITION);
  const previousContextScrollPosition = React.useRef(EMPTY_SCROLL_POSITION);
  const previousRowContext = React.useRef(EMPTY_RENDER_CONTEXT);
  const renderContext = useGridSelector(apiRef, gridRenderContextSelector);
  const scrollTimeout = useTimeout();
  const frozenContext = React.useRef(undefined);
  const scrollCache = useLazyRef(() => createScrollCache(theme.direction, rootProps.rowBufferPx, rootProps.columnBufferPx, dimensions.rowHeight * 15, MINIMUM_COLUMN_WIDTH * 6)).current;
  const focusedCell = {
    rowIndex: React.useMemo(() => cellFocus ? currentPage.rows.findIndex(row => row.id === cellFocus.id) : -1, [cellFocus, currentPage.rows]),
    columnIndex: React.useMemo(() => cellFocus ? visibleColumns.findIndex(column => column.field === cellFocus.field) : -1, [cellFocus, visibleColumns])
  };
  const updateRenderContext = React.useCallback(nextRenderContext => {
    if (areRenderContextsEqual(nextRenderContext, apiRef.current.state.virtualization.renderContext)) {
      return;
    }
    const didRowsIntervalChange = nextRenderContext.firstRowIndex !== previousRowContext.current.firstRowIndex || nextRenderContext.lastRowIndex !== previousRowContext.current.lastRowIndex;
    apiRef.current.setState(state => {
      return _extends({}, state, {
        virtualization: _extends({}, state.virtualization, {
          renderContext: nextRenderContext
        })
      });
    });

    // The lazy-loading hook is listening to `renderedRowsIntervalChange`,
    // but only does something if the dimensions are also available.
    // So we wait until we have valid dimensions before publishing the first event.
    if (dimensions.isReady && didRowsIntervalChange) {
      previousRowContext.current = nextRenderContext;
      apiRef.current.publishEvent('renderedRowsIntervalChange', nextRenderContext);
    }
    previousContextScrollPosition.current = scrollPosition.current;
  }, [apiRef, dimensions.isReady]);
  const triggerUpdateRenderContext = () => {
    const newScroll = {
      top: scrollerRef.current.scrollTop,
      left: scrollerRef.current.scrollLeft
    };
    const dx = newScroll.left - scrollPosition.current.left;
    const dy = newScroll.top - scrollPosition.current.top;
    const isScrolling = dx !== 0 || dy !== 0;
    scrollPosition.current = newScroll;
    const direction = isScrolling ? directionForDelta(dx, dy) : ScrollDirection.NONE;

    // Since previous render, we have scrolled...
    const rowScroll = Math.abs(scrollPosition.current.top - previousContextScrollPosition.current.top);
    const columnScroll = Math.abs(scrollPosition.current.left - previousContextScrollPosition.current.left);

    // PERF: use the computed minimum column width instead of a static one
    const didCrossThreshold = rowScroll >= dimensions.rowHeight || columnScroll >= MINIMUM_COLUMN_WIDTH;
    const didChangeDirection = scrollCache.direction !== direction;
    const shouldUpdate = didCrossThreshold || didChangeDirection;
    if (!shouldUpdate) {
      return renderContext;
    }

    // Render a new context

    if (didChangeDirection) {
      switch (direction) {
        case ScrollDirection.NONE:
        case ScrollDirection.LEFT:
        case ScrollDirection.RIGHT:
          frozenContext.current = undefined;
          break;
        default:
          frozenContext.current = renderContext;
          break;
      }
    }
    scrollCache.direction = direction;
    scrollCache.buffer = bufferForDirection(theme.direction, direction, rootProps.rowBufferPx, rootProps.columnBufferPx, dimensions.rowHeight * 15, MINIMUM_COLUMN_WIDTH * 6);
    const inputs = inputsSelector(apiRef, rootProps, enabled, enabledForColumns);
    const nextRenderContext = computeRenderContext(inputs, scrollPosition.current, scrollCache);

    // Prevents batching render context changes
    ReactDOM.flushSync(() => {
      updateRenderContext(nextRenderContext);
    });
    scrollTimeout.start(1000, triggerUpdateRenderContext);
    return nextRenderContext;
  };
  const forceUpdateRenderContext = () => {
    const inputs = inputsSelector(apiRef, rootProps, enabled, enabledForColumns);
    const nextRenderContext = computeRenderContext(inputs, scrollPosition.current, scrollCache);
    updateRenderContext(nextRenderContext);
  };
  const handleScroll = useEventCallback(event => {
    const {
      scrollTop,
      scrollLeft
    } = event.currentTarget;

    // On iOS and macOS, negative offsets are possible when swiping past the start
    if (scrollTop < 0) {
      return;
    }
    if (theme.direction === 'ltr') {
      if (scrollLeft < 0) {
        return;
      }
    }
    if (theme.direction === 'rtl') {
      if (scrollLeft > 0) {
        return;
      }
    }
    const nextRenderContext = triggerUpdateRenderContext();
    apiRef.current.publishEvent('scrollPositionChange', {
      top: scrollTop,
      left: scrollLeft,
      renderContext: nextRenderContext
    });
  });
  const handleWheel = useEventCallback(event => {
    apiRef.current.publishEvent('virtualScrollerWheel', {}, event);
  });
  const handleTouchMove = useEventCallback(event => {
    apiRef.current.publishEvent('virtualScrollerTouchMove', {}, event);
  });
  const getRows = (params = {}) => {
    if (!params.rows && !currentPage.range) {
      return [];
    }
    const baseRenderContext = params.renderContext ?? renderContext;
    const isLastSection = !hasBottomPinnedRows && params.position === undefined || hasBottomPinnedRows && params.position === 'bottom';
    const isPinnedSection = params.position !== undefined;
    let rowIndexOffset;
    // FIXME: Why is the switch check exhaustiveness not validated with typescript-eslint?
    // eslint-disable-next-line default-case
    switch (params.position) {
      case 'top':
        rowIndexOffset = 0;
        break;
      case 'bottom':
        rowIndexOffset = pinnedRows.top.length + currentPage.rows.length;
        break;
      case undefined:
        rowIndexOffset = pinnedRows.top.length;
        break;
    }
    const rowModels = params.rows ?? currentPage.rows;
    const firstRowToRender = baseRenderContext.firstRowIndex;
    const lastRowToRender = Math.min(baseRenderContext.lastRowIndex, rowModels.length);
    const rowIndexes = params.rows ? range(0, params.rows.length) : range(firstRowToRender, lastRowToRender);
    let virtualRowIndex = -1;
    if (!isPinnedSection && focusedCell.rowIndex !== -1) {
      if (focusedCell.rowIndex < firstRowToRender) {
        virtualRowIndex = focusedCell.rowIndex;
        rowIndexes.unshift(virtualRowIndex);
      }
      if (focusedCell.rowIndex >= lastRowToRender) {
        virtualRowIndex = focusedCell.rowIndex;
        rowIndexes.push(virtualRowIndex);
      }
    }
    const rows = [];
    const rowProps = rootProps.slotProps?.row;
    const columnPositions = gridColumnPositionsSelector(apiRef);
    rowIndexes.forEach(rowIndexInPage => {
      const {
        id,
        model
      } = rowModels[rowIndexInPage];

      // NOTE: This is an expensive feature, the colSpan code could be optimized.
      if (hasColSpan) {
        const minFirstColumn = pinnedColumns.left.length;
        const maxLastColumn = visibleColumns.length - pinnedColumns.right.length;
        apiRef.current.calculateColSpan({
          rowId: id,
          minFirstColumn,
          maxLastColumn,
          columns: visibleColumns
        });
        if (pinnedColumns.left.length > 0) {
          apiRef.current.calculateColSpan({
            rowId: id,
            minFirstColumn: 0,
            maxLastColumn: pinnedColumns.left.length,
            columns: visibleColumns
          });
        }
        if (pinnedColumns.right.length > 0) {
          apiRef.current.calculateColSpan({
            rowId: id,
            minFirstColumn: visibleColumns.length - pinnedColumns.right.length,
            maxLastColumn: visibleColumns.length,
            columns: visibleColumns
          });
        }
      }
      const hasFocus = cellFocus?.id === id;
      const baseRowHeight = !apiRef.current.rowHasAutoHeight(id) ? apiRef.current.unstable_getRowHeight(id) : 'auto';
      let isSelected;
      if (selectedRowsLookup[id] == null) {
        isSelected = false;
      } else {
        isSelected = apiRef.current.isRowSelectable(id);
      }
      let isFirstVisible = false;
      if (params.position === undefined) {
        isFirstVisible = rowIndexInPage === 0;
      }
      let isLastVisible = false;
      if (isLastSection) {
        if (!isPinnedSection) {
          const lastIndex = currentPage.rows.length - 1;
          const isLastVisibleRowIndex = rowIndexInPage === lastIndex;
          if (isLastVisibleRowIndex) {
            isLastVisible = true;
          }
        } else {
          isLastVisible = rowIndexInPage === rowModels.length - 1;
        }
      }
      const isVirtualRow = rowIndexInPage === virtualRowIndex;
      const isNotVisible = isVirtualRow;
      let tabbableCell = null;
      if (cellTabIndex !== null && cellTabIndex.id === id) {
        const cellParams = apiRef.current.getCellParams(id, cellTabIndex.field);
        tabbableCell = cellParams.cellMode === 'view' ? cellTabIndex.field : null;
      }
      let currentRenderContext = baseRenderContext;
      if (!isPinnedSection && frozenContext.current && rowIndexInPage >= frozenContext.current.firstRowIndex && rowIndexInPage < frozenContext.current.lastRowIndex) {
        currentRenderContext = frozenContext.current;
      }
      const offsetLeft = computeOffsetLeft(columnPositions, currentRenderContext, theme.direction, pinnedColumns.left.length);
      const rowIndex = (currentPage?.range?.firstRowIndex || 0) + rowIndexOffset + rowIndexInPage;
      rows.push( /*#__PURE__*/_jsx(rootProps.slots.row, _extends({
        row: model,
        rowId: id,
        index: rowIndex,
        selected: isSelected,
        offsetTop: params.rows ? undefined : rowsMeta.positions[rowIndexInPage],
        offsetLeft: offsetLeft,
        dimensions: dimensions,
        rowHeight: baseRowHeight,
        tabbableCell: tabbableCell,
        pinnedColumns: pinnedColumns,
        visibleColumns: visibleColumns,
        renderContext: currentRenderContext,
        focusedColumnIndex: hasFocus ? focusedCell.columnIndex : undefined,
        isFirstVisible: isFirstVisible,
        isLastVisible: isLastVisible,
        isNotVisible: isNotVisible
      }, rowProps), id));
      const panel = panels.get(id);
      if (panel) {
        rows.push(panel);
      }
      if (isLastVisible) {
        rows.push(apiRef.current.getInfiniteLoadingTriggerElement?.({
          lastRowId: id
        }));
      }
    });
    return rows;
  };
  const needsHorizontalScrollbar = outerSize.width && columnsTotalWidth >= outerSize.width;
  const scrollerStyle = React.useMemo(() => ({
    overflowX: !needsHorizontalScrollbar ? 'hidden' : undefined,
    overflowY: rootProps.autoHeight ? 'hidden' : undefined
  }), [needsHorizontalScrollbar, rootProps.autoHeight]);
  const contentSize = React.useMemo(() => {
    // In cases where the columns exceed the available width,
    // the horizontal scrollbar should be shown even when there're no rows.
    // Keeping 1px as minimum height ensures that the scrollbar will visible if necessary.
    const height = Math.max(contentHeight, 1);
    const size = {
      width: needsHorizontalScrollbar ? columnsTotalWidth : 'auto',
      height
    };
    if (rootProps.autoHeight) {
      if (currentPage.rows.length === 0) {
        size.height = getMinimalContentHeight(apiRef); // Give room to show the overlay when there no rows.
      } else {
        size.height = contentHeight;
      }
    }
    return size;
  }, [apiRef, columnsTotalWidth, contentHeight, needsHorizontalScrollbar, rootProps.autoHeight, currentPage.rows.length]);
  React.useEffect(() => {
    apiRef.current.publishEvent('virtualScrollerContentSizeChange');
  }, [apiRef, contentSize]);
  useEnhancedEffect(() => {
    // FIXME: Is this really necessary?
    apiRef.current.resize();
  }, [apiRef, rowsMeta.currentPageTotalHeight]);
  useEnhancedEffect(() => {
    if (enabled) {
      // TODO a scroll reset should not be necessary
      scrollerRef.current.scrollLeft = 0;
      scrollerRef.current.scrollTop = 0;
    }
  }, [enabled, gridRootRef, scrollerRef]);
  useRunOnce(outerSize.width !== 0, () => {
    const inputs = inputsSelector(apiRef, rootProps, enabled, enabledForColumns);
    const initialRenderContext = computeRenderContext(inputs, scrollPosition.current, scrollCache);
    updateRenderContext(initialRenderContext);
    apiRef.current.publishEvent('scrollPositionChange', {
      top: scrollPosition.current.top,
      left: scrollPosition.current.left,
      renderContext: initialRenderContext
    });
  });
  apiRef.current.register('private', {
    updateRenderContext: forceUpdateRenderContext
  });
  useGridApiEventHandler(apiRef, 'columnsChange', forceUpdateRenderContext);
  useGridApiEventHandler(apiRef, 'filteredRowsSet', forceUpdateRenderContext);
  useGridApiEventHandler(apiRef, 'rowExpansionChange', forceUpdateRenderContext);
  return {
    renderContext,
    setPanels,
    getRows,
    getContainerProps: () => ({
      ref: mainRef
    }),
    getScrollerProps: () => ({
      ref: scrollerRef,
      tabIndex: -1,
      onScroll: handleScroll,
      onWheel: handleWheel,
      onTouchMove: handleTouchMove,
      style: scrollerStyle,
      role: 'presentation'
    }),
    getContentProps: () => ({
      style: contentSize,
      role: 'presentation'
    }),
    getRenderZoneProps: () => ({
      role: 'rowgroup'
    }),
    getScrollbarVerticalProps: () => ({
      ref: scrollbarVerticalRef,
      role: 'presentation'
    }),
    getScrollbarHorizontalProps: () => ({
      ref: scrollbarHorizontalRef,
      role: 'presentation'
    })
  };
};
function inputsSelector(apiRef, rootProps, enabled, enabledForColumns) {
  const dimensions = gridDimensionsSelector(apiRef.current.state);
  const currentPage = getVisibleRows(apiRef, rootProps);
  const visibleColumns = gridVisibleColumnDefinitionsSelector(apiRef);
  const lastRowId = apiRef.current.state.rows.dataRowIds.at(-1);
  const lastColumn = visibleColumns.at(-1);
  return {
    enabled,
    enabledForColumns,
    apiRef,
    autoHeight: rootProps.autoHeight,
    rowBufferPx: rootProps.rowBufferPx,
    columnBufferPx: rootProps.columnBufferPx,
    leftPinnedWidth: dimensions.leftPinnedWidth,
    columnsTotalWidth: dimensions.columnsTotalWidth,
    viewportInnerWidth: dimensions.viewportInnerSize.width,
    viewportInnerHeight: dimensions.viewportInnerSize.height,
    lastRowHeight: lastRowId !== undefined ? apiRef.current.unstable_getRowHeight(lastRowId) : 0,
    lastColumnWidth: lastColumn?.computedWidth ?? 0,
    rowsMeta: gridRowsMetaSelector(apiRef.current.state),
    columnPositions: gridColumnPositionsSelector(apiRef),
    rows: currentPage.rows,
    range: currentPage.range,
    pinnedColumns: gridVisiblePinnedColumnDefinitionsSelector(apiRef),
    visibleColumns
  };
}
function computeRenderContext(inputs, scrollPosition, scrollCache) {
  let renderContext;
  if (!inputs.enabled) {
    renderContext = {
      firstRowIndex: 0,
      lastRowIndex: inputs.rows.length,
      firstColumnIndex: 0,
      lastColumnIndex: inputs.visibleColumns.length
    };
  } else {
    const {
      top,
      left
    } = scrollPosition;
    const realLeft = Math.abs(left) + inputs.leftPinnedWidth;

    // Clamp the value because the search may return an index out of bounds.
    // In the last index, this is not needed because Array.slice doesn't include it.
    const firstRowIndex = Math.min(getNearestIndexToRender(inputs, top, {
      atStart: true,
      lastPosition: inputs.rowsMeta.positions[inputs.rowsMeta.positions.length - 1] + inputs.lastRowHeight
    }), inputs.rowsMeta.positions.length - 1);
    const lastRowIndex = inputs.autoHeight ? firstRowIndex + inputs.rows.length : getNearestIndexToRender(inputs, top + inputs.viewportInnerHeight);
    let firstColumnIndex = 0;
    let lastColumnIndex = inputs.columnPositions.length;
    if (inputs.enabledForColumns) {
      let hasRowWithAutoHeight = false;
      const [firstRowToRender, lastRowToRender] = getIndexesToRender({
        firstIndex: firstRowIndex,
        lastIndex: lastRowIndex,
        minFirstIndex: 0,
        maxLastIndex: inputs.rows.length,
        bufferBefore: scrollCache.buffer.rowBefore,
        bufferAfter: scrollCache.buffer.rowAfter,
        positions: inputs.rowsMeta.positions,
        lastSize: inputs.lastRowHeight
      });
      for (let i = firstRowToRender; i < lastRowToRender && !hasRowWithAutoHeight; i += 1) {
        const row = inputs.rows[i];
        hasRowWithAutoHeight = inputs.apiRef.current.rowHasAutoHeight(row.id);
      }
      if (!hasRowWithAutoHeight) {
        firstColumnIndex = binarySearch(realLeft, inputs.columnPositions, {
          atStart: true,
          lastPosition: inputs.columnsTotalWidth
        });
        lastColumnIndex = binarySearch(realLeft + inputs.viewportInnerWidth, inputs.columnPositions);
      }
    }
    renderContext = {
      firstRowIndex,
      lastRowIndex,
      firstColumnIndex,
      lastColumnIndex
    };
  }
  const actualRenderContext = deriveRenderContext(inputs, renderContext, scrollCache);
  return actualRenderContext;
}
function getNearestIndexToRender(inputs, offset, options) {
  const lastMeasuredIndexRelativeToAllRows = inputs.apiRef.current.getLastMeasuredRowIndex();
  let allRowsMeasured = lastMeasuredIndexRelativeToAllRows === Infinity;
  if (inputs.range?.lastRowIndex && !allRowsMeasured) {
    // Check if all rows in this page are already measured
    allRowsMeasured = lastMeasuredIndexRelativeToAllRows >= inputs.range.lastRowIndex;
  }
  const lastMeasuredIndexRelativeToCurrentPage = clamp(lastMeasuredIndexRelativeToAllRows - (inputs.range?.firstRowIndex || 0), 0, inputs.rowsMeta.positions.length);
  if (allRowsMeasured || inputs.rowsMeta.positions[lastMeasuredIndexRelativeToCurrentPage] >= offset) {
    // If all rows were measured (when no row has "auto" as height) or all rows before the offset
    // were measured, then use a binary search because it's faster.
    return binarySearch(offset, inputs.rowsMeta.positions, options);
  }

  // Otherwise, use an exponential search.
  // If rows have "auto" as height, their positions will be based on estimated heights.
  // In this case, we can skip several steps until we find a position higher than the offset.
  // Inspired by https://github.com/bvaughn/react-virtualized/blob/master/source/Grid/utils/CellSizeAndPositionManager.js
  return exponentialSearch(offset, inputs.rowsMeta.positions, lastMeasuredIndexRelativeToCurrentPage, options);
}

/**
 * Accepts as input a raw render context (the area visible in the viewport) and adds
 * computes the actual render context based on pinned elements, buffer dimensions and
 * spanning.
 */
function deriveRenderContext(inputs, nextRenderContext, scrollCache) {
  const [firstRowToRender, lastRowToRender] = getIndexesToRender({
    firstIndex: nextRenderContext.firstRowIndex,
    lastIndex: nextRenderContext.lastRowIndex,
    minFirstIndex: 0,
    maxLastIndex: inputs.rows.length,
    bufferBefore: scrollCache.buffer.rowBefore,
    bufferAfter: scrollCache.buffer.rowAfter,
    positions: inputs.rowsMeta.positions,
    lastSize: inputs.lastRowHeight
  });
  const [initialFirstColumnToRender, lastColumnToRender] = getIndexesToRender({
    firstIndex: nextRenderContext.firstColumnIndex,
    lastIndex: nextRenderContext.lastColumnIndex,
    minFirstIndex: inputs.pinnedColumns.left.length,
    maxLastIndex: inputs.visibleColumns.length - inputs.pinnedColumns.right.length,
    bufferBefore: scrollCache.buffer.columnBefore,
    bufferAfter: scrollCache.buffer.columnAfter,
    positions: inputs.columnPositions,
    lastSize: inputs.lastColumnWidth
  });
  const firstColumnToRender = getFirstNonSpannedColumnToRender({
    firstColumnToRender: initialFirstColumnToRender,
    apiRef: inputs.apiRef,
    firstRowToRender,
    lastRowToRender,
    visibleRows: inputs.rows
  });
  return {
    firstRowIndex: firstRowToRender,
    lastRowIndex: lastRowToRender,
    firstColumnIndex: firstColumnToRender,
    lastColumnIndex: lastColumnToRender
  };
}
/**
 * Use binary search to avoid looping through all possible positions.
 * The `options.atStart` provides the possibility to match for the first element that
 * intersects the screen, even if said element's start position is before `offset`. In
 * other words, we search for `offset + width`.
 */
function binarySearch(offset, positions, options = undefined, sliceStart = 0, sliceEnd = positions.length) {
  if (positions.length <= 0) {
    return -1;
  }
  if (sliceStart >= sliceEnd) {
    return sliceStart;
  }
  const pivot = sliceStart + Math.floor((sliceEnd - sliceStart) / 2);
  const position = positions[pivot];
  let isBefore;
  if (options?.atStart) {
    const width = (pivot === positions.length - 1 ? options.lastPosition : positions[pivot + 1]) - position;
    isBefore = offset - width < position;
  } else {
    isBefore = offset <= position;
  }
  return isBefore ? binarySearch(offset, positions, options, sliceStart, pivot) : binarySearch(offset, positions, options, pivot + 1, sliceEnd);
}
function exponentialSearch(offset, positions, index, options = undefined) {
  let interval = 1;
  while (index < positions.length && Math.abs(positions[index]) < offset) {
    index += interval;
    interval *= 2;
  }
  return binarySearch(offset, positions, options, Math.floor(index / 2), Math.min(index, positions.length));
}
function getIndexesToRender({
  firstIndex,
  lastIndex,
  bufferBefore,
  bufferAfter,
  minFirstIndex,
  maxLastIndex,
  positions,
  lastSize
}) {
  const firstPosition = positions[firstIndex] - bufferBefore;
  const lastPosition = positions[lastIndex] + bufferAfter;
  const firstIndexPadded = binarySearch(firstPosition, positions, {
    atStart: true,
    lastPosition: positions[positions.length - 1] + lastSize
  });
  const lastIndexPadded = binarySearch(lastPosition, positions);
  return [clamp(firstIndexPadded, minFirstIndex, maxLastIndex), clamp(lastIndexPadded, minFirstIndex, maxLastIndex)];
}
export function areRenderContextsEqual(context1, context2) {
  if (context1 === context2) {
    return true;
  }
  return context1.firstRowIndex === context2.firstRowIndex && context1.lastRowIndex === context2.lastRowIndex && context1.firstColumnIndex === context2.firstColumnIndex && context1.lastColumnIndex === context2.lastColumnIndex;
}
export function computeOffsetLeft(columnPositions, renderContext, direction, pinnedLeftLength) {
  const factor = direction === 'ltr' ? 1 : -1;
  const left = factor * (columnPositions[renderContext.firstColumnIndex] ?? 0) - (columnPositions[pinnedLeftLength] ?? 0);
  return Math.abs(left);
}
function directionForDelta(dx, dy) {
  if (dx === 0 && dy === 0) {
    return ScrollDirection.NONE;
  }
  /* eslint-disable */
  if (Math.abs(dy) >= Math.abs(dx)) {
    if (dy > 0) {
      return ScrollDirection.DOWN;
    } else {
      return ScrollDirection.UP;
    }
  } else {
    if (dx > 0) {
      return ScrollDirection.RIGHT;
    } else {
      return ScrollDirection.LEFT;
    }
  }
  /* eslint-enable */
}
function bufferForDirection(mode, direction, rowBufferPx, columnBufferPx, verticalBuffer, horizontalBuffer) {
  if (mode === 'rtl') {
    switch (direction) {
      case ScrollDirection.LEFT:
        direction = ScrollDirection.RIGHT;
        break;
      case ScrollDirection.RIGHT:
        direction = ScrollDirection.LEFT;
        break;
      default:
    }
  }
  switch (direction) {
    case ScrollDirection.NONE:
      return {
        rowAfter: rowBufferPx,
        rowBefore: rowBufferPx,
        columnAfter: columnBufferPx,
        columnBefore: columnBufferPx
      };
    case ScrollDirection.LEFT:
      return {
        rowAfter: 0,
        rowBefore: 0,
        columnAfter: 0,
        columnBefore: horizontalBuffer
      };
    case ScrollDirection.RIGHT:
      return {
        rowAfter: 0,
        rowBefore: 0,
        columnAfter: horizontalBuffer,
        columnBefore: 0
      };
    case ScrollDirection.UP:
      return {
        rowAfter: 0,
        rowBefore: verticalBuffer,
        columnAfter: 0,
        columnBefore: 0
      };
    case ScrollDirection.DOWN:
      return {
        rowAfter: verticalBuffer,
        rowBefore: 0,
        columnAfter: 0,
        columnBefore: 0
      };
    default:
      // eslint unable to figure out enum exhaustiveness
      throw new Error('unreachable');
  }
}